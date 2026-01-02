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

export const CreateTaskModal = ({ isOpen, onClose, circleId, members, onSuccess }) => {
	const [taskType, setTaskType] = useState('assignment'); // assignment, checklist, note
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [assignedTo, setAssignedTo] = useState('');
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
			if (assignedTo) payload.assigned_to_id = assignedTo;
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
				setAssignedTo('');
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
		}
	}, [isOpen]);

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
						<label>Assign To (Optional)</label>
						<select className="glass-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{ background: '#1e293b' }}>
							<option value="">-- Everyone --</option>
							{members.map(m => (
								<option key={m.id} value={m.id}>{m.username}</option>
							))}
						</select>
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

export const TaskDetailModal = ({ isOpen, onClose, task, user, onUpdate, onDelete }) => {
	if (!task) return null;

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

	const completeTask = async () => {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`/api/tasks/${task.id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`
				},
				body: JSON.stringify({ status: 'done' })
			});
			if (res.ok) onUpdate();
		} catch (e) { console.error(e); }
	};

	// Determine if user can complete (Assignment logic)
	const canComplete = task.task_type === 'assignment' && task.status !== 'done' && (!task.assigned_to || task.assigned_to.id === user.id);
	// Determine if user can delete (Creator only)
	const canDelete = task.created_by.id === user.id;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={task.title}>
			<div style={{ marginBottom: '20px' }}>
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
			</div>

			<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div>
					{task.task_type === 'assignment' && (
						<div style={{ fontSize: '13px', color: '#94a3b8' }}>
							Assigned to: <span style={{ color: '#fff' }}>{task.assigned_to ? task.assigned_to.username : 'Everyone'}</span>
						</div>
					)}
					<div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
						Created by {task.created_by.username}
					</div>
				</div>

				<div style={{ display: 'flex', gap: '10px' }}>
					{canDelete && (
						<button onClick={() => { if (window.confirm('Delete this task?')) onDelete(task.id); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
							Delete
						</button>
					)}
					{canComplete && (
						<button onClick={completeTask} className="primary-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>
							Complete
						</button>
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
