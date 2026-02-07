import React from 'react';
import './DashboardSidebar.css';

const SidebarLink = ({ icon, text, isActive, isOpen, onClick }) => (
    <li className="nav-item">
        <button
            className={`nav-link w-100 d-flex align-items-center gap-3 ${isActive ? 'active' : 'text-body'}`}
            onClick={onClick}
            title={!isOpen ? text : ''}
        >
            <span className="fs-5 d-flex align-items-center justify-content-center sidebar-icon-width">{icon}</span>
            {isOpen && <span className="text-truncate">{text}</span>}
        </button>
    </li>
);

const DashboardSidebar = ({ sidebarOpen, toggleSidebar, activeView, setActiveView, chatOpen, setChatOpen, openChat, isMobile }) => {
    return (
        <aside
            className={`d-flex flex-column flex-shrink-0 dashboard-sidebar ${isMobile ? 'mobile shadow-mobile' : 'desktop'} ${sidebarOpen ? 'open' : (isMobile ? '' : 'closed')}`}
        >
            <div className={`d-flex align-items-center ${sidebarOpen ? 'justify-content-between' : 'justify-content-center'} sidebar-header`} style={{ padding: sidebarOpen ? '' : '0' }}>
                {sidebarOpen ? (
                    <>
                        <div className="fw-bold fs-4 text-primary">PLANORA</div>
                        <button
                            className="btn btn-sm btn-outline-secondary border-0"
                            onClick={toggleSidebar}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </>
                ) : (
                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '42px', height: '42px', background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer' }} onClick={toggleSidebar} title="Expand">
                        <span className="fw-bold fs-4">P</span>
                    </div>
                )}
            </div>

            <div className="flex-grow-1 overflow-y-auto overflow-x-hidden p-2">
                <ul className="nav nav-pills flex-column gap-1">
                    <SidebarLink
                        icon={<i className="fa-solid fa-house"></i>}
                        text="Dashboard"
                        isOpen={sidebarOpen}
                        isActive={activeView === 'dashboard'}
                        onClick={() => { setActiveView('dashboard'); if (isMobile) toggleSidebar(); }}
                    />
                    <SidebarLink
                        icon={<i className="fa-solid fa-users"></i>}
                        text="Members"
                        isOpen={sidebarOpen}
                        isActive={activeView === 'members'}
                        onClick={() => { setActiveView('members'); if (isMobile) toggleSidebar(); }}
                    />
                    <SidebarLink
                        icon={<i className="fa-solid fa-comments"></i>}
                        text="Chat"
                        isOpen={sidebarOpen}
                        isActive={chatOpen}
                        onClick={() => { chatOpen ? setChatOpen(false) : openChat(); if (isMobile) toggleSidebar(); }}
                    />
                    <SidebarLink
                        icon={<i className="fa-solid fa-border-all"></i>}
                        text="Sudoku"
                        isOpen={sidebarOpen}
                        isActive={activeView === 'sudoku'}
                        onClick={() => { setActiveView('sudoku'); if (isMobile) toggleSidebar(); }}
                    />
                    <SidebarLink
                        icon={<i className="fa-solid fa-gears"></i>}
                        text="Settings"
                        isOpen={sidebarOpen}
                        isActive={activeView === 'settings'}
                        onClick={() => { setActiveView('settings'); if (isMobile) toggleSidebar(); }}
                    />
                </ul>
            </div>
        </aside>
    );
};

export default DashboardSidebar;