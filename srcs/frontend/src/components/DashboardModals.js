import React, { useState } from 'react';
import BootstrapModal from './BootstrapModal';
import './DashboardModals.css';

export const CreateCircleModal = ({ isOpen, onClose, onSuccess, showToast }) => {
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
				showToast('Circle created successfully!');
				onSuccess(data);
				onClose();
			} else {
				const err = await res.json();
				showToast('Error creating circle: ' + (JSON.stringify(err) || res.statusText), 'Error');
			}
		} catch (err) {
			console.error(err);
			showToast('Network error', 'Error');
		}
	};

	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Create New Circle">
			<div className="text-center mb-4">
				<div className="modal-icon-wrapper primary mb-3">
					<i className="fa-solid fa-layer-group modal-icon-lg"></i>
				</div>
				<p className="text-muted small">Create a new workspace for your team to collaborate.</p>
			</div>
			<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
				<div>
					<label className="form-label text-muted small fw-medium">Circle Name</label>
					<input
						className="form-control modal-input"
						value={name}
						onChange={e => setName(e.target.value)}
						required
						placeholder="e.g. Engineering Team"
					/>
				</div>
				<div>
					<label className="form-label text-muted small fw-medium">Description</label>
					<textarea
						className="form-control textarea-resize-v modal-input"
						value={description}
						onChange={e => setDescription(e.target.value)}
						rows="3"
						placeholder="What is this circle about?"
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary w-100 mt-2 modal-btn-primary"
				>
					<i className="fa-solid fa-plus me-2"></i>
					Create Circle
				</button>
			</form>
		</BootstrapModal>
	);
};

export const CreateTaskModal = ({ isOpen, onClose, circleId, members, onSuccess, initialAssignee, showToast }) => {
	const [taskType, setTaskType] = useState('assignment');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignees, setAssignees] = useState([]);
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
			if (assignees.length > 0) {
				payload.assignee_ids = assignees;
				payload.assignee_id = assignees[0];
			}
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
				showToast('Task created successfully!');
				setTitle('');
				setDescription('');
				setChecklistItems([]);
				setAssignees([]);
				onSuccess();
				onClose();
			} else {
				const err = await res.json();
				showToast('Error creating task: ' + (JSON.stringify(err) || res.statusText), 'Error');
			}
		} catch (err) {
			console.error(err);
			showToast('Network error', 'Error');
		}
	};

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
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Add New Item">
			<div className="d-flex gap-2 mb-3">
				{['assignment', 'checklist', 'note'].map(type => (
					<button
						key={type}
						type="button"
						className={`btn flex-fill text-capitalize task-type-btn ${type} ${taskType === type ? 'active' : ''}`}
						onClick={() => setTaskType(type)}
					>
						{type}
					</button>
				))}
			</div>

			<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
				<div>
					<label className="form-label text-muted small fw-medium">Title</label>
					<input
						className="form-control border-secondary modal-input"
						value={title}
						onChange={e => setTitle(e.target.value)}
						required
						placeholder={taskType === 'note' ? 'Note Title' : 'Task Title'}
					/>
				</div>

				{taskType !== 'checklist' && (
					<div>
						<label className="form-label text-muted small fw-medium">
							{taskType === 'note' ? 'Content' : 'Description'}
						</label>
						<textarea
							className="form-control border-secondary textarea-resize-v modal-input"
							rows="3"
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>
				)}

				{taskType === 'assignment' && members && (
					<div>
						<label className="form-label text-muted small fw-medium">Assign To (Optional)</label>
						<div className="border border-secondary rounded p-2 modal-input" style={{ maxHeight: '200px', overflowY: 'auto' }}>
							<div
								onClick={() => toggleAssignee('everyone')}
								className={`p-2 mb-1 rounded cursor-pointer ${assignees.length === 0 ? 'bg-primary text-white' : 'text-muted'}`}
							>
								-- Everyone --
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
					<div>
						<label className="form-label text-muted small fw-medium">Checklist Items</label>
						<div className="input-group mb-2">
							<input
								className="form-control border-secondary checklist-input-start"
								value={newItem}
								onChange={e => setNewItem(e.target.value)}
								placeholder="Add item..."
								onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
							/>
							<button
								type="button"
								onClick={addChecklistItem}
								className="btn btn-primary checklist-btn-end"
							>
								<i className="fa-solid fa-plus"></i>
							</button>
						</div>
						<div className="list-group checklist-container">
							{checklistItems.map((item, idx) => (
								<div
									key={idx}
									className="list-group-item border-secondary d-flex justify-content-between align-items-center py-2 checklist-item-row"
								>
									<span className="small">{item.content}</span>
									<button
										type="button"
										onClick={() => removeChecklistItem(idx)}
										className="btn btn-sm btn-link text-danger p-0"
										aria-label="Remove"
									>
										<i className="fa-solid fa-xmark"></i>
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				<button
					type="submit"
					className="btn btn-primary w-100 mt-2 modal-btn-primary"
				>
					<i className="fa-solid fa-check me-2"></i>
					Create {taskType}
				</button>
			</form>
		</BootstrapModal>
	);
};


export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="text-center p-3">
				{isDestructive && (
					<div className="modal-icon-wrapper destructive mx-auto mb-3">
						<i className="fa-solid fa-triangle-exclamation modal-icon-lg"></i>
					</div>
				)}
				<p className="mb-4 text-muted">{message}</p>
				<div className="d-flex gap-2 justify-content-center">
					<button
						onClick={onClose}
						className="btn btn-outline-secondary confirm-btn"
					>
						{cancelText}
					</button>
					<button
						onClick={() => { onConfirm(); onClose(); }}
						className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'} confirm-btn`}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</BootstrapModal>
	);
};

export const TaskDetailModal = ({ isOpen, onClose, task, user, onUpdate, onDelete, showToast }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [editChecklistItems, setEditChecklistItems] = useState([]);
	const [editAssignees, setEditAssignees] = useState([]);

	React.useEffect(() => {
		if (task) {
			setEditTitle(task.title);
			setEditDescription(task.description);
			setEditChecklistItems(task.checklist_items ? JSON.parse(JSON.stringify(task.checklist_items)) : []);
			// Map assignees objects to IDs
			let ids = [];
			if (task.assignees) ids = task.assignees.map(u => u.id);
			else if (task.assigned_to) ids = [task.assigned_to.id];
			
			setEditAssignees(ids);
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
			if (editAssignees.length > 0) payload.assignee_id = editAssignees[0];
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
				showToast('Failed to update task', 'Error');
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

	const canComplete = task.task_type === 'assignment' && task.status !== 'done' && (!task.assigned_to || task.assigned_to.id === user.id);
	const canDelete = task.created_by.id === user.id;
	const canEdit = task.created_by.id === user.id;

	return (
		<>
			<div className={`task-theme-${task.task_type}`}>
				<BootstrapModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Item' : task.title}>
					<div className="mb-3">
						{isEditing ? (
							<div className="d-flex flex-column gap-3">
								<div>
									<label className="form-label text-muted small fw-medium">Title</label>
									<input
										className="form-control border-secondary modal-input"
										value={editTitle}
										onChange={e => setEditTitle(e.target.value)}
									/>
								</div>
								{task.task_type !== 'checklist' && (
									<div>
										<label className="form-label text-muted small fw-medium">
											{task.task_type === 'note' ? 'Content' : 'Description'}
										</label>
										<textarea
											className="form-control border-secondary textarea-resize-v modal-input"
											rows="5"
											value={editDescription}
											onChange={e => setEditDescription(e.target.value)}
										/>
									</div>
								)}
							</div>
						) : (
							<>
								<div
									className="badge text-capitalize mb-3 task-detail-badge"
								>
									<i className={`fa-solid ${task.task_type === 'note' ? 'fa-note-sticky' :
										task.task_type === 'checklist' ? 'fa-list-check' : 'fa-clipboard-check'
										} me-2`}></i>
									{task.task_type} • {task.status.replace('_', ' ')}
								</div>
								{task.task_type === 'checklist' ? (
									<div className="d-flex flex-column gap-2">
										{task.checklist_items && task.checklist_items.map(item => (
											<div
												key={item.id}
												onClick={() => toggleChecklistItem(item.id)}
												className={`d-flex align-items-center gap-3 p-3 rounded border checklist-item-row cursor-pointer ${item.is_checked ? 'opacity-50 checked' : ''}`}
											>
												<div
													className={`d-flex align-items-center justify-content-center rounded flex-shrink-0 checklist-checkbox ${item.is_checked ? 'checked' : ''}`}
													style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid' }}
												>
													{item.is_checked && <i className="fa-solid fa-check text-white" style={{ fontSize: '10px' }}></i>}
												</div>
												<span className={`${item.is_checked ? 'text-decoration-line-through' : ''}`}>
													{item.content}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="task-detail-description">
										{task.description || <em className="text-muted">No details provided.</em>}
									</div>
								)}
							</>
						)}
					</div>

					<div className="task-detail-footer">
						{!isEditing && (
							<div>
								{task.task_type === 'assignment' && (
									<div className="small text-muted mb-1">
										<i className="fa-solid fa-user me-2" style={{ fontSize: '11px' }}></i>
										Assigned to: <span className="text-body fw-medium">
											{task.assignees && task.assignees.length > 0 
                                                ? task.assignees.map(u => u.username).join(', ')
                                                : (task.assigned_to ? task.assigned_to.username : 'Everyone')}
										</span>
									</div>
								)}
								<div className="text-secondary task-meta-text">
									<i className="fa-regular fa-user me-2" style={{ fontSize: '11px' }}></i>
									Created by {task.created_by.username}
								</div>
							</div>
						)}

						<div className="d-flex gap-2 ms-auto">
							{isEditing ? (
								<>
									<button
										onClick={() => setIsEditing(false)}
										className="btn btn-outline-secondary btn-sm task-action-btn"
									>
										Cancel
									</button>
									<button
										onClick={handleSave}
										className="btn btn-primary btn-sm task-action-btn"
									>
										<i className="fa-solid fa-check me-1"></i>
										Save
									</button>
								</>
							) : (
								<>
									{canEdit && (
										<button
											onClick={() => setIsEditing(true)}
											className="btn btn-outline-primary btn-sm task-action-btn"
										>
											<i className="fa-solid fa-pen me-1"></i>
											Edit
										</button>
									)}
									{canDelete && (
										<button
											onClick={() => setShowDeleteConfirm(true)}
											className="btn btn-outline-danger btn-sm task-action-btn"
										>
											<i className="fa-solid fa-trash me-1"></i>
											Delete
										</button>
									)}
									{canComplete && (
										<button
											onClick={toggleTaskStatus}
											className="btn btn-success btn-sm task-action-btn"
										>
											<i className="fa-solid fa-check me-1"></i>
											Complete
										</button>
									)}
								</>
							)}
						</div>
					</div>
				</BootstrapModal>
			</div>

			<ConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={() => onDelete(task.id)}
				title="Delete Item"
				message="Are you sure you want to delete this item? This action cannot be undone."
				confirmText="Delete"
				isDestructive={true}
			/>
		</>
	);
};


export const InviteModal = ({ isOpen, onClose, inviteCode, showToast }) => {
	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Invite Members">
			<div className="text-center">
				<div className="modal-icon-wrapper primary mb-3">
					<i className="fa-solid fa-user-plus modal-icon-lg"></i>
				</div>
				<p className="text-muted mb-3">Share this code with others to let them join this circle</p>
				<div className="invite-code-box mb-3">
					{inviteCode || 'LOADING'}
				</div>
				<button
					className="btn btn-primary w-100 modal-btn-primary"
					onClick={() => {
						navigator.clipboard.writeText(inviteCode);
						showToast('Copied to clipboard!');
					}}
				>
					<i className="fa-solid fa-copy me-2"></i>
					Copy Code
				</button>
			</div>
		</BootstrapModal>
	);
};

export const JoinCircleModal = ({ isOpen, onClose, onSuccess, showToast }) => {
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
				showToast('Invalid Code', 'Error');
			}
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Join a Circle">
			<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
				<div className="text-center mb-3">
					<div className="modal-icon-wrapper blue mb-3">
						<i className="fa-solid fa-right-to-bracket modal-icon-lg"></i>
					</div>
				</div>
				<div>
					<label className="form-label text-muted small fw-medium">Invite Code</label>
					<input
						className="form-control border-secondary text-center join-code-input"
						value={code}
						onChange={e => setCode(e.target.value.toUpperCase())}
						placeholder="e.g. A1B2C3D4"
						required
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary w-100 mt-2 modal-btn-primary"
				>
					<i className="fa-solid fa-check me-2"></i>
					Join Circle
				</button>
			</form>
		</BootstrapModal>
	);
}

export const MembersModal = ({ isOpen, onClose, members, currentUserId, adminId, onKick, circleId, onDM, onAssign, onLeave, onlineUsers }) => {
	const isAdmin = currentUserId === adminId;

	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Circle Members">
			<div className="d-flex flex-column gap-3 members-list-container">
				{members.map(member => {
					const isOnline = onlineUsers && onlineUsers.has(Number(member.id));
					return (
						<div
							key={member.id}
							className={`d-flex align-items-center justify-content-between p-3 member-list-item ${member.id === adminId ? 'admin' : ''}`}
						>
							<div className="d-flex align-items-center gap-3">
								<div className="position-relative">
									<div className="member-avatar-box">
										{member.avatar ?
											<img src={member.avatar} alt={member.username} className="w-100 h-100 object-fit-cover" /> :
											<span className="text-white fw-semibold">{member.username.charAt(0).toUpperCase()}</span>
										}
									</div>
									<div
										className={`position-absolute bottom-0 end-0 member-status-dot`}
										style={{
											background: isOnline ? '#10b981' : '#ef4444',
										}}
										title={isOnline ? "Online" : "Offline"}
									/>
								</div>
								<div>
									<div className="fw-medium">
										{member.username}
										{member.id === currentUserId && <span className="text-muted small fw-normal"> (You)</span>}
									</div>
									<div className="small" style={{
										color: member.id === adminId ? '#3b82f6' : 'var(--text-muted)',
										fontSize: '12px'
									}}>
										<i className={`fa-solid ${member.id === adminId ? 'fa-crown' : 'fa-user'} me-1`} style={{ fontSize: '10px' }}></i>
										{member.id === adminId ? 'Admin' : 'Member'}
									</div>
								</div>
							</div>

							<div className="d-flex gap-2">
								{member.id === currentUserId && !isAdmin && (
									<button
										onClick={() => onLeave(circleId)}
										className="btn btn-sm btn-outline-danger member-btn-text"
									>
										<i className="fa-solid fa-right-from-bracket me-1"></i>
										Leave
									</button>
								)}

								{member.id !== currentUserId && (
									<>
										<button
											onClick={() => onDM(member)}
											title="Send Message"
											className="btn btn-sm btn-outline-primary member-action-btn"
										>
											<i className="fa-solid fa-comment"></i>
										</button>
										<button
											onClick={() => onAssign(member)}
											title="Assign Task"
											className="btn btn-sm btn-outline-info member-action-btn"
										>
											<i className="fa-solid fa-clipboard-check"></i>
										</button>
									</>
								)}
								{isAdmin && member.id !== currentUserId && (
									<button
										onClick={() => { if (window.confirm(`Kick ${member.username}?`)) onKick(circleId, member.id); }}
										className="btn btn-sm btn-outline-danger member-kick-btn"
									>
										<i className="fa-solid fa-user-xmark me-1"></i>
										Kick
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</BootstrapModal>
	);
};

import Sudoku from '../pages/Sudoku';

export const SudokuModal = ({ isOpen, onClose, circleId }) => {
	return (
		<BootstrapModal isOpen={isOpen} onClose={onClose} title="Sudoku" size="modal-lg">
			<div className="sudoku-modal-wrapper">
				<Sudoku circleId={circleId} />
			</div>
		</BootstrapModal>
	);
};