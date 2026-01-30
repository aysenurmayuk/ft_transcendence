import React, { useState } from 'react';
import Modal from './Modal';
import './AuthModals.css'; // Reusing styles

export const CreateCircleModal = ({ isOpen, onClose, onSuccess }) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('token');
		try {
			const res = await fetch('/api/circles/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ name, description })
			});
			if (res.ok) {
				const data = await res.json();
				alert('Circle created successfully!');
				onSuccess(data);
				onClose();
			} else {
				const err = await res.json();
				alert('Error creating circle: ' + (JSON.stringify(err) || res.statusText));
			}
		} catch (err) {
			console.error(err);
			alert('Network error');
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Create New Circle">
			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="form-group">
					<label>Circle Name</label>
					<input className="glass-input" value={name} onChange={e => setName(e.target.value)} required />
				</div>
				<div className="form-group">
					<label>Description</label>
					<input className="glass-input" value={description} onChange={e => setDescription(e.target.value)} />
				</div>
				<button type="submit" className="primary-btn">Create</button>
			</form>
		</Modal>
	);
};

export const CreateTaskModal = ({ isOpen, onClose, circleId, members, onSuccess, initialAssignee }) => {
	const [taskType, setTaskType] = useState('assignment'); // assignment, checklist, note
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignees, setAssignees] = useState([]);
	// Checklist state
	const [checklistItems, setChecklistItems] = useState([]);
	const [newItem, setNewItem] = useState('');

	const addChecklistItem = () => {
		if (newItem.trim()) {
			setChecklistItems([...checklistItems, { content: newItem, is_checked: false }]);
			setNewItem('');
		}
	};

	const removeChecklistItem = (index) => {
		setChecklistItems(checklistItems.filter((_, i) => i !== index));
	};

	const toggleAssignee = (memberId) => {
		if (memberId === 'everyone') {
			setAssignees([]);
		} else {
			if (assignees.includes(memberId)) {
				setAssignees(prev => prev.filter(id => id !== memberId));
			} else {
				setAssignees(prev => [...prev, memberId]);
			}
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('token');

		const payload = {
			title,
			description,
			circle_id: circleId,
			task_type: taskType,
		};

		if (taskType === 'assignment') {
			if (assignees.length > 0) payload.assignee_ids = assignees;
		} else if (taskType === 'checklist') {
			payload.checklist_items = checklistItems;
		}

		try {
			const res = await fetch('/api/tasks/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify(payload)
			});
			if (res.ok) {
				alert('Task created successfully!');
				// Reset form
				setTitle('');
				setDescription('');
				setChecklistItems([]);
				setAssignees([]);
				onSuccess();
				onClose();
			} else {
				const err = await res.json();
				alert('Error creating task: ' + (JSON.stringify(err) || res.statusText));
			}
		} catch (err) {
			console.error(err);
			alert('Network error');
		}
	};

	// Reset state on open
	React.useEffect(() => {
		if (isOpen) {
			setTaskType('assignment');
			setTitle('');
			setDescription('');
			setChecklistItems([]);
			if (initialAssignee) setAssignees([Number(initialAssignee)]);
			else setAssignees([]);
		}
	}, [isOpen, initialAssignee]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Item">
			<div className="task-type-selector" style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
				{['assignment', 'checklist', 'note'].map(type => (
					<button
						key={type}
						type="button"
						onClick={() => setTaskType(type)}
						style={{
							flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
							background: taskType === type ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
							color: taskType === type ? '#fff' : '#94a3b8',
							cursor: 'pointer', textTransform: 'capitalize', fontWeight: 500
						}}
					>
						{type}
					</button>
				))}
			</div>

			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="form-group">
					<label>Title</label>
					<input className="glass-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder={taskType === 'note' ? 'Note Title' : 'Task Title'} />
				</div>

				{taskType !== 'checklist' && (
					<div className="form-group">
						<label>{taskType === 'note' ? 'Content' : 'Description'}</label>
						<textarea
							className="glass-input"
							rows="3"
							value={description}
							onChange={e => setDescription(e.target.value)}
							style={{ resize: 'none', height: 'auto' }}
						/>
					</div>
				)}

				{taskType === 'assignment' && members && (
					<div className="form-group">
						<label>Assign To (Select multiple)</label>
						<div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
							{/* Everyone Option */}
							<div onClick={() => toggleAssignee('everyone')} style={{
								display: 'flex', alignItems: 'center', gap: '10px', padding: '6px',
								cursor: 'pointer', borderRadius: '4px',
								background: assignees.length === 0 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
								marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)'
							}}>
								<div style={{
									width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #6366f1',
									display: 'grid', placeItems: 'center',
									background: assignees.length === 0 ? '#6366f1' : 'transparent'
								}}>
									{assignees.length === 0 && <span style={{ fontSize: '12px', color: '#fff' }}>✓</span>}
								</div>
								<span style={{ color: '#fff', fontStyle: 'italic' }}>Everyone</span>
							</div>

							{members.map(m => (
								<div key={m.id} onClick={() => toggleAssignee(m.id)} style={{
									display: 'flex', alignItems: 'center', gap: '10px', padding: '6px',
									cursor: 'pointer', borderRadius: '4px',
									background: assignees.includes(m.id) ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
								}}>
									<div style={{
										width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #6366f1',
										display: 'grid', placeItems: 'center',
										background: assignees.includes(m.id) ? '#6366f1' : 'transparent'
									}}>
										{assignees.includes(m.id) && <span style={{ fontSize: '12px', color: '#fff' }}>✓</span>}
									</div>
									<span style={{ color: '#cbd5e1' }}>{m.username}</span>
								</div>
							))}
						</div>
						<small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Select specific members or choose Everyone.</small>
					</div>
				)}

				{taskType === 'checklist' && (
					<div className="form-group">
						<label>Checklist Items</label>
						<div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
							<input
								className="glass-input"
								value={newItem}
								onChange={e => setNewItem(e.target.value)}
								placeholder="Add item..."
								onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
							/>
							<button type="button" onClick={addChecklistItem} className="primary-btn" style={{ width: 'auto', padding: '0 16px' }}>+</button>
						</div>
						<div className="checklist-preview" style={{ maxHeight: '150px', overflowY: 'auto' }}>
							{checklistItems.map((item, idx) => (
								<div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '4px', borderRadius: '4px' }}>
									<span style={{ color: '#cbd5e1', fontSize: '13px' }}>{item.content}</span>
									<button type="button" onClick={() => removeChecklistItem(idx)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
								</div>
							))}
						</div>
					</div>
				)}

				<button type="submit" className="primary-btn">Create {taskType}</button>
			</form>
		</Modal>
	);
};

export const TaskDetailModal = ({ isOpen, onClose, task, user, onUpdate, onDelete, members }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editChecklistItems, setEditChecklistItems] = useState([]);
	const [editAssignees, setEditAssignees] = useState([]);

	React.useEffect(() => {
		if (task) {
			setEditTitle(task.title);
			setEditDescription(task.description);
			setEditChecklistItems(task.checklist_items ? JSON.parse(JSON.stringify(task.checklist_items)) : []);
			// Map assignees objects to IDs
			setEditAssignees(task.assignees ? task.assignees.map(u => u.id) : []);
			setIsEditing(false);
		}
	}, [task, isOpen]);

	if (!task) return null;

	const handleChecklistChange = (index, value) => {
		const newItems = [...editChecklistItems];
		newItems[index] = { ...newItems[index], content: value };
		setEditChecklistItems(newItems);
	};

	const removeEditChecklistItem = (index) => {
		setEditChecklistItems(editChecklistItems.filter((_, i) => i !== index));
	};

	const addEditChecklistItem = () => {
		setEditChecklistItems([...editChecklistItems, { content: '', is_checked: false }]);
	};

	const toggleEditAssignee = (memberId) => {
		if (memberId === 'everyone') {
			setEditAssignees([]);
		} else {
			if (editAssignees.includes(memberId)) {
				setEditAssignees(prev => prev.filter(id => id !== memberId));
			} else {
				setEditAssignees(prev => [...prev, memberId]);
			}
		}
	};

	const handleSave = async () => {
		const token = localStorage.getItem('token');

		const payload = {
			title: editTitle,
			description: editDescription
		};

		if (task.task_type === 'checklist') {
			payload.checklist_items = editChecklistItems;
		} else if (task.task_type === 'assignment') {
			payload.assignee_ids = editAssignees;
		}

		try {
			const res = await fetch(`/api/tasks/${task.id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify(payload)
			});
			if (res.ok) {
				onUpdate();
				setIsEditing(false);
			} else {
				alert('Failed to update task');
			}
		} catch (e) { console.error(e); }
	};

	const toggleChecklistItem = async (itemId) => {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/tasks/${task.id}/toggle_check/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ item_id: itemId })
			});
			if (res.ok) {
				onUpdate();
			}
		} catch (e) { console.error(e); }
	};

	const toggleTaskStatus = async () => {
		const token = localStorage.getItem('token');
		const newStatus = task.status === 'done' ? 'todo' : 'done';
		try {
			const res = await fetch(`/api/tasks/${task.id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ status: newStatus })
			});
			if (res.ok) onUpdate();
		} catch (e) { console.error(e); }
	};

	// Determine if user can complete (Assignment logic)
	// Can complete if assigned to me OR if no one is assigned (assuming 'everyone')
	const isAssignedToMe = task.assignees && task.assignees.some(u => u.id === user.id);
	const isAssignedToNoOne = !task.assignees || task.assignees.length === 0;
	const canComplete = task.task_type === 'assignment' && (isAssignedToMe || isAssignedToNoOne);

	// Determine if user can delete (Creator only)
	const canDelete = task.created_by.id === user.id;
	const canEdit = task.created_by.id === user.id;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Item' : task.title}>
			<div style={{ marginBottom: '20px' }}>
				{isEditing ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
						<div>
							<label style={{ fontSize: '12px', color: '#94a3b8' }}>Title</label>
							<input
								className="glass-input"
								value={editTitle}
								onChange={e => setEditTitle(e.target.value)}
							/>
						</div>

						{task.task_type === 'checklist' ? (
							<div>
								<label style={{ fontSize: '12px', color: '#94a3b8' }}>Checklist Items</label>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
									{editChecklistItems.map((item, idx) => (
										<div key={idx} style={{ display: 'flex', gap: '8px' }}>
											<input
												className="glass-input"
												value={item.content}
												onChange={e => handleChecklistChange(idx, e.target.value)}
												placeholder="Item content"
											/>
											<button
												type="button"
												onClick={() => removeEditChecklistItem(idx)}
												style={{
													color: '#f87171',
													background: 'rgba(239, 68, 68, 0.1)',
													border: 'none',
													borderRadius: '4px',
													cursor: 'pointer',
													padding: '0 12px'
												}}
											>
												&times;
											</button>
										</div>
									))}
									<button
										type="button"
										onClick={addEditChecklistItem}
										className="primary-btn"
										style={{ padding: '8px', fontSize: '13px', marginTop: '4px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)' }}
									>
										+ Add Item
									</button>
								</div>
							</div>
						) : (
							<div>
								<label style={{ fontSize: '12px', color: '#94a3b8' }}>{task.task_type === 'note' ? 'Content' : 'Description'}</label>
								<textarea
									className="glass-input"
									rows="5"
									value={editDescription}
									onChange={e => setEditDescription(e.target.value)}
									style={{ resize: 'vertical' }}
								/>
							</div>
						)}
						{/* Edit Assignees for Assignment */}
						{task.task_type === 'assignment' && members && (
							<div>
								<label style={{ fontSize: '12px', color: '#94a3b8' }}>Assignees</label>
								<div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', marginTop: '4px' }}>
									{/* Everyone Option */}
									<div onClick={() => toggleEditAssignee('everyone')} style={{
										display: 'flex', alignItems: 'center', gap: '10px', padding: '6px',
										cursor: 'pointer', borderRadius: '4px',
										background: editAssignees.length === 0 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
										marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)'
									}}>
										<div style={{
											width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #6366f1',
											display: 'grid', placeItems: 'center',
											background: editAssignees.length === 0 ? '#6366f1' : 'transparent'
										}}>
											{editAssignees.length === 0 && <span style={{ fontSize: '12px', color: '#fff' }}>✓</span>}
										</div>
										<span style={{ color: '#fff', fontStyle: 'italic' }}>Everyone</span>
									</div>

									{members.map(m => (
										<div key={m.id} onClick={() => toggleEditAssignee(m.id)} style={{
											display: 'flex', alignItems: 'center', gap: '10px', padding: '6px',
											cursor: 'pointer', borderRadius: '4px',
											background: editAssignees.includes(m.id) ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
										}}>
											<div style={{
												width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #6366f1',
												display: 'grid', placeItems: 'center',
												background: editAssignees.includes(m.id) ? '#6366f1' : 'transparent'
											}}>
												{editAssignees.includes(m.id) && <span style={{ fontSize: '12px', color: '#fff' }}>✓</span>}
											</div>
											<span style={{ color: '#cbd5e1' }}>{m.username}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				) : (
					<>
						<div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', marginBottom: '12px', textTransform: 'capitalize' }}>
							{task.task_type} • {task.status.replace('_', ' ')}
						</div>
						{task.task_type === 'checklist' ? (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{task.checklist_items && task.checklist_items.map(item => (
									<div key={item.id} onClick={() => toggleChecklistItem(item.id)} style={{
										display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
										padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)',
										opacity: item.is_checked ? 0.5 : 1
									}}>
										<div style={{
											width: '20px', height: '20px', borderRadius: '4px', border: '2px solid #64748b',
											display: 'grid', placeItems: 'center', background: item.is_checked ? '#64748b' : 'transparent', flexShrink: 0
										}}>
											{item.is_checked && <span style={{ fontSize: '14px', color: '#fff' }}>✓</span>}
										</div>
										<span style={{ fontSize: '15px', color: '#cbd5e1', textDecoration: item.is_checked ? 'line-through' : 'none' }}>{item.content}</span>
									</div>
								))}
							</div>
						) : (
							<div style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', lineHeight: '1.5' }}>
								{task.description || <em style={{ color: '#64748b' }}>No details provided.</em>}
							</div>
						)}
					</>
				)}
			</div>

			<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				{!isEditing && (
					<div>
						{task.task_type === 'assignment' && (
							<div style={{ fontSize: '13px', color: '#94a3b8' }}>
								Assigned to: <span style={{ color: '#fff' }}>
									{task.assignees && task.assignees.length > 0
										? task.assignees.map(u => u.username).join(', ')
										: 'Everyone'}
								</span>
							</div>
						)}
						<div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
							Created by {task.created_by.username}
						</div>
					</div>
				)}

				<div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
					{isEditing ? (
						<>
							<button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
								Cancel
							</button>
							<button onClick={handleSave} className="primary-btn" style={{ padding: '8px 16px' }}>
								Save
							</button>
						</>
					) : (
						<>
							{canEdit && (
								<button onClick={() => setIsEditing(true)} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
									Edit
								</button>
							)}
							{canDelete && (
								<button onClick={() => { if (window.confirm('Delete this task?')) onDelete(task.id); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
									Delete
								</button>
							)}
							{canComplete && (
								<button
									onClick={toggleTaskStatus}
									className={task.status === 'done' ? '' : 'primary-btn'}
									style={{
										padding: '8px 16px',
										fontSize: '14px',
										...(task.status === 'done' ? { background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer' } : {})
									}}>
									{task.status === 'done' ? 'Mark Undone' : 'Complete'}
								</button>
							)}
						</>
					)}
				</div>
			</div>
		</Modal>
	);
};

export const InviteModal = ({ isOpen, onClose, inviteCode }) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Invite Members">
			<div style={{ textAlign: 'center', color: 'var(--text)' }}>
				<p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Share this code with others to let them join this circle:</p>
				<div
					style={{
						background: 'rgba(255,255,255,0.1)',
						padding: '20px',
						borderRadius: '12px',
						fontSize: '32px',
						fontWeight: '800',
						letterSpacing: '4px',
						marginBottom: '20px',
						border: '1px dashed rgba(255,255,255,0.3)'
					}}
				>
					{inviteCode || 'LOADING'}
				</div>
				<button className="primary-btn" onClick={() => {
					navigator.clipboard.writeText(inviteCode);
					alert('Copied to clipboard!');
				}}>
					Copy Code
				</button>
			</div>
		</Modal>
	);
};

export const JoinCircleModal = ({ isOpen, onClose, onSuccess }) => {
	const [code, setCode] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('token');
		try {
			const res = await fetch('/api/circles/join_by_code/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ invite_code: code })
			});
			if (res.ok) {
				const data = await res.json();
				onSuccess(data.circle);
				onClose();
			} else {
				alert('Invalid Code');
			}
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Join a Circle">
			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="form-group">
					<label>Invite Code</label>
					<input
						className="glass-input"
						value={code}
						onChange={e => setCode(e.target.value.toUpperCase())}
						placeholder="e.g. A1B2C3D4"
						required
					/>
				</div>
				<button type="submit" className="primary-btn">Join</button>
			</form>
		</Modal>
	);
}

export const MembersModal = ({ isOpen, onClose, members, currentUserId, adminId, onKick, circleId, onDM, onAssign, onLeave, onlineUsers }) => {
	const isAdmin = currentUserId === adminId;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Circle Members">
			<div style={{ maxHeight: '400px', overflowY: 'auto' }}>
				{members.map(member => {
					const isOnline = onlineUsers && onlineUsers.has(Number(member.id));
					return (
						<div key={member.id} style={{
							display: 'flex', alignItems: 'center', justifyContent: 'space-between',
							padding: '12px', marginBottom: '8px',
							background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
							border: member.id === adminId ? '1px solid #6366f1' : 'none'
						}}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<div style={{
									width: '36px', height: '36px', borderRadius: '50%', background: '#334155',
									overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
									position: 'relative'
								}}>
									{member.avatar ?
										<img src={member.avatar} alt={member.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
										<span style={{ fontSize: '14px', color: '#cbd5e1' }}>{member.username.charAt(0).toUpperCase()}</span>
									}
									{/* Online Status Indicator */}
									<div style={{
										position: 'absolute', bottom: '0', right: '0',
										width: '10px', height: '10px', borderRadius: '50%',
										backgroundColor: isOnline ? '#22c55e' : '#ef4444',
										border: '2px solid #1e293b'
									}} title={isOnline ? "Online" : "Offline"} />
								</div>
								<div>
									<div style={{ color: '#fff', fontWeight: 500 }}>
										{member.username}
										{member.id === currentUserId && <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '12px' }}> (You)</span>}
									</div>
									<div style={{ fontSize: '12px', color: member.id === adminId ? '#818cf8' : '#94a3b8' }}>
										{member.id === adminId ? 'Admin' : 'Member'}
									</div>
								</div>
							</div>

							<div style={{ display: 'flex', gap: '8px' }}>
								{member.id === currentUserId && !isAdmin && (
									<button
										onClick={() => onLeave(circleId)}
										style={{
											background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
											border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px',
											cursor: 'pointer', fontSize: '12px', fontWeight: 600
										}}
									>
										Leave
									</button>
								)}

								{member.id !== currentUserId && (
									<>
										<button
											onClick={() => onDM(member)}
											title="Send Message"
											style={{
												background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
												border: 'none', padding: '6px 8px', borderRadius: '6px',
												cursor: 'pointer', fontSize: '14px'
											}}
										>
											💬
										</button>
										<button
											onClick={() => onAssign(member)}
											title="Assign Task"
											style={{
												background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
												border: 'none', padding: '6px 8px', borderRadius: '6px',
												cursor: 'pointer', fontSize: '14px'
											}}
										>
											📋
										</button>
									</>
								)}
								{isAdmin && member.id !== currentUserId && (
									<button
										onClick={() => { if (window.confirm(`Kick ${member.username}?`)) onKick(circleId, member.id); }}
										style={{
											background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
											border: 'none', padding: '6px 12px', borderRadius: '6px',
											cursor: 'pointer', fontSize: '12px', fontWeight: 600
										}}>
										Kick
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</Modal >
	);
};

// Lazy load Sudoku to avoid circular deps if any, but regular import is fine here
import Sudoku from '../pages/Sudoku';

export const SudokuModal = ({ isOpen, onClose, circleId }) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Sudoku">
			{/* Use a wrapper to ensure scrollability if game is tall */}
			<div style={{ maxHeight: '80vh', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
				<Sudoku circleId={circleId} />
			</div>
		</Modal>
	);
};
