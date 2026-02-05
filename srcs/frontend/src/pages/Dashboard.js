import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { CreateCircleModal, CreateTaskModal, InviteModal, JoinCircleModal, TaskDetailModal, ConfirmationModal } from '../components/DashboardModals';
import Sudoku from './Sudoku';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardTopbar from '../components/DashboardTopbar';
import DashboardSettings from '../components/DashboardSettings';
import DashboardMembers from '../components/DashboardMembers';
import DashboardTasks from '../components/DashboardTasks'; // Ensure this import exists
import DashboardChat from '../components/DashboardChat';
import Toast from '../components/Toast';

const Dashboard = () => {
	// Layout States
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
	const [comboOpen, setComboOpen] = useState(false);
	const [activeView, setActiveView] = useState('dashboard');
	const [darkMode, setDarkMode] = useState(true);

	useEffect(() => {
		document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
	}, [darkMode]);
	const toggleTheme = () => setDarkMode(!darkMode);

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			if (mobile) setSidebarOpen(false);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Feature States
	const [chatOpen, setChatOpen] = useState(false);

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

	// Notification State
	const [toasts, setToasts] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [showNotifications, setShowNotifications] = useState(false);
	const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

	// Modal States
	const [showCreateCircle, setShowCreateCircle] = useState(false);
	const [showCreateTask, setShowCreateTask] = useState(false);
	const [showInvite, setShowInvite] = useState(false);
	const [showJoin, setShowJoin] = useState(false);
	const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
	const [circleToLeave, setCircleToLeave] = useState(null);

	const showToast = (content, sender = 'System') => {
		setToasts(prev => [...prev, {
			id: Date.now(),
			sender,
			content,
			raw_data: {}
		}]);
	};


	const handleNotificationClick = async (notif) => {
		if (notif.type === 'direct_message') {
			// Find user object from members list of current circle
			// If not found, we might need a better way, but for now scan all circles
			let targetUser = null;
			for (const c of myCircles) {
				const member = c.members.find(m => m.id === notif.sender_id);
				if (member) {
					targetUser = member;
					break;
				}
			}

			// Fallback if not found in any circle (unlikely if they are chatting)
			if (!targetUser) {
				targetUser = { id: notif.sender_id, username: notif.sender };
			}

			startDM(targetUser);
		} else if (notif.type === 'circle_message') {
			// Find circle
			const circle = myCircles.find(c => c.name === notif.circle_id || c.id === Number(notif.circle_id));
			if (circle) {
				setSelectedEnv(circle);
				setActiveChatMode('circle');
				setChatOpen(true);
			}
		} else if (['task_assigned', 'note_created', 'checklist_created', 'task_completed'].includes(notif.type)) {
			// Find circle and switch
			const circle = myCircles.find(c => c.id === Number(notif.circle_id));
			if (circle) {
				setSelectedEnv(circle);

				// Fetch and open task
				try {
					const token = localStorage.getItem('token');
					const res = await fetch(`/api/tasks/${notif.task_id}/`, {
						headers: { 'Authorization': `Token ${token}` }
					});
					if (res.ok) {
						const task = await res.json();
						setSelectedTask(task);
						setShowTaskDetail(true);
					}
				} catch (e) {
					console.error("Failed to open task from notification", e);
				}
			}
		}
		// Remove from list
		setNotifications(prev => prev.filter(n => n.id !== notif.id));
		setShowNotifications(false);
	};

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
				showToast("Member kicked successfully");
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
				showToast('Error kicking member: ' + (JSON.stringify(err.error) || res.statusText), 'Error');
			}
		} catch (e) { console.error(e); showToast('Network error', 'Error'); }
	};

	const handleLeaveCircle = (circleId) => {
		setCircleToLeave(circleId);
		setShowLeaveConfirm(true);
	};

	const executeLeaveCircle = async () => {
		if (!circleToLeave) return;
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/circles/${circleToLeave}/leave/`, {
				method: 'POST',
				headers: { 'Authorization': `Token ${token}` }
			});

			if (res.ok) {
				showToast("You have left the circle.");
				// Remove from myCircles
				const updatedCircles = myCircles.filter(c => c.id !== circleToLeave);
				setMyCircles(updatedCircles);
				// Update selectedEnv
				if (updatedCircles.length > 0) setSelectedEnv(updatedCircles[0]);
				else setSelectedEnv(null);
				setActiveView('dashboard');
			} else {
				showToast("Failed to leave circle.", "Error");
			}
		} catch (e) { console.error(e); }
		setShowLeaveConfirm(false);
		setCircleToLeave(null);
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

	// Notification WebSocket
	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) return;

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws/notifications/?token=${token}`;
		const notifWs = new WebSocket(wsUrl);

		notifWs.onopen = () => console.log("Notification WS Connected");

		notifWs.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'notification' && data.data) {
					const notif = data.data;
					// Add to toasts (popup)
					setToasts(prev => [...prev, {
						id: Date.now(),
						sender: notif.sender,
						content: notif.message,
						raw_data: notif
					}]);

					// Add to history
					setNotifications(prev => [{
						id: Date.now(),
						type: notif.type,
						sender: notif.sender,
						sender_id: notif.sender_id, // Important for DM
						circle_id: notif.circle_id, // Important for Circle
						task_id: notif.task_id,     // Important for Task
						content: notif.message,
						timestamp: new Date()
					}, ...prev]);
				}
			} catch (e) { console.error("Notification parse error", e); }
		};

		return () => notifWs.close();
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
				showToast("Authentication token missing. Please login again.", "Error");
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

	// Auto-select circle if none selected but circles exist
	useEffect(() => {
		if (myCircles.length > 0 && !selectedEnv) {
			setSelectedEnv(myCircles[0]);
		}
	}, [myCircles, selectedEnv]);

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
				showToast("Circle settings updated!");
			} else {
				showToast("Failed to update circle name.", "Error");
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
				showToast("Profile updated successfully!");
				localStorage.setItem('user', JSON.stringify(updatedUser));
				window.location.reload();
			} else {
				const err = await res.json();
				showToast('Update failed: ' + JSON.stringify(err), 'Error');
			}
		} catch (err) {
			console.error(err);
			showToast("Network error", 'Error');
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
	const openChat = () => { setChatOpen(true); };
	const openSettings = () => { setActiveView('settings'); };

	const openTaskDetail = (task) => {
		setSelectedTask(task);
		setShowTaskDetail(true);
	};


	return (
		<div className="dashboard-container">
			<div className="toast-container position-fixed bottom-0 end-0 p-3">
				{toasts.map(toast => (
					<Toast
						key={toast.id}
						message={{ sender: toast.sender, content: toast.content }}
						onClose={() => removeToast(toast.id)}
						onClick={() => {
							handleNotificationClick({
								type: toast.sender === 'System' ? 'system' : (toast.content.startsWith('DM from') ? 'direct_message' : 'circle_message'),
								...toast.raw_data
							});
							removeToast(toast.id);
						}}
					/>
				))}
			</div>
			
			<DashboardSidebar
				sidebarOpen={sidebarOpen}
				toggleSidebar={toggleSidebar}
				activeView={activeView}
				setActiveView={setActiveView}
				chatOpen={chatOpen}
				setChatOpen={setChatOpen}
				openChat={openChat}
				isMobile={isMobile}
			/>

			{isMobile && (sidebarOpen || chatOpen) && (
				<div className="modal-backdrop fade show modal-backdrop-custom" onClick={() => {
					if (sidebarOpen) setSidebarOpen(false);
					if (chatOpen) setChatOpen(false);
				}}></div>
			)}

			<div className="main-content">
				<DashboardTopbar
					comboOpen={comboOpen}
					toggleCombo={toggleCombo}
					toggleSidebar={toggleSidebar}
					selectedEnv={selectedEnv}
					myCircles={myCircles}
					selectEnv={selectEnv}
					setShowInvite={setShowInvite}
					notifications={notifications}
					showNotifications={showNotifications}
					setShowNotifications={setShowNotifications}
					handleNotificationClick={handleNotificationClick}
					setNotifications={setNotifications}
					user={user}
					openSettings={openSettings}
					startDM={startDM}
					darkMode={darkMode}
					toggleTheme={toggleTheme}
					isMobile={isMobile}
					handleLeaveCircle={handleLeaveCircle}
				/>

				<main className={`content-area view-${activeView}`}>
					{activeView === 'sudoku' ? (
						<Sudoku circleId={selectedEnv?.id} showToast={showToast} />
					) : activeView === 'settings' ? (
						<DashboardSettings
							profileData={profileData}
							setProfileData={setProfileData}
							handleUpdateProfile={handleUpdateProfile}
							handleFileChange={handleFileChange}
							handleLogout={handleLogout}
							selectedEnv={selectedEnv}
							user={user}
							editingCircleName={editingCircleName}
							setEditingCircleName={setEditingCircleName}
							editingDescription={editingDescription}
							setEditingDescription={setEditingDescription}
							handleUpdateCircle={handleUpdateCircle}
						/>
					) : activeView === 'members' ? (
						<DashboardMembers
							selectedEnv={selectedEnv}
							user={user}
							onlineUsers={onlineUsers}
							startDM={startDM}
							setPreselectedAssignee={setPreselectedAssignee}
							setShowCreateTask={setShowCreateTask}
							handleKick={handleKick}
							handleLeaveCircle={handleLeaveCircle}
						/>
					) : (
						<DashboardTasks
							selectedEnv={selectedEnv}
							tasks={tasks}
							setPreselectedAssignee={setPreselectedAssignee}
							setShowCreateTask={setShowCreateTask}
							openTaskDetail={openTaskDetail}
							onCreateCircle={() => selectEnv('create')}
						/>
					)}
				</main>
			</div>

			<DashboardChat
				chatOpen={chatOpen}
				setChatOpen={setChatOpen}
				activeChatMode={activeChatMode}
				dmTarget={dmTarget}
				returnToTeamChat={returnToTeamChat}
				selectedEnv={selectedEnv}
				messages={messages}
				user={user}
				sendMessage={sendMessage}
				chatInput={chatInput}
				setChatInput={setChatInput}
				isConnected={isConnected}
				messagesEndRef={messagesEndRef}
				isMobile={isMobile}
			/>

			{/* Modal Components */}
			<CreateCircleModal isOpen={showCreateCircle} onClose={() => setShowCreateCircle(false)} onSuccess={(newCircle) => { setMyCircles([...myCircles, newCircle]); setSelectedEnv(newCircle); }} showToast={showToast} />
			<InviteModal isOpen={showInvite} onClose={() => setShowInvite(false)} inviteCode={selectedEnv?.invite_code} showToast={showToast} />
			<JoinCircleModal isOpen={showJoin} onClose={() => setShowJoin(false)} onSuccess={(c) => { if (!myCircles.find(x => x.id === c.id)) setMyCircles([...myCircles, c]); setSelectedEnv(c); }} showToast={showToast} />
			<CreateTaskModal
				isOpen={showCreateTask}
				onClose={() => setShowCreateTask(false)}
				circleId={selectedEnv?.id}
				members={selectedEnv?.members}
				onSuccess={() => fetchTasks(selectedEnv.id)}
				initialAssignee={preselectedAssignee}
				showToast={showToast}
			/>
			<TaskDetailModal
				isOpen={showTaskDetail}
				onClose={() => setShowTaskDetail(false)}
				task={selectedTask}
				user={user}
				onUpdate={() => fetchTasks(selectedEnv.id)}
				onDelete={deleteTask}
				showToast={showToast}
			/>
			<ConfirmationModal
				isOpen={showLeaveConfirm}
				onClose={() => setShowLeaveConfirm(false)}
				onConfirm={executeLeaveCircle}
				title="Leave Circle"
				message={`Are you sure you want to leave ${myCircles.find(c => c.id === circleToLeave)?.name || 'this circle'}?`}
				confirmText="Leave"
				isDestructive={true}
			/>
		</div>
	);
};

export default Dashboard;
