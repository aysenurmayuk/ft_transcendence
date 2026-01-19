import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, onClose, onClick, duration = 5000 }) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose();
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	return (
		<div className="toast-notification" onClick={onClick}>
			<div className="toast-content">
				<div className="toast-icon">💬</div>
				<div className="toast-text">
					<div className="toast-sender">{message.sender}</div>
					<div className="toast-body">{message.content}</div>
				</div>
			</div>
			<button className="toast-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>
		</div>
	);
};

export default Toast;
