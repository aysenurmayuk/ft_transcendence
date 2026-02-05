import React, { useEffect } from 'react';

const Toast = ({ message, onClose, onClick, duration = 5000 }) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose();
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	return (
		<div className="toast show align-items-center bg-body border-secondary mb-2 toast-cursor" role="alert" aria-live="assertive" aria-atomic="true" onClick={onClick}>
			<div className="d-flex">
				<div className="toast-body d-flex align-items-start gap-2">
					<div className="fs-5"><i className="fa-solid fa-bell"></i></div>
					<div>
						<div className="fw-bold small">{message.sender}</div>
						<div className="small">{message.content}</div>
					</div>
				</div>
				<button type="button" className="btn-close me-2 m-auto" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close"></button>
			</div>
		</div>
	);
};

export default Toast;
