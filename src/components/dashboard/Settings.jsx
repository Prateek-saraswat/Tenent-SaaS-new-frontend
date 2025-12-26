import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = ({ user }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatar: null
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        projectUpdates: true,
        taskAssignments: true,
        mentionNotifications: true,
        timeReminders: true,
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Kolkata'
    });

    useEffect(() => {
        loadSettingsData();
    }, []);

    const loadSettingsData = async () => {
        try {
             setLoading(true);
               const userData = await ApiService.getUserProfile(user?.id);
              if (userData) {
            // Update profile form with API data
            setProfileForm({
                    firstName: userData.first_name || userData.firstName || '',
                    lastName: userData.last_name || userData.lastName || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    avatar: userData.avatar_url || userData.avatar || null,
                    preferences: userData.preferences || {}
                });
        } else {
            // Fallback to user prop if API fails
            if (user) {
                setProfileForm({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar: user.avatar || null
                });
            }
        }
            // Load user sessions
            // const sessionsData = await ApiService.getSessions();
            // if (Array.isArray(sessionsData)) {
            //     setSessions(sessionsData);
            // }

            

            // Initialize profile form with user data
            if (user) {
                setProfileForm({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar: user.avatar || null
                });
            }

            // Load preferences from user data or localStorage
            const savedPreferences = user?.preferences || JSON.parse(localStorage.getItem('userPreferences') || '{}');
            setPreferences(prev => ({ ...prev, ...savedPreferences }));
             toast.success('Settings loaded successfully!');

        } catch (error) {
            console.error('Failed to load settings data:', error);
             toast.error('Failed to load settings data'); 
             if (user) {
            setProfileForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar: user.avatar || null
            });
        }
        }finally {
        setLoading(false);
    }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update profile via API
            // This would require a new endpoint like /users/profile
            // For now, update localStorage
            const response = await ApiService.updateUserProfile(user?.id, {
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                email: profileForm.email,
                phone: profileForm.phone || ''
            });
if (response) {
                // Update local storage with new data
                const updatedUser = {
                    ...user,
                    firstName: profileForm.firstName,
                    lastName: profileForm.lastName,
                    email: profileForm.email,
                    phone: profileForm.phone,
                    avatar: profileForm.avatar
                };
                
                ApiService.setUser(updatedUser);
                
                // Update preferences if changed
                // await updatePreferences();
                
               toast.success('Profile updated successfully!')
                loadSettingsData(); // Reload data to get latest from server
            }
        } catch (error) {
           console.error('Failed to update profile:', error);
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
             toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
             toast.error('New password must be at least 8 characters')
            return;
        }

        setLoading(true);
        try {
            await ApiService.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            
             toast.success('Password changed successfully!'); 
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Failed to change password:', error);
             toast.error(error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleTerminateSession = async (sessionId) => {
        if (window.confirm('Are you sure you want to terminate this session?')) {
            try {
                await ApiService.deleteSession(sessionId);
                setSessions(prev => prev.filter(session => session.id !== sessionId));
                alert('Session terminated successfully');
            } catch (error) {
                console.error('Failed to terminate session:', error);
                alert('Failed to terminate session');
            }
        }
    };

    const handleTerminateAllSessions = async () => {
        if (window.confirm('Are you sure you want to terminate all other sessions? You will be logged out from all other devices.')) {
            try {
                const currentSessionId = sessions.find(s => s.is_current)?.id;
                for (const session of sessions) {
                    if (session.id !== currentSessionId) {
                        await ApiService.deleteSession(session.id);
                    }
                }
                setSessions(prev => prev.filter(s => s.is_current));
                alert('All other sessions terminated successfully');
            } catch (error) {
                console.error('Failed to terminate sessions:', error);
                alert('Failed to terminate sessions');
            }
        }
    };

    const handlePreferenceChange = (key, value) => {
        const updated = { ...preferences, [key]: value };
        setPreferences(updated);
        
        // Save to localStorage
        localStorage.setItem('userPreferences', JSON.stringify(updated));
        if (key === 'theme') {
        toast(`Theme changed to ${value}`, {
            icon: '🎨',
            duration: 2000
        });
    } else if (key === 'language') {
        toast(`Language changed to ${value}`, {
            icon: '🌐',
            duration: 2000
        });
    }
        
        // If you have an API endpoint for preferences, save there too
        // await ApiService.updatePreferences(updated);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
           toast.error('Please select an image file'); 
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size should be less than 5MB')
            return;
        }

        setLoading(true);
        try {
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, avatar: reader.result }));
                 toast.success('Avatar updated successfully!'); 
                setLoading(false);
            };
            reader.readAsDataURL(file);
            
            // In production, you would upload to server:
            // const formData = new FormData();
            // formData.append('avatar', file);
            // const response = await ApiService.uploadAvatar(formData);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
             toast.error('Failed to upload avatar'); 
            setLoading(false);
        }
    };

    const renderProfileTab = () => (
        <div className="settings-tab-content">
            <div className="profile-section">
                <h3>Profile Information</h3>
                <form onSubmit={handleProfileUpdate}>
                    <div className="avatar-upload">
                        <div className="avatar-preview">
                            {profileForm.avatar ? (
                                <img src={profileForm.avatar} alt="Profile" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {profileForm.firstName?.charAt(0)}{profileForm.lastName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="avatar-controls">
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="avatar-upload" className="btn btn-secondary">
                                Change Avatar
                            </label>
                            <p className="upload-hint">JPG, PNG or GIF, max 5MB</p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input
                                type="text"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input
                                type="text"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderSecurityTab = () => (
        <div className="settings-tab-content">
            <div className="security-section">
                <h3>Password & Security</h3>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password *</label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password *</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            required
                            minLength="8"
                        />
                        <small className="form-hint">
                            Must be at least 8 characters with letters and numbers
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password *</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </div>
                </form>

                <div className="security-info">
                    <h4>Security Tips</h4>
                    <ul>
                        <li>Use a strong, unique password</li>
                        <li>Enable two-factor authentication if available</li>
                        <li>Regularly review active sessions</li>
                        <li>Log out from shared devices</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderSessionsTab = () => (
        <div className="settings-tab-content">
            <div className="sessions-section">
                <div className="section-header">
                    <h3>Active Sessions</h3>
                    <button 
                        className="btn btn-secondary"
                        onClick={handleTerminateAllSessions}
                        disabled={sessions.length <= 1}
                    >
                        Terminate All Other Sessions
                    </button>
                </div>

                <div className="sessions-list">
                    {sessions.length > 0 ? (
                        sessions.map(session => (
                            <div key={session.id} className="session-card">
                                <div className="session-info">
                                    <div className="session-icon">
                                        {getDeviceIcon(session.device_info)}
                                    </div>
                                    <div className="session-details">
                                        <h4>{session.device_info || 'Unknown Device'}</h4>
                                        <p className="session-meta">
                                            <span>IP: {session.ip_address || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>Last used: {new Date(session.last_used).toLocaleString()}</span>
                                            {session.is_current && (
                                                <>
                                                    <span>•</span>
                                                    <span className="current-badge">Current Session</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="session-actions">
                                    {!session.is_current && (
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => handleTerminateSession(session.id)}
                                        >
                                            Terminate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-sessions">
                            <p>No active sessions found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPreferencesTab = () => (
        <div className="settings-tab-content">
            <div className="preferences-section">
                <h3>Notification Preferences</h3>
                
                <div className="preferences-group">
                    <h4>Email Notifications</h4>
                    {[
                        { key: 'emailNotifications', label: 'Enable all email notifications' },
                        { key: 'weeklyReports', label: 'Weekly summary reports' },
                        { key: 'projectUpdates', label: 'Project updates and changes' },
                        { key: 'taskAssignments', label: 'Task assignments and updates' },
                        { key: 'mentionNotifications', label: '@mentions in comments' }
                    ].map(pref => (
                        <div key={pref.key} className="preference-item">
                            <label className="preference-label">
                                <input
                                    type="checkbox"
                                    checked={preferences[pref.key]}
                                    onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                                />
                                <span>{pref.label}</span>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="preferences-group">
                    <h4>Application Preferences</h4>
                    <div className="preference-item">
                        <label className="preference-label">Theme</label>
                        <select
                            value={preferences.theme}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                            className="preference-select"
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System Default</option>
                        </select>
                    </div>

                    <div className="preference-item">
                        <label className="preference-label">Language</label>
                        <select
                            value={preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                            className="preference-select"
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>

                    <div className="preference-item">
                        <label className="preference-label">Timezone</label>
                        <select
                            value={preferences.timezone}
                            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                            className="preference-select"
                        >
                            <option value="Asia/Kolkata">India (Kolkata)</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                        </select>
                    </div>
                </div>

                <div className="preferences-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                           toast.success('Preferences saved successfully!'); 
                        }}
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );

    const getDeviceIcon = (deviceInfo) => {
        if (!deviceInfo) return '💻';
        
        const info = deviceInfo.toLowerCase();
        if (info.includes('windows')) return '💻';
        if (info.includes('mac')) return '💻';
        if (info.includes('iphone') || info.includes('ipad')) return '📱';
        if (info.includes('android')) return '📱';
        if (info.includes('linux')) return '🐧';
        return '💻';
    };

    return (
        <div className="settings-container">
            {/* Settings header */}
            <div className="settings-header">
                <div className="header-left">
                    <h1>Account Settings</h1>
                    <p>Manage your account preferences and security</p>
                </div>
            </div>

            {/* Settings tabs */}
            <div className="settings-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => {
        setActiveTab('profile');
        toast('Editing profile...', {
            icon: '👤',
            duration: 1000
        });
    }}
                >
                    <span className="tab-icon">👤</span>
                    <span>Profile</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <span className="tab-icon">🔒</span>
                    <span>Security</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    <span className="tab-icon">💻</span>
                    <span>Active Sessions</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                >
                    <span className="tab-icon">⚙️</span>
                    <span>Preferences</span>
                </button>
            </div>

            {/* Settings content */}
            <div className="settings-content">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'security' && renderSecurityTab()}
                {activeTab === 'sessions' && renderSessionsTab()}
                {activeTab === 'preferences' && renderPreferencesTab()}
            </div>
        </div>
    );
};

export default Settings;