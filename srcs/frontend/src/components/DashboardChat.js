import React, { useState, useEffect, useCallback } from 'react';
import './DashboardChat.css';

const DashboardChat = ({
    chatOpen, setChatOpen, activeChatMode, dmTarget, returnToTeamChat,
    selectedEnv, messages, user, sendMessage, chatInput, setChatInput,
    isConnected, messagesEndRef, isMobile
}) => {
    const [width, setWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const prevMessagesLen = React.useRef(messages ? messages.length : 0);

    useEffect(() => {
        if (messages) {
            if (isMinimized && messages.length > prevMessagesLen.current) {
                setHasUnread(true);
            }
            prevMessagesLen.current = messages.length;
        }
    }, [messages, isMinimized]);

    useEffect(() => {
        if (!isMinimized) setHasUnread(false);
    }, [isMinimized]);

    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing) {
            const marginRight = 16; // 1rem margin from CSS
            const newWidth = window.innerWidth - e.clientX - marginRight;
            if (newWidth > 280 && newWidth < 800) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div 
            className={`offcanvas offcanvas-end dashboard-chat-offcanvas ${chatOpen ? 'show' : ''} ${isMobile ? 'mobile' : 'desktop'} ${isMinimized ? 'minimized' : ''}`} 
            data-bs-scroll="true" 
            data-bs-backdrop="false" 
            tabIndex="-1" 
            style={{ 
                visibility: chatOpen ? 'visible' : 'hidden',
                width: isMinimized ? (isMobile ? '280px' : '320px') : (isMobile ? '90%' : `${width}px`),
                maxWidth: isMobile ? '400px' : 'none'
            }}
        >
            {!isMobile && !isMinimized && (
                <div className="chat-resize-handle" onMouseDown={startResizing}>
                    <div className="chat-resize-line"></div>
                </div>
            )}
            <div className={`offcanvas-header chat-header py-3 ${hasUnread ? 'unread' : ''}`}>
                <div className="d-flex align-items-center gap-2">
                    {activeChatMode === 'dm' && (
                        <button onClick={returnToTeamChat} className={`btn btn-link p-0 text-decoration-none me-1 ${hasUnread ? 'text-white' : 'text-body'}`}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                    )}
                    <span className="fs-5">{activeChatMode === 'dm' ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-comments"></i>}</span>
                    <h5 className="offcanvas-title mb-0 fw-bold">
                        {activeChatMode === 'dm' ? (dmTarget ? dmTarget.username : 'Chat') : 'Team Chat'}
                    </h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)} 
                        className={`btn btn-link p-0 text-decoration-none me-2 ${hasUnread ? 'text-white' : 'text-body'}`}
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                        <i className={`fa-solid ${isMinimized ? 'fa-chevron-up' : 'fa-minus'}`}></i>
                    </button>
                    <button onClick={() => setChatOpen(false)} className={`btn-close ${hasUnread ? 'btn-close-white' : ''}`}></button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="offcanvas-body d-flex flex-column gap-2 p-3">
                        {selectedEnv ? messages.map((msg, idx) => {
                            const isMyMessage = msg.sender?.username === user.username;
                            return (
                                <div key={idx} className={`d-flex flex-column ${isMyMessage ? 'align-items-end' : 'align-items-start'}`}>
                                    {!isMyMessage && <div className="text-muted small ms-1 mb-1">{msg.sender?.username}</div>}
                                    <div 
                                        className={`chat-bubble ${isMyMessage ? 'sent' : 'received'} text-break`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-muted py-4">
                            {activeChatMode === 'dm' ? 'Start a conversation' : 'Select a circle to chat'}
                        </div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {selectedEnv && (
                        <form onSubmit={sendMessage} className="p-3 chat-footer">
                            <div className="position-relative">
                                <input
                                    className="form-control chat-input"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder={isConnected ? "Message..." : "Connecting..."}
                                    disabled={!isConnected}
                                    style={{ paddingRight: '50px' }}
                                />
                                <button type="submit" disabled={!isConnected} className={`btn position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle d-flex align-items-center justify-content-center ${isConnected ? 'btn-primary-green' : 'btn-secondary'}`} style={{ width: '36px', height: '36px' }}>
                                    <i className="fa-solid fa-paper-plane" style={{ fontSize: '14px' }}></i>
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardChat;