// components/dashboard/Team.js
import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import './Team.css';

const Team = ({ user, tenant }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        roleId: ''
    });

    useEffect(() => {
        loadTeamData();
    }, []);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            
            // Load team members
            const membersData = await ApiService.getUsers();
            if (membersData && Array.isArray(membersData.users)) {
                setTeamMembers(membersData.users);
            }

            // Load roles
            const rolesData = await ApiService.getRoles();
            if (Array.isArray(rolesData)) {
                setRoles(rolesData);
            }

            // Load pending invitations
            // This endpoint needs to be created in your backend
            // For now, we'll use empty array

        } catch (error) {
            console.error('Failed to load team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.inviteUser(inviteForm);
            if (response && response.invitationId) {
                setShowInviteModal(false);
                setInviteForm({
                    email: '',
                    firstName: '',
                    lastName: '',
                    roleId: ''
                });
                // Show success message
                alert('Invitation sent successfully!');
            }
        } catch (error) {
            console.error('Failed to invite user:', error);
            alert(error.message || 'Failed to send invitation');
        }
    };

    const handleUpdateRole = async (userId, roleId) => {
        try {
            await ApiService.updateUserRole(userId, roleId);
            loadTeamData(); // Reload data
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const handleUpdateStatus = async (userId, status) => {
        try {
            await ApiService.updateUserStatus(userId, status);
            loadTeamData(); // Reload data
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to remove this user?')) {
            try {
                await ApiService.deleteUser(userId);
                loadTeamData(); // Reload data
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    };

    return (
        <div className="team-container">
            {/* Team header */}
            <div className="team-header">
                <div className="header-left">
                    <h1>Team Management</h1>
                    <p>Manage team members and permissions</p>
                </div>
                <div className="header-right">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowInviteModal(true)}
                    >
                        + Invite Member
                    </button>
                </div>
            </div>

            {/* Team stats */}
            <div className="team-stats">
                <div className="stat-card">
                    <h3>Active Members</h3>
                    <p className="stat-number">
                        {teamMembers.filter(m => m.status === 'active').length}
                    </p>
                </div>
                <div className="stat-card">
                    <h3>Pending Invitations</h3>
                    <p className="stat-number">{invitations.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Available Roles</h3>
                    <p className="stat-number">{roles.length}</p>
                </div>
            </div>

            {/* Team table */}
            <div className="team-table-container">
                {loading ? (
                    <div className="loading">Loading team data...</div>
                ) : (
                    <table className="team-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="user-name">{member.first_name} {member.last_name}</p>
                                                {member.id === user?.id && (
                                                    <span className="you-badge">You</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{member.email}</td>
                                    <td>
                                        <select 
                                            value={member.roles?.[0]?.id || ''}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            disabled={member.id === user?.id}
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${member.status}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td>
                                        {member.last_login 
                                            ? new Date(member.last_login).toLocaleDateString()
                                            : 'Never'
                                        }
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {member.id !== user?.id && (
                                                <>
                                                    <button 
                                                        className="btn-icon"
                                                        onClick={() => handleUpdateStatus(
                                                            member.id, 
                                                            member.status === 'active' ? 'inactive' : 'active'
                                                        )}
                                                        title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {member.status === 'active' ? '⏸️' : '▶️'}
                                                    </button>
                                                    <button 
                                                        className="btn-icon danger"
                                                        onClick={() => handleDeleteUser(member.id)}
                                                        title="Remove User"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Roles Management */}
            <div className="roles-section">
                <div className="section-header">
                    <h2>Roles & Permissions</h2>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowRoleModal(true)}
                    >
                        + New Role
                    </button>
                </div>
                <div className="roles-grid">
                    {roles.map(role => (
                        <div key={role.id} className="role-card">
                            <div className="role-header">
                                <h3>{role.name}</h3>
                                {role.is_system_role && (
                                    <span className="system-badge">System</span>
                                )}
                            </div>
                            <p className="role-description">{role.description}</p>
                            <div className="role-meta">
                                <span className="meta-item">
                                    Members: {teamMembers.filter(m => m.roles?.[0]?.id === role.id).length}
                                </span>
                            </div>
                            {!role.is_system_role && (
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => {/* Open role editor */}}
                                >
                                    Edit Permissions
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Invite Team Member</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowInviteModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleInviteUser}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input
                                            type="text"
                                            value={inviteForm.firstName}
                                            onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input
                                            type="text"
                                            value={inviteForm.lastName}
                                            onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={inviteForm.roleId}
                                        onChange={(e) => setInviteForm({...inviteForm, roleId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select a role</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;