import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import './OrganizationSettings.css';

const OrganizationSettings = ({ user, tenant }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    // Organization form state
    const [orgForm, setOrgForm] = useState({
        name: '',
        timezone: 'Asia/Kolkata',
        settings: {
            allowPublicProjects: false,
            require2FA: false,
            autoArchiveProjects: true,
            defaultProjectPrivacy: 'private',
            notificationEmail: '',
            workingHoursStart: '09:00',
            workingHoursEnd: '18:00',
            weekStartDay: 'monday'
        }
    });

    // Danger zone state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    useEffect(() => {
        loadOrganizationData();
    }, []);

    const loadOrganizationData = async () => {
        try {
            setLoading(true);
            
            // Load current tenant details
            const tenantData = await ApiService.getCurrentTenant();
            if (tenantData) {
                setOrgForm({
                    name: tenantData.name || '',
                    timezone: tenantData.timezone || 'Asia/Kolkata',
                    settings: {
                        ...orgForm.settings,
                        ...(tenantData.settings || {})
                    }
                });
                setLogoPreview(tenantData.logo_url);
            }

            // Load audit logs
            const logs = await ApiService.getAuditLogs({ limit: 50 });
            if (Array.isArray(logs)) {
                setAuditLogs(logs);
            }

        } catch (error) {
            console.error('Failed to load organization data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOrganization = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await ApiService.updateTenant({
                name: orgForm.name,
                timezone: orgForm.timezone,
                settings: JSON.stringify(orgForm.settings)
            });
            
            alert('Organization settings updated successfully!');
            loadOrganizationData(); // Reload to get updated data
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(error.message || 'Failed to update organization settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, GIF)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('Logo size should be less than 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        setLogo(file);

        // In production, you would upload to server:
        try {
            const formData = new FormData();
            formData.append('logo', file);
            // const response = await ApiService.uploadLogo(formData);
            // setLogoPreview(response.logoUrl);
        } catch (error) {
            console.error('Failed to upload logo:', error);
            alert('Failed to upload logo');
        }
    };

    const handleDeleteOrganization = async () => {
        if (deleteConfirmation !== tenant?.name) {
            alert(`Please type "${tenant?.name}" to confirm deletion`);
            return;
        }

        if (window.confirm('This action cannot be undone. All data will be permanently deleted. Are you absolutely sure?')) {
            setSaving(true);
            try {
                // This would require a DELETE /tenants endpoint
                alert('Organization deletion would be processed here');
                setShowDeleteConfirm(false);
                setDeleteConfirmation('');
                
                // In production:
                // await ApiService.deleteTenant();
                // ApiService.clearTokens();
                // window.location.href = '/';
            } catch (error) {
                console.error('Failed to delete organization:', error);
                alert('Failed to delete organization');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleTransferOwnership = () => {
        alert('Transfer ownership functionality would be implemented here');
    };

    const renderGeneralTab = () => (
        <div className="org-tab-content">
            <form onSubmit={handleSaveOrganization}>
                <div className="org-section">
                    <h3>Organization Details</h3>
                    
                    <div className="form-group">
                        <label>Organization Name *</label>
                        <input
                            type="text"
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                            required
                        />
                        <small className="form-hint">This is your workspace name visible to all members</small>
                    </div>

                    <div className="form-group">
                        <label>Organization Logo</label>
                        <div className="logo-upload">
                            <div className="logo-preview">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Organization Logo" />
                                ) : (
                                    <div className="logo-placeholder">
                                        {orgForm.name?.charAt(0) || 'O'}
                                    </div>
                                )}
                            </div>
                            <div className="logo-controls">
                                <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="logo-upload" className="btn btn-secondary">
                                    Upload Logo
                                </label>
                                <p className="upload-hint">Recommended: 200x200px, JPG or PNG, max 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Timezone</label>
                        <select
                            value={orgForm.timezone}
                            onChange={(e) => setOrgForm({...orgForm, timezone: e.target.value})}
                        >
                            <option value="Asia/Kolkata">India (Kolkata)</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Paris (CET)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                            <option value="Australia/Sydney">Sydney (AEST)</option>
                        </select>
                    </div>
                </div>

                <div className="org-section">
                    <h3>Workspace Settings</h3>
                    
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={orgForm.settings.allowPublicProjects}
                                    onChange={(e) => setOrgForm({
                                        ...orgForm,
                                        settings: {
                                            ...orgForm.settings,
                                            allowPublicProjects: e.target.checked
                                        }
                                    })}
                                />
                                <span>Allow Public Projects</span>
                            </label>
                            <small className="setting-hint">Allow creating projects visible to anyone with the link</small>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={orgForm.settings.require2FA}
                                    onChange={(e) => setOrgForm({
                                        ...orgForm,
                                        settings: {
                                            ...orgForm.settings,
                                            require2FA: e.target.checked
                                        }
                                    })}
                                />
                                <span>Require Two-Factor Authentication</span>
                            </label>
                            <small className="setting-hint">Require 2FA for all organization members</small>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={orgForm.settings.autoArchiveProjects}
                                    onChange={(e) => setOrgForm({
                                        ...orgForm,
                                        settings: {
                                            ...orgForm.settings,
                                            autoArchiveProjects: e.target.checked
                                        }
                                    })}
                                />
                                <span>Auto-archive Completed Projects</span>
                            </label>
                            <small className="setting-hint">Automatically archive projects 30 days after completion</small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Default Project Privacy</label>
                            <select
                                value={orgForm.settings.defaultProjectPrivacy}
                                onChange={(e) => setOrgForm({
                                    ...orgForm,
                                    settings: {
                                        ...orgForm.settings,
                                        defaultProjectPrivacy: e.target.value
                                    }
                                })}
                            >
                                <option value="private">Private (Members only)</option>
                                <option value="team">Team (Organization members)</option>
                                <option value="public">Public (Anyone with link)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notification Email</label>
                            <input
                                type="email"
                                value={orgForm.settings.notificationEmail}
                                onChange={(e) => setOrgForm({
                                    ...orgForm,
                                    settings: {
                                        ...orgForm.settings,
                                        notificationEmail: e.target.value
                                    }
                                })}
                                placeholder="notifications@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Working Hours Start</label>
                            <input
                                type="time"
                                value={orgForm.settings.workingHoursStart}
                                onChange={(e) => setOrgForm({
                                    ...orgForm,
                                    settings: {
                                        ...orgForm.settings,
                                        workingHoursStart: e.target.value
                                    }
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Working Hours End</label>
                            <input
                                type="time"
                                value={orgForm.settings.workingHoursEnd}
                                onChange={(e) => setOrgForm({
                                    ...orgForm,
                                    settings: {
                                        ...orgForm.settings,
                                        workingHoursEnd: e.target.value
                                    }
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Week Start Day</label>
                            <select
                                value={orgForm.settings.weekStartDay}
                                onChange={(e) => setOrgForm({
                                    ...orgForm,
                                    settings: {
                                        ...orgForm.settings,
                                        weekStartDay: e.target.value
                                    }
                                })}
                            >
                                <option value="monday">Monday</option>
                                <option value="sunday">Sunday</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Organization Settings'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderAuditLogTab = () => (
        <div className="org-tab-content">
            <div className="org-section">
                <div className="section-header">
                    <h3>Audit Logs</h3>
                    <div className="log-filters">
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="search-input"
                        />
                        <select className="filter-select">
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                        </select>
                        <input
                            type="date"
                            className="date-filter"
                        />
                    </div>
                </div>

                <div className="audit-logs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.map((log, index) => (
                                <tr key={index}>
                                    <td>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-small">
                                                {log.user_name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <p className="user-name">{log.user_name || 'System'}</p>
                                                <p className="user-email">{log.user_email || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`action-badge ${log.action}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>
                                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                    </td>
                                    <td>{log.ip_address || 'N/A'}</td>
                                    <td>
                                        <button 
                                            className="btn-icon"
                                            onClick={() => {
                                                // Show details modal
                                                console.log('Log details:', log);
                                            }}
                                        >
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {auditLogs.length === 0 && (
                    <div className="no-logs">
                        <p>No audit logs found</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDangerZoneTab = () => (
        <div className="org-tab-content">
            <div className="org-section danger-zone">
                <h3>⚠️ Danger Zone</h3>
                <p className="danger-warning">
                    These actions are irreversible. Please proceed with caution.
                </p>

                <div className="danger-actions">
                    <div className="danger-card">
                        <div className="danger-info">
                            <h4>Transfer Organization Ownership</h4>
                            <p>Transfer ownership of this organization to another member. You will become a regular member.</p>
                        </div>
                        <button 
                            className="btn btn-warning"
                            onClick={handleTransferOwnership}
                        >
                            Transfer Ownership
                        </button>
                    </div>

                    <div className="danger-card">
                        <div className="danger-info">
                            <h4>Delete Organization</h4>
                            <p>Permanently delete this organization and all associated data. This action cannot be undone.</p>
                            <ul className="danger-list">
                                <li>All projects, tasks, and files will be deleted</li>
                                <li>All team member access will be revoked</li>
                                <li>All billing information will be removed</li>
                                <li>This action is permanent and irreversible</li>
                            </ul>
                        </div>
                        <button 
                            className="btn btn-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Organization
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="org-loading">
                <div className="spinner"></div>
                <p>Loading organization settings...</p>
            </div>
        );
    }

    return (
        <div className="organization-settings-container">
            {/* Organization header */}
            <div className="org-header">
                <div className="header-left">
                    <h1>Organization Settings</h1>
                    <p>Manage your workspace configuration and preferences</p>
                </div>
            </div>

            {/* Organization tabs */}
            <div className="org-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <span className="tab-icon">⚙️</span>
                    <span>General</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    <span className="tab-icon">📋</span>
                    <span>Audit Logs</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
                    onClick={() => setActiveTab('danger')}
                >
                    <span className="tab-icon">⚠️</span>
                    <span>Danger Zone</span>
                </button>
            </div>

            {/* Organization content */}
            <div className="org-content">
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'audit' && renderAuditLogTab()}
                {activeTab === 'danger' && renderDangerZoneTab()}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Delete Organization</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="danger-alert">
                                <h4>⚠️ This action cannot be undone!</h4>
                                <p>You are about to permanently delete <strong>{tenant?.name}</strong> and all of its data.</p>
                                <ul className="danger-list-modal">
                                    <li>All projects and tasks will be deleted</li>
                                    <li>All team members will lose access</li>
                                    <li>All files and attachments will be removed</li>
                                    <li>All billing information will be erased</li>
                                </ul>
                            </div>
                            
                            <div className="delete-confirmation">
                                <p>
                                    Type <strong>{tenant?.name}</strong> to confirm:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder={`Type "${tenant?.name}" here`}
                                    className="confirmation-input"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={handleDeleteOrganization}
                                disabled={deleteConfirmation !== tenant?.name || saving}
                            >
                                {saving ? 'Deleting...' : 'Delete Organization Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationSettings;