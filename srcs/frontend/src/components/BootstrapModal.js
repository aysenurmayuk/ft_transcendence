import React from 'react';

const BootstrapModal = ({ isOpen, onClose, title, children, size = '' }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} onClick={onClose}>
                <div className={`modal-dialog modal-dialog-centered ${size}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-content bg-body border-secondary shadow">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title fw-bold">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BootstrapModal;