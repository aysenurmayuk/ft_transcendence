import React, { useState, useEffect } from 'react';
import { CreateCircleModal, CreateTaskModal, InviteModal, JoinCircleModal } from '../components/DashboardModals';
import './Dashboard.css';

const Dashboard = () => {
	// Sidebar default open on large screens
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [comboOpen, setComboOpen] = useState(false);
	const [selectedEnv, setSelectedEnv] = useState(null); // Full Circle Object or null
	const [myCircles, setMyCircles] = useState([]);
	const [tasks, setTasks] = useState([]);
	const [user, setUser] = useState({});

	// Chat State
	const [chatOpen, setChatOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [chatInput, setChatInput] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const ws = React.useRef(null);
	const messagesEndRef = React.useRef(null);

	// Modal States
	const [showCreateCircle, setShowCreateCircle] = useState(false);
	const [showCreateTask, setShowCreateTask] = useState(false);
	const [showInvite, setShowInvite] = useState(false);
	const [showJoin, setShowJoin] = useState(false);


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
				console.log('Tasks loaded:', data);
			} else {
				alert('Failed to load tasks');
			}
		} catch (e) {
			console.error(e);
			alert('Network error loading tasks');
		}
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

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// WebSocket Connection
	useEffect(() => {
		if (chatOpen && selectedEnv) {
			const token = localStorage.getItem('token');
			if (!token) {
				alert("Authentication token missing. Please login again.");
				return;
			}

			if (ws.current) ws.current.close();

			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			// Use standard WS URL
			const wsUrl = `${protocol}//${window.location.host}/ws/chat/${selectedEnv.id}/?token=${token}`;
			console.log("Connecting to WS:", wsUrl);
			ws.current = new WebSocket(wsUrl);

			ws.current.onopen = () => {
				console.log("WS Connected");
				setIsConnected(true);
			};

			ws.current.onmessage = (event) => {
				const data = JSON.parse(event.data);
				setMessages(prev => [...prev, {
					content: data.message,
					sender: data.sender, // {username: ..., id: ...}
					timestamp: new Date().toISOString()
				}]);
				scrollToBottom();
			};

			ws.current.onclose = (e) => {
				console.log("WS Disconnected", e.code, e.reason);
				setIsConnected(false);
			};

			ws.current.onerror = (e) => {
				console.error("WS Error", e);
			};

			return () => {
				if (ws.current) {
					ws.current.close();
					ws.current = null;
					setIsConnected(false);
				}
			};
		}
	}, [chatOpen, selectedEnv]);

	// Fetch messages when switching to chat
	useEffect(() => {
		if (chatOpen && selectedEnv) {
			fetchMessages(selectedEnv.id);
		}
	}, [chatOpen, selectedEnv]);

	const sendMessage = (e) => {
		e.preventDefault();
		if (!chatInput.trim() || !isConnected || !ws.current) {
			return;
		}

		ws.current.send(JSON.stringify({
			message: chatInput,
			sender_id: user.user_id
		}));
		setChatInput('');
	};

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) setUser(JSON.parse(userData));
		fetchCircles();
	}, []);

	useEffect(() => {
		if (selectedEnv) {
			fetchTasks(selectedEnv.id);
		} else {
			setTasks([]);
		}
	}, [selectedEnv]);

	const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
	const toggleCombo = () => setComboOpen(!comboOpen);

	const selectEnv = (circle) => {
		if (circle === 'create') {
			setShowCreateCircle(true);
		} else if (circle === 'join') {
			setShowJoin(true);
		} else {
			setSelectedEnv(circle);
		}
		setComboOpen(false);
	};

	const handleCreateCircleSuccess = (newCircle) => {
		setMyCircles([...myCircles, newCircle]);
		setSelectedEnv(newCircle);
	};

	const handleJoinCircleSuccess = (circle) => {
		// Check if already in list
		if (!myCircles.find(c => c.id === circle.id)) {
			setMyCircles([...myCircles, circle]);
		}
		setSelectedEnv(circle);
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
						<div className="nav-item active" onClick={() => setChatOpen(false)}>
							<div className="icon">🏠</div>
							<div className="label">Dashboard</div>
						</div>
						<div className={`nav-item ${chatOpen ? 'active' : ''}`} onClick={() => setChatOpen(!chatOpen)}>
							<div className="icon">💬</div>
							<div className="label">Chat</div>
						</div>
					</nav>
				</aside>

				{/* Right Content */}
				<div className="content-wrap">
					<header className="topbar">
						{/* Combobox for Circles */}
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
								<div className="combo-item" onClick={() => selectEnv('create')} style={{ color: '#818cf8. ' }}>
									+ Create New Circle
								</div>
								<div className="combo-item" onClick={() => selectEnv('join')}>
									# Join with Code
								</div>
							</div>
						</div>

						{/* Right top controls */}
						<div className="top-right">
							{selectedEnv && (
								<div className="dots" title="Invite Members">
									<div className="dot plus" onClick={() => setShowInvite(true)}>+</div>
								</div>
							)}
							<div className="profile">
								<span style={{ fontSize: '20px' }}>👤</span>
								<span>{user.username || 'Guest'}</span>
							</div>
						</div>
					</header>

					<main className="main">
						{!selectedEnv ? (
							<div className="hint" style={{ textAlign: 'center', marginTop: '100px', maxWidth: '600px', margin: '100px auto' }}>
								<h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Welcome to Planora</h3>
								<p>To get started, please select an existing circle from the top left menu, or create a new one to invite your friends!</p>
							</div>
						) : (
							<>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
									<div>
										<h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>Tasks</h2>
										<p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Manage projects in {selectedEnv.name}</p>
									</div>
									<button className="primary-btn" type="button" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => setShowCreateTask(true)}>
										+ New Task
									</button>
								</div>

								<div className="grid">
									{tasks.map(task => (
										<div className="card" key={task.id}>
											<div className="tiny" style={{
												background: task.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
												color: task.status === 'done' ? '#4ade80' : '#a5b4fc'
											}}>
												{task.status.replace('_', ' ')}
											</div>
											<div style={{ Flex: 1 }}>
												<div className="card-title">{task.title}</div>
												<div className="card-subtitle">
													{task.description || 'No description provided.'}
												</div>
											</div>
											<div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<span style={{ fontSize: '12px', color: '#64748b' }}>Created by</span>
												<span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>{task.created_by?.username}</span>
											</div>
										</div>
									))}

									{tasks.length === 0 && (
										<div className="hint" style={{ gridColumn: '1 / -1', marginTop: '0', textAlign: 'center', padding: '60px' }}>
											<div style={{ fontSize: '40px', marginBottom: '20px' }}>📝</div>
											<h3>No tasks found</h3>
											<p>Create a new task to get started with your team.</p>
										</div>
									)}
								</div>
							</>
						)}
					</main>
				</div>

				{/* Chat Sidebar (Fixed Right) */}
				<div className={`chat-sidebar ${chatOpen ? 'open' : ''}`} style={{
					position: 'fixed',
					top: '70px', /* Matches topbar height */
					right: chatOpen ? '0' : '-350px',
					width: '350px',
					height: 'calc(100vh - 70px)',
					background: 'rgba(15, 23, 42, 0.95)',
					backdropFilter: 'blur(20px)',
					borderLeft: '1px solid rgba(255,255,255,0.1)',
					transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					display: 'flex',
					flexDirection: 'column',
					zIndex: 100,
					boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
				}}>
					{selectedEnv ? (
						<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
							<div style={{
								padding: '16px 20px',
								borderBottom: '1px solid rgba(255,255,255,0.1)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								background: 'rgba(255,255,255,0.02)'
							}}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span style={{ fontSize: '18px' }}>💬</span>
									<div>
										<h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Team Chat</h2>
										<div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
											Status: {ws.current ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.current.readyState] : 'NULL'} |
											Env: {JSON.stringify(selectedEnv?.id)}
										</div>
									</div>
								</div>
								<button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>
									&times;
								</button>
							</div>

							<div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{messages.map((msg, idx) => {
									const isMyMessage = msg.sender?.username === user.username;
									return (
										<div key={idx} style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: isMyMessage ? 'flex-end' : 'flex-start',
											marginBottom: '8px'
										}}>
											{!isMyMessage && (
												<div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px' }}>
													{msg.sender?.username}
												</div>
											)}
											<div style={{
												background: isMyMessage ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#334155',
												color: '#fff',
												padding: '10px 14px',
												borderRadius: isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
												maxWidth: '85%',
												wordBreak: 'break-word',
												fontSize: '14px',
												lineHeight: '1.5',
												boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
											}}>
												{msg.content}
											</div>
											<div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', marginRight: isMyMessage ? '4px' : '0', marginLeft: !isMyMessage ? '4px' : '0' }}>
												{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</div>
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>

							<form onSubmit={sendMessage} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
								<div style={{
									display: 'flex',
									gap: '8px',
									background: 'rgba(255,255,255,0.05)',
									borderRadius: '24px',
									padding: '6px',
									border: '1px solid rgba(255,255,255,0.05)'
								}}>
									<input
										style={{
											flex: 1,
											background: 'transparent',
											border: 'none',
											padding: '8px 12px',
											color: '#fff',
											outline: 'none',
											opacity: isConnected ? 1 : 0.5
										}}
										value={chatInput}
										onChange={e => setChatInput(e.target.value)}
										placeholder={isConnected ? "Message..." : "Connecting..."}
										disabled={!isConnected}
									/>
									<button type="submit" disabled={!isConnected} style={{
										width: '36px',
										height: '36px',
										borderRadius: '50%',
										border: 'none',
										background: isConnected ? '#6366f1' : '#475569',
										color: '#fff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: isConnected ? 'pointer' : 'default',
										transition: 'all 0.2s'
									}}>
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
									</button>
								</div>
							</form>
						</div>
					) : (
						<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '20px', textAlign: 'center' }}>
							<div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
							<p>Select a circle to start chatting with your team.</p>
						</div>
					)}
				</div>

			</div>

			{/* Modals */}
			<CreateCircleModal
				isOpen={showCreateCircle}
				onClose={() => setShowCreateCircle(false)}
				onSuccess={handleCreateCircleSuccess}
			/>

			<InviteModal
				isOpen={showInvite}
				onClose={() => setShowInvite(false)}
				inviteCode={selectedEnv?.invite_code}
			/>

			<CreateTaskModal
				isOpen={showCreateTask}
				onClose={() => setShowCreateTask(false)}
				circleId={selectedEnv?.id}
				onSuccess={() => fetchTasks(selectedEnv.id)}
			/>

			<JoinCircleModal
				isOpen={showJoin}
				onClose={() => setShowJoin(false)}
				onSuccess={handleJoinCircleSuccess}
			/>

		</div>
	);
};

export default Dashboard;
