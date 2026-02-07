import React from 'react';
import './DashboardTopbar.css';

const DashboardTopbar = ({
    comboOpen, toggleCombo, selectedEnv, myCircles, selectEnv,
    setShowInvite, notifications, showNotifications, setShowNotifications,
    handleNotificationClick, setNotifications, user, openSettings, startDM, darkMode, toggleTheme, handleLeaveCircle,
    toggleSidebar, isMobile
}) => {
    return (
        <header 
            className="navbar navbar-expand px-3 px-md-4 dashboard-topbar" 
        >
            <div className="d-md-none me-3" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '42px', height: '42px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <span className="fw-bold fs-4">P</span>
                </div>
            </div>

            {/* Combobox */}
            <div className={`dropdown d-flex align-items-center topbar-combo-dropdown ${isMobile ? 'mobile' : 'desktop'}`}>
                <button
                    className={`btn btn-outline-secondary dropdown-toggle d-flex align-items-center justify-content-between w-100 px-2 px-md-3 topbar-combo-btn ${isMobile ? 'mobile' : 'desktop'} ${comboOpen ? 'show' : ''}`}
                    type="button"
                    aria-expanded={comboOpen}
                    onClick={(e) => { e.stopPropagation(); toggleCombo(); }}
                >
                    <span className="text-truncate fw-medium">{selectedEnv ? selectedEnv.name : 'Select Circle'}</span>
                </button>
                <ul className={`dropdown-menu shadow topbar-combo-menu ${comboOpen ? 'show' : ''}`}>
                    {myCircles.map(circle => (
                        <li key={circle.id}>
                            <button className="dropdown-item d-flex align-items-center justify-content-between" onClick={() => selectEnv(circle)}>
                                {circle.name}
                                {selectedEnv && selectedEnv.id === circle.id && <i className="fa-solid fa-check text-primary small"></i>}
                            </button>
                        </li>
                    ))}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                        <button 
                            className={`dropdown-item text-primary fw-medium d-flex align-items-center ${isMobile ? 'py-3' : ''}`} 
                            onClick={() => selectEnv('create')}
                        >
                            <i className="fa-solid fa-plus me-2"></i>
                            <span className="text-truncate">Create New Circle</span>
                        </button>
                    </li>
                    <li>
                        <button className="dropdown-item fw-medium" onClick={() => selectEnv('join')}>
                            <i className="fa-solid fa-hashtag me-2"></i> Join with Code
                        </button>
                    </li>
                    {selectedEnv && (
                        <>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button className="dropdown-item text-danger fw-medium" onClick={() => handleLeaveCircle(selectedEnv.id)}>
                                    <i className="fa-solid fa-right-from-bracket me-2"></i> Leave Circle
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Right Top Controls */}
            <div className="d-flex align-items-center gap-2 gap-md-3 ms-auto">
                <button className={`btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 topbar-icon-btn ${isMobile ? 'mobile' : ''}`} onClick={toggleTheme}>
                    {darkMode ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
                </button>

                {selectedEnv && (
                    <div title="Invite Members">
                        <button className={`btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 invite-btn ${isMobile ? 'mobile' : ''}`} onClick={() => setShowInvite(true)}>
                            <i className={`fa-solid fa-user-plus ${isMobile ? 'invite-icon-mobile' : ''}`}></i>
                        </button>
                    </div>
                )}

                {/* Notification Bell */}
                <div className="position-relative">
                    <button 
                        className={`btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 border-secondary position-relative topbar-icon-btn notification-btn ${isMobile ? 'mobile' : ''}`} 
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <i className={`fa-solid fa-bell ${isMobile ? 'invite-icon-mobile' : ''}`}></i>
                        {notifications.length > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className={`card position-absolute end-0 mt-2 shadow notification-dropdown ${isMobile ? 'mobile' : ''}`}>
                            <div className="card-header notification-header d-flex justify-content-between align-items-center py-3 px-3">
                                <span className="fw-bold small">Notifications</span>
                                {notifications.length > 0 && (
                                    <button className="btn btn-link btn-sm text-muted p-0 text-decoration-none" onClick={() => setNotifications([])}>Clear all</button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-muted small">No new notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="notification-item d-flex gap-3 p-3" onClick={() => handleNotificationClick(n)}>
                                            <div className="notification-avatar flex-shrink-0">
                                                <i className="fa-solid fa-comment"></i>
                                            </div>
                                            <div className="flex-grow-1 min-width-0">
                                                <div className="d-flex justify-content-between align-items-baseline mb-1">
                                                    <span className="fw-bold small text-truncate">{n.sender}</span>
                                                    <span className="notification-time">{n.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <div className="text-muted small text-truncate">{n.content}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar Stack */}
                {selectedEnv && selectedEnv.members && selectedEnv.members.length > 0 && (
                    <div className={`d-flex align-items-center ${isMobile ? 'me-2' : 'me-3'}`}>
                        {selectedEnv.members.slice(0, isMobile ? 1 : 3).map((member, i) => {
                            // Generate consistent color
                            let hash = 0;
                            for (let k = 0; k < member.username.length; k++) {
                                hash = member.username.charCodeAt(k) + ((hash << 5) - hash);
                            }
                            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                            const color = '#' + '00000'.substring(0, 6 - c.length) + c;

                            return (
                                <div key={member.id} className={`rounded-circle border border-secondary d-flex align-items-center justify-content-center text-white small fw-bold overflow-hidden position-relative shadow-sm avatar-stack-item ${isMobile ? 'mobile' : ''}`} title={member.username}
                                    style={{
                                        marginLeft: i > 0 ? '-12px' : '0',
                                        zIndex: 10 - i,
                                        background: member.avatar ? 'transparent' : color,
                                        cursor: member.id !== user.id ? 'pointer' : 'default',
                                    }}
                                    onClick={() => startDM(member)}>
                                    {member.avatar ?
                                        <img src={member.avatar} alt={member.username} /> :
                                        member.username.charAt(0).toUpperCase()
                                    }
                                </div>
                            );
                        })}
                        {selectedEnv.members.length > (isMobile ? 1 : 3) && (
                            <div className={`rounded-circle border border-secondary bg-secondary text-light d-flex align-items-center justify-content-center small avatar-stack-item avatar-stack-overflow ${isMobile ? 'mobile' : ''}`}>
                                <span style={{ fontSize: isMobile ? '10px' : 'inherit' }}>+{selectedEnv.members.length - (isMobile ? 1 : 3)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div 
                    className={`d-flex align-items-center gap-2 user-profile-pill ${isMobile ? 'p-0 border-0 mobile' : 'px-3 py-1 rounded-pill border border-secondary bg-body-tertiary'}`} 
                    onClick={openSettings}
                >
                    {user.avatar ?
                        <img src={user.avatar} alt="Me" className={`rounded-circle object-fit-cover user-avatar-small ${isMobile ? 'mobile' : ''}`} /> :
                        <span className={`d-flex align-items-center justify-content-center rounded-circle user-icon-placeholder ${isMobile ? 'bg-secondary text-white mobile' : ''}`}>
                            <i className={`fa-solid fa-user ${isMobile ? 'small' : 'fs-5'}`}></i>
                        </span>
                    }
                    {!isMobile && <span className="small fw-medium">{user.username || 'Guest'}</span>}
                </div>
            </div>
        </header>
    );
};

export default DashboardTopbar;