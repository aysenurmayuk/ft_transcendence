import React from 'react';
import './DashboardMembers.css';

const DashboardMembers = ({
    selectedEnv, user, onlineUsers, startDM, setPreselectedAssignee,
    setShowCreateTask, handleKick, handleLeaveCircle
}) => {
    return (
        <div className="container-fluid p-0 members-page-container">
            <div className="mb-4 pb-3 border-bottom" style={{borderColor: 'var(--border)'}}>
                <h2 className="h3 fw-bold mb-1">Circle Members</h2>
                <p className="text-muted mb-0" style={{fontSize: '0.95rem'}}>Manage members of <span style={{color: 'var(--palette-success)', fontWeight: '600'}}>{selectedEnv?.name}</span></p>
            </div>

            <div className="d-flex flex-column gap-3">
                {selectedEnv?.members?.map(member => (
                    <div key={member.id} className={`member-card ${selectedEnv.admin?.id === member.id ? 'admin' : ''}`}>
                        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between p-4 gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="position-relative">
                                    <div className="member-avatar-wrapper">
                                        <div className="member-avatar-inner">
                                            {member.avatar ?
                                                <img src={member.avatar} alt={member.username} className="w-100 h-100 object-fit-cover" /> :
                                                <span className="member-initial">{member.username.charAt(0).toUpperCase()}</span>
                                            }
                                        </div>
                                    </div>
                                    {onlineUsers.has(member.id) && (
                                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle online-indicator-large" style={{border: '2px solid var(--surface)', width: '14px', height: '14px'}}></div>
                                    )}
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="fw-bold fs-5">{member.username}</span>
                                        {selectedEnv.admin?.id === member.id && <span className="badge badge-custom" style={{backgroundColor: 'var(--palette-primary)', color: 'white'}}>ADMIN</span>}
                                        {member.id === user.id && <span className="badge badge-custom" style={{backgroundColor: 'rgba(131, 173, 108, 0.15)', color: 'var(--palette-success)'}}>YOU</span>}
                                    </div>
                                    <div style={{color: 'var(--text)', opacity: 0.7, fontSize: '0.9rem'}}>{member.email}</div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                {member.id !== user.id && (
                                    <>
                                        <button onClick={() => startDM(member)} className="btn btn-sm btn-custom-green rounded-pill px-3">
                                            Message
                                        </button>
                                        <button onClick={() => { setPreselectedAssignee(member.id); setShowCreateTask(true); }} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                                            Assign Task
                                        </button>
                                    </>
                                )}
                                {selectedEnv.admin?.id === user.id && member.id !== user.id && (
                                    <button onClick={() => handleKick(selectedEnv.id, member.id)} className="btn btn-sm btn-outline-danger rounded-pill px-3">
                                        Kick
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-top border-secondary">
                <button onClick={() => handleLeaveCircle(selectedEnv.id)} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
                    <i className="fa-solid fa-right-from-bracket"></i> Leave Circle
                </button>
            </div>
        </div>
    );
};

export default DashboardMembers;