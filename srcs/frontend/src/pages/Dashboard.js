import React, { useState, useEffect } from 'react';
import { CreateCircleModal, CreateTaskModal, InviteModal, JoinCircleModal, TaskDetailModal, MembersModal, SudokuModal } from '../components/DashboardModals';
import './Dashboard.css';

const Dashboard = () => {
	// Layout States
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [comboOpen, setComboOpen] = useState(false);

	// Feature States
	const [chatOpen, setChatOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	// Data States
	const [selectedEnv, setSelectedEnv] = useState(null); // Full Circle Object
	const [myCircles, setMyCircles] = useState([]);
	const [tasks, setTasks] = useState([]);
	const [user, setUser] = useState({}); // Current user data

	// Detail Modal State
	const [selectedTask, setSelectedTask] = useState(null);
	const [showTaskDetail, setShowTaskDetail] = useState(false);
	const [preselectedAssignee, setPreselectedAssignee] = useState('');

	// Chat States
	const [activeChatMode, setActiveChatMode] = useState('circle'); // 'circle' or 'dm'
	const [dmTarget, setDmTarget] = useState(null); // User object we are chatting with
	const [messages, setMessages] = useState([]);
	const [chatInput, setChatInput] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const ws = React.useRef(null);
	const messagesEndRef = React.useRef(null);

	// Settings States
	const [profileData, setProfileData] = useState({
		username: '',
		email: '',
		password: '',
		avatar: null, // File object
		avatarUrl: ''  // Preview URL
	});
	const [editingCircleName, setEditingCircleName] = useState('');
	const [editingDescription, setEditingDescription] = useState('');

	// Modal States
	const [showCreateCircle, setShowCreateCircle] = useState(false);
	const [showCreateTask, setShowCreateTask] = useState(false);
	const [showInvite, setShowInvite] = useState(false);
	const [showJoin, setShowJoin] = useState(false);
	const [showMembers, setShowMembers] = useState(false);
	const [showSudoku, setShowSudoku] = useState(false);

	const handleKick = async (circleId, memberId) => {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/circles/${circleId}/kick_member/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ member_id: memberId })
			});

			if (res.ok) {
				alert("Member kicked successfully");
				// Refresh circle data
				fetchCircles(); // This updates myCircles which updates selectedEnv eventually
				// But we need to update selectedEnv explicitly if it doesn't auto-update
				// Actually fetchCircles updates myCircles, but selectedEnv is a separate object reference.
				// We should probably re-fetch the specific circle or update local state.
				const updatedCircle = { ...selectedEnv };
				updatedCircle.members = updatedCircle.members.filter(m => m.id !== memberId);
				setSelectedEnv(updatedCircle);

				// Also update the list in myCircles
				setMyCircles(prev => prev.map(c => c.id === circleId ? updatedCircle : c));
			} else {
				const err = await res.json();
				alert('Error kicking member: ' + (JSON.stringify(err.error) || res.statusText));
			}
		} catch (e) { console.error(e); alert('Network error'); }
	};

	const handleLeaveCircle = async (circleId) => {
		if (!window.confirm("Are you sure you want to leave this circle?")) return;

		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/circles/${circleId}/leave/`, {
				method: 'POST',
				headers: { 'Authorization': `Token ${token}` }
			});

			if (res.ok) {
				alert("You have left the circle.");
				// Remove from myCircles
				const updatedCircles = myCircles.filter(c => c.id !== circleId);
				setMyCircles(updatedCircles);
				// Update selectedEnv
				if (updatedCircles.length > 0) setSelectedEnv(updatedCircles[0]);
				else setSelectedEnv(null);
				setShowMembers(false);
			} else {
				alert("Failed to leave circle.");
			}
		} catch (e) { console.error(e); }
	};

	const [onlineUsers, setOnlineUsers] = useState(new Set());

	// Initial Data Fetch
	useEffect(() => {
		const fetchUserData = async () => {
			const token = localStorage.getItem('token');
			if (!token) return;
			try {
				const res = await fetch('/api/profile/me/', {
					headers: { 'Authorization': `Token ${token}` }
				});
				if (res.ok) {
					const userData = await res.json();
					setUser(userData);
					setProfileData({
						username: userData.username,
						email: userData.email,
						password: '',
						avatar: null,
						avatarUrl: userData.avatar
					});
					localStorage.setItem('user', JSON.stringify(userData));
				}
			} catch (e) { console.error(e); }
		};

		const localUser = localStorage.getItem('user');
		if (localUser) {
			const parsed = JSON.parse(localUser);
			setUser(parsed);
			setProfileData(prev => ({ ...prev, username: parsed.username, email: parsed.email }));
		}

		fetchUserData();
		fetchCircles();

		// Connect to Presence WebSocket
		const token = localStorage.getItem('token');
		if (token) {
			const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
			const wsUrl = `${wsScheme}://${window.location.host}/ws/online/?token=${token}`;
			console.log("Connecting to Presence WS:", wsUrl);
			const presenceWs = new WebSocket(wsUrl);

			presenceWs.onopen = () => {
				console.log("Presence WS Connected");
			};

			presenceWs.onerror = (e) => {
				console.error("Presence WS Error:", e);
			};

			presenceWs.onclose = (e) => {
				console.log("Presence WS Closed:", e.code, e.reason);
			};

			presenceWs.onmessage = (e) => {
				const data = JSON.parse(e.data);
				if (data.type === 'initial_state') {
					setOnlineUsers(new Set(data.online_users.map(id => Number(id))));
				} else if (data.type === 'user_status') {
					setOnlineUsers(prev => {
						const newSet = new Set(prev);
						const uid = Number(data.user_id);
						if (data.status === 'online') newSet.add(uid);
						else newSet.delete(uid);
						return newSet;
					});
				}
			};

			return () => presenceWs.close();
		}
	}, []);

	const fetchCircles = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;
		try {
			const res = await fetch('/api/circles/my_circles/', {
				headers: { 'Authorization': `Token ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setMyCircles(data);
				if (data.length > 0 && !selectedEnv) setSelectedEnv(data[0]);
			}
		} catch (e) { console.error(e); }
	};

	const fetchTasks = async (circleId) => {
		const token = localStorage.getItem('token');
		if (!token) return;
		try {
			const res = await fetch(`/api/tasks/?circle_id=${circleId}`, {
				headers: { 'Authorization': `Token ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setTasks(data);
				// Also update selected task if open
				if (selectedTask) {
					const updated = data.find(t => t.id === selectedTask.id);
					if (updated) setSelectedTask(updated);
					else { setSelectedTask(null); setShowTaskDetail(false); }
				}
			}
		} catch (e) { console.error(e); }
	};

	const fetchMessages = async (circleId) => {
		const token = localStorage.getItem('token');
		if (!token) return;
		try {
			const res = await fetch(`/api/messages/?circle_id=${circleId}`, {
				headers: { 'Authorization': `Token ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setMessages(data);
				scrollToBottom();
			}
		} catch (e) { console.error(e); }
	};

	const fetchDMMessages = async (targetId) => {
		const token = localStorage.getItem('token');
		if (!token) return;
		try {
			const res = await fetch(`/api/direct-messages/?target_id=${targetId}`, {
				headers: { 'Authorization': `Token ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setMessages(data);
				scrollToBottom();
			}
		} catch (e) { console.error(e); }
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// WebSocket Connection
	useEffect(() => {
		if ((activeChatMode === 'circle' && selectedEnv) || (activeChatMode === 'dm' && dmTarget)) {
			const token = localStorage.getItem('token');
			if (!token) {
				alert("Authentication token missing. Please login again.");
				return;
			}
			if (ws.current) ws.current.close();

			setMessages([]); // Clear messages on switch

			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			let wsUrl = '';

			if (activeChatMode === 'circle') {
				wsUrl = `${protocol}//${window.location.host}/ws/chat/${selectedEnv.id}/?token=${token}`;
			} else {
				wsUrl = `${protocol}//${window.location.host}/ws/chat/dm/${dmTarget.id}/?token=${token}`;
			}

			ws.current = new WebSocket(wsUrl);

			ws.current.onopen = () => {
				setIsConnected(true);
			};

			ws.current.onmessage = (event) => {
				const data = JSON.parse(event.data);

				if (data.type === 'task_update') {
					if (selectedEnv) fetchTasks(selectedEnv.id);
				} else if (data.type === 'chat_message' || data.message) {
					setMessages(prev => [...prev, {
						content: data.message,
						sender: data.sender,
						timestamp: new Date().toISOString()
					}]);
					scrollToBottom();
				}
			};

			ws.current.onclose = () => {
				setIsConnected(false);
			};

			ws.current.onerror = (e) => {
				console.error("WS Error", e);
			};

			// Initial fetch based on mode
			if (activeChatMode === 'circle') {
				fetchMessages(selectedEnv.id);
			} else {
				fetchDMMessages(dmTarget.id);
			}

			return () => {
				if (ws.current) {
					ws.current.close();
					ws.current = null;
					setIsConnected(false);
				}
			};
		}
	}, [selectedEnv, activeChatMode, dmTarget]);

	useEffect(() => {
		if (selectedEnv) {
			fetchTasks(selectedEnv.id);
		} else {
			setTasks([]);
		}
	}, [selectedEnv]);

	// Helpers
	const sendMessage = (e) => {
		e.preventDefault();
		if (!chatInput.trim() || !isConnected || !ws.current) return;
		ws.current.send(JSON.stringify({
			message: chatInput,
			sender_id: user.id,
			target_id: activeChatMode === 'dm' ? dmTarget.id : undefined
		}));
		setChatInput('');
	};

	const startDM = (targetUser) => {
		if (targetUser.id === user.id) return; // Can't chat with self
		setDmTarget(targetUser);
		setActiveChatMode('dm');
		setChatOpen(true);
		setSettingsOpen(false);
	};

	const returnToTeamChat = () => {
		setActiveChatMode('circle');
		setDmTarget(null);
	};

	const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
	const toggleCombo = () => setComboOpen(!comboOpen);

	const selectEnv = (circle) => {
		if (circle === 'create') setShowCreateCircle(true);
		else if (circle === 'join') setShowJoin(true);
		else setSelectedEnv(circle);
		setComboOpen(false);
	};

	useEffect(() => {
		if (selectedEnv) {
			setEditingCircleName(selectedEnv.name);
			setEditingDescription(selectedEnv.description || '');
		}
	}, [selectedEnv]);

	const handleUpdateCircle = async (e) => {
		e.preventDefault();
		if (!selectedEnv || !editingCircleName) return;

		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/circles/${selectedEnv.id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({
					name: editingCircleName,
					description: editingDescription
				})
			});

			if (res.ok) {
				const updatedCircle = await res.json();
				setSelectedEnv(updatedCircle);
				setMyCircles(prev => prev.map(c => c.id === updatedCircle.id ? updatedCircle : c));
				alert("Circle settings updated!");
			} else {
				alert("Failed to update circle name.");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleUpdateProfile = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('token');
		const formData = new FormData();
		formData.append('username', profileData.username);
		formData.append('email', profileData.email);
		if (profileData.password) formData.append('password', profileData.password);
		if (profileData.avatar) formData.append('avatar', profileData.avatar);
		if (profileData.removeAvatar) formData.append('remove_avatar', 'true');

		try {
			const res = await fetch('/api/profile/me/', {
				method: 'PUT',
				headers: {
					'Authorization': `Token ${token}`
				},
				body: formData
			});

			if (res.ok) {
				const updatedUser = await res.json();
				setUser(updatedUser);
				setSettingsOpen(false);
				alert("Profile updated successfully!");
				localStorage.setItem('user', JSON.stringify(updatedUser));
				window.location.reload();
			} else {
				const err = await res.json();
				alert('Update failed: ' + JSON.stringify(err));
			}
		} catch (err) {
			console.error(err);
			alert("Network error");
		}
	};

	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setProfileData({
				...profileData,
				avatar: e.target.files[0],
				avatarUrl: URL.createObjectURL(e.target.files[0])
			});
		}
	};

	// Task Actions (Passed to Modal)
	const deleteTask = async (taskId) => {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/tasks/${taskId}/`, {
				method: 'DELETE',
				headers: { 'Authorization': `Token ${token}` }
			});
			if (res.ok) {
				setShowTaskDetail(false);
				fetchTasks(selectedEnv.id);
			}
		} catch (e) { console.error(e); }
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/';
	};

	// Close one sidebar if other opens
	const openChat = () => { setSettingsOpen(false); setChatOpen(true); };
	const openSettings = () => { setChatOpen(false); setSettingsOpen(true); };

	const openTaskDetail = (task) => {
		setSelectedTask(task);
		setShowTaskDetail(true);
	};


	return (
		<div className="dashboard-body">
			<div className="frame">

				{/* Left Sidebar */}
				<aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
					<div className="sidebar-header">
						<button className="toggle" onClick={toggleSidebar}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</button>
						<div className="sidebar-title">PLANORA</div>
					</div>

					<nav className="nav">
						<div className="nav-item active" onClick={() => { setChatOpen(false); setSettingsOpen(false); }}>
							<div className="icon">🏠</div>
							<div className="label">Dashboard</div>
						</div>
						<div className="nav-item" onClick={() => setShowMembers(true)}>
							<div className="icon">👥</div>
							<div className="label">Members</div>
						</div>
						<div className={`nav-item ${chatOpen ? 'active' : ''}`} onClick={() => chatOpen ? setChatOpen(false) : openChat()}>
							<div className="icon">💬</div>
							<div className="label">Chat</div>
						</div>
						<div className="nav-item" onClick={() => setShowSudoku(true)}>
							<div className="icon">🧩</div>
							<div className="label">Sudoku</div>
						</div>
						<div className={`nav-item ${settingsOpen ? 'active' : ''}`} onClick={() => settingsOpen ? setSettingsOpen(false) : openSettings()}>
							<div className="icon">⚙️</div>
							<div className="label">Settings</div>
						</div>
					</nav>
				</aside>

				{/* Right Content */}
				<div className="content-wrap">
					<header className="topbar">
						{/* Combobox */}
						<div className={`combo ${comboOpen ? 'open' : ''} `} id="combo">
							<button
								className="combo-btn"
								type="button"
								onClick={(e) => { e.stopPropagation(); toggleCombo(); }}
							>
								<span className="value">
									{selectedEnv ? selectedEnv.name : 'Select Circle'}
								</span>
								<div className="chev"></div>
							</button>
							<div className="combo-menu">
								{myCircles.map(circle => (
									<div key={circle.id} className="combo-item" onClick={() => selectEnv(circle)}>
										{circle.name}
									</div>
								))}
								<div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
								<div className="combo-item" onClick={() => selectEnv('create')} style={{ color: '#818cf8' }}>
									+ Create New Circle
								</div>
								<div className="combo-item" onClick={() => selectEnv('join')}>
									# Join with Code
								</div>
							</div>
						</div>

						{/* Right Top Controls */}
						<div className="top-right">
							{/* Avatar Stack */}
							{selectedEnv && selectedEnv.members && selectedEnv.members.length > 0 && (
								<div className="avatar-stack" style={{ marginRight: '16px' }}>
									{selectedEnv.members.slice(0, 3).map((member, i) => {
										// Generate consistent color
										let hash = 0;
										for (let k = 0; k < member.username.length; k++) {
											hash = member.username.charCodeAt(k) + ((hash << 5) - hash);
										}
										const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
										const color = '#' + '00000'.substring(0, 6 - c.length) + c;

										return (
											<div key={member.id} className="avatar-circle" title={member.username}
												style={{
													marginLeft: i > 0 ? '-12px' : '0',
													zIndex: 10 - i,
													background: member.avatar ? 'transparent' : color,
													cursor: member.id !== user.id ? 'pointer' : 'default'
												}}
												onClick={() => startDM(member)}>
												{member.avatar ?
													<img src={member.avatar} alt={member.username} /> :
													member.username.charAt(0).toUpperCase()
												}
											</div>
										);
									})}
									{selectedEnv.members.length > 3 && (
										<div className="avatar-circle more" style={{ marginLeft: '-12px', zIndex: 0 }}>...</div>
									)}
								</div>
							)}

							{selectedEnv && (
								<div className="dots" title="Invite Members" style={{ display: 'flex', gap: '8px' }}>
									<div className="dot plus" onClick={() => setShowInvite(true)}>+</div>
								</div>
							)}
							<div className="profile" onClick={openSettings}>
								{user.avatar ?
									<img src={user.avatar} alt="Me" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> :
									<span style={{ fontSize: '20px' }}>👤</span>
								}
								<span>{user.username || 'Guest'}</span>
							</div>
						</div>
					</header>

					<main className="main">
						{!selectedEnv ? (
							<div className="hint" style={{ textAlign: 'center', marginTop: '100px', maxWidth: '600px', margin: 'auto' }}>
								<h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Welcome to Planora</h3>
								<p>Select a circle or create a new one to get started.</p>
							</div>
						) : (
							<>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
									<div>
										<h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>Tasks</h2>
										<p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{selectedEnv.description}</p>
									</div>
									<button className="primary-btn" type="button" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => { setPreselectedAssignee(''); setShowCreateTask(true); }}>
										+ New Item
									</button>
								</div>

								<div className="grid">
									{tasks.map(task => (
										<div className="card" key={task.id}
											onClick={() => openTaskDetail(task)}
											style={{
												cursor: 'pointer',
												borderLeft: task.task_type === 'note' ? '4px solid #facc15' : task.task_type === 'checklist' ? '4px solid #38bdf8' : '4px solid #6366f1'
											}}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
												<div className="tiny" style={{
													background: task.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
													color: task.status === 'done' ? '#4ade80' : '#94a3b8',
													padding: '4px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase'
												}}>
													{task.task_type} {task.status === 'done' && '✓'}
												</div>
											</div>

											<div style={{ flex: 1, marginBottom: '10px' }}>
												<div className="card-title" style={{ fontSize: '16px' }}>{task.title}</div>
												{/* Simplified Content View */}
												<div className="card-subtitle" style={{ marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
													{task.task_type === 'checklist'
														? `${task.checklist_items ? task.checklist_items.filter(i => i.is_checked).length : 0}/${task.checklist_items ? task.checklist_items.length : 0} items done`
														: (task.description || 'No preview available')}
												</div>
											</div>

											{/* Footer - Minimal */}
											<div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												{task.task_type === 'assignment' && (
													<span style={{ fontSize: '12px', color: '#64748b' }}>Assigned: {task.assigned_to ? task.assigned_to.username : <span style={{ fontStyle: 'italic' }}>Everyone</span>}</span>
												)}
												<span style={{ fontSize: '11px', color: '#475569' }}>{new Date(task.created_at).toLocaleDateString()}</span>
											</div>
										</div>
									))}
								</div>
							</>
						)}
					</main>
				</div>

				{/* Settings Sidebar */}
				<div className={`settings-sidebar ${settingsOpen ? 'open' : ''}`}>
					<div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Profile Settings</h2>
						<button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
					</div>

					<form onSubmit={handleUpdateProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
							<div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: '#1e293b' }}>
								{profileData.avatarUrl ?
									<img src={profileData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
									<div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '40px', color: '#fff' }}>👤</div>
								}
							</div>
							<label htmlFor="avatar-upload" style={{ color: '#818cf8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
								Change Photo
								<input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
							</label>
						</div>
						{profileData.avatarUrl && (
							<button
								type="button"
								onClick={() => {
									setProfileData({ ...profileData, avatar: null, avatarUrl: '', removeAvatar: true });
								}}
								style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', alignSelf: 'center', marginTop: '10px' }}>
								Remove Avatar
							</button>
						)}
						<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
							<label style={{ fontSize: '13px', color: '#94a3b8' }}>Username</label>
							<input className="glass-input" type="text" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }} />
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
							<label style={{ fontSize: '13px', color: '#94a3b8' }}>Email</label>
							<input className="glass-input" type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }} />
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
							<label style={{ fontSize: '13px', color: '#94a3b8' }}>New Password (Optional)</label>
							<input className="glass-input" type="password" value={profileData.password} onChange={e => setProfileData({ ...profileData, password: e.target.value })} placeholder="Leave blank to keep current" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }} />
						</div>
						<button type="submit" className="primary-btn" style={{ justifyContent: 'center', marginTop: '12px' }}>Save Changes</button>

						<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '20px', paddingTop: '20px' }}>
							<button
								type="button"
								onClick={handleLogout}
								style={{
									width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)',
									color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
									borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
									display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
								}}
							>
								🚪 Logout
							</button>
						</div>
					</form>

					{selectedEnv && selectedEnv.admin && selectedEnv.admin.id === user.id && (
						<div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
							<h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Circle Settings</h2>
							<form onSubmit={handleUpdateCircle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
									<label style={{ fontSize: '13px', color: '#94a3b8' }}>Circle Name</label>
									<input
										className="glass-input"
										type="text"
										value={editingCircleName}
										onChange={e => setEditingCircleName(e.target.value)}
										style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
									/>
								</div>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
									<label style={{ fontSize: '13px', color: '#94a3b8' }}>Description</label>
									<textarea
										className="glass-input"
										value={editingDescription}
										onChange={e => setEditingDescription(e.target.value)}
										rows={3}
										style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none', resize: 'vertical' }}
									/>
								</div>
								<button type="submit" className="primary-btn" style={{ justifyContent: 'center' }}>Save Settings</button>
							</form>
						</div>
					)}
				</div>

				{/* Chat Sidebar */}
				<div className={`chat-sidebar ${chatOpen ? 'open' : ''}`}>
					<div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							{activeChatMode === 'dm' && (
								<button onClick={returnToTeamChat} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '4px' }}>
									←
								</button>
							)}
							<span style={{ fontSize: '18px' }}>{activeChatMode === 'dm' ? '👤' : '💬'}</span>
							<h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
								{activeChatMode === 'dm' ? (dmTarget ? dmTarget.username : 'Chat') : 'Team Chat'}
							</h2>
						</div>
						<button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
					</div>

					<div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{selectedEnv ? messages.map((msg, idx) => {
							const isMyMessage = msg.sender?.username === user.username;
							return (
								<div key={idx} style={{
									display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start', marginBottom: '8px'
								}}>
									{!isMyMessage && <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px' }}>{msg.sender?.username}</div>}
									<div style={{
										background: isMyMessage ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#334155',
										color: '#fff', padding: '10px 14px', borderRadius: isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
										maxWidth: '85%', wordBreak: 'break-word', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
									}}>
										{msg.content}
									</div>
								</div>
							);
						}) : <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
							{activeChatMode === 'dm' ? 'Start a conversation' : 'Select a circle to chat'}
						</div>}
						<div ref={messagesEndRef} />
					</div>

					{selectedEnv && (
						<form onSubmit={sendMessage} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
							<div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
								<input
									style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 12px', color: '#fff', outline: 'none', opacity: isConnected ? 1 : 0.5 }}
									value={chatInput}
									onChange={e => setChatInput(e.target.value)}
									placeholder={isConnected ? "Message..." : "Connecting..."}
									disabled={!isConnected}
								/>
								<button type="submit" disabled={!isConnected} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: isConnected ? '#6366f1' : '#475569', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isConnected ? 'pointer' : 'default' }}>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
								</button>
							</div>
						</form>
					)}
				</div>

			</div>

			{/* Modal Components */}
			<CreateCircleModal isOpen={showCreateCircle} onClose={() => setShowCreateCircle(false)} onSuccess={(newCircle) => { setMyCircles([...myCircles, newCircle]); setSelectedEnv(newCircle); }} />
			<InviteModal isOpen={showInvite} onClose={() => setShowInvite(false)} inviteCode={selectedEnv?.invite_code} />
			<JoinCircleModal isOpen={showJoin} onClose={() => setShowJoin(false)} onSuccess={(c) => { if (!myCircles.find(x => x.id === c.id)) setMyCircles([...myCircles, c]); setSelectedEnv(c); }} />
			<CreateTaskModal
				isOpen={showCreateTask}
				onClose={() => setShowCreateTask(false)}
				circleId={selectedEnv?.id}
				members={selectedEnv?.members}
				onSuccess={() => fetchTasks(selectedEnv.id)}
				initialAssignee={preselectedAssignee}
			/>
			<TaskDetailModal
				isOpen={showTaskDetail}
				onClose={() => setShowTaskDetail(false)}
				task={selectedTask}
				user={user}
				onUpdate={() => fetchTasks(selectedEnv.id)}
				onDelete={deleteTask}
			/>
			<MembersModal
				isOpen={showMembers}
				onClose={() => setShowMembers(false)}
				members={selectedEnv?.members || []}
				currentUserId={user.id}
				adminId={selectedEnv?.admin?.id}
				onKick={handleKick}
				circleId={selectedEnv?.id}
				onDM={(member) => {
					setShowMembers(false);
					startDM(member);
				}}
				onAssign={(member) => {
					setShowMembers(false);
					setPreselectedAssignee(member.id);
					setShowCreateTask(true);
				}}
				onLeave={handleLeaveCircle}
				onlineUsers={onlineUsers}
			/>
			<SudokuModal isOpen={showSudoku} onClose={() => setShowSudoku(false)} circleId={selectedEnv?.id} />
		</div>
	);
};

export default Dashboard;
