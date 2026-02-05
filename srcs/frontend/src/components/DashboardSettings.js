import React from 'react';
import './DashboardSettings.css';

const DashboardSettings = ({
    profileData, setProfileData, handleUpdateProfile, handleFileChange, handleLogout,
    selectedEnv, user, editingCircleName, setEditingCircleName,
    editingDescription, setEditingDescription, handleUpdateCircle
}) => {
    return (
        <div className="container-fluid p-0">
            <div className="row g-4">
                {/* Profile Settings Card */}
                <div className="col-lg-6">
                    <div className="card h-100 shadow-none settings-card">
                        <div className="card-header bg-transparent border-bottom py-3" style={{ borderColor: 'var(--border)' }}>
                            <h5 className="card-title mb-0 fw-bold">Profile Settings</h5>
                        </div>

                        <div className="card-body">
                            <form onSubmit={handleUpdateProfile} className="d-flex flex-column gap-3 h-100">
                                <div className="d-flex flex-column align-items-center gap-3 mb-3">
                                    <div className="position-relative settings-avatar-container">
                                        <div className="rounded-circle overflow-hidden border d-flex align-items-center justify-content-center w-100 h-100" style={{ borderColor: 'var(--palette-success)', backgroundColor: 'var(--background)', borderWidth: '2px' }}>
                                            {profileData.avatarUrl ?
                                                <img src={profileData.avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" /> :
                                                <span className="fs-1 text-success-custom"><i className="fa-solid fa-user"></i></span>
                                            }
                                        </div>
                                    </div>
                                    <label htmlFor="avatar-upload" className="text-success-custom text-decoration-none cursor-pointer fw-medium">
                                        Change Photo
                                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="d-none" />
                                    </label>
                                    {profileData.avatarUrl && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileData({ ...profileData, avatar: null, avatarUrl: '', removeAvatar: true });
                                            }}
                                            className="btn btn-outline-danger btn-sm">
                                            Remove Avatar
                                        </button>
                                    )}
                                </div>

                                <div className="mb-2">
                                    <label className="form-label text-muted small">Username</label>
                                    <input className="form-control settings-input" type="text" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label text-muted small">Email</label>
                                    <input className="form-control settings-input" type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label text-muted small">New Password (Optional)</label>
                                    <input className="form-control settings-input" type="password" value={profileData.password} onChange={e => setProfileData({ ...profileData, password: e.target.value })} placeholder="Leave blank to keep current" />
                                </div>
                                <button type="submit" className="btn btn-primary-green w-100 mt-2">Save Changes</button>

                                <div className="mt-auto pt-4 border-top" style={{ borderColor: 'var(--border)' }}>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
                                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Circle Settings Card */}
                {selectedEnv && selectedEnv.admin && selectedEnv.admin.id === user.id && (
                    <div className="col-lg-6">
                        <div className="card h-100 shadow-none settings-card">
                            <div className="card-header bg-transparent border-bottom py-3" style={{ borderColor: 'var(--border)' }}>
                                <h5 className="card-title mb-0 fw-bold">Circle Settings</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleUpdateCircle} className="d-flex flex-column gap-3">
                                    <div className="mb-2">
                                        <label className="form-label text-muted small">Circle Name</label>
                                        <input
                                            className="form-control settings-input"
                                            type="text"
                                            value={editingCircleName}
                                            onChange={e => setEditingCircleName(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label text-muted small">Description</label>
                                        <textarea
                                            className="form-control textarea-resize-v settings-input"
                                            value={editingDescription}
                                            onChange={e => setEditingDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary-green w-100">Save Settings</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardSettings;