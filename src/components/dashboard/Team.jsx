// components/dashboard/Team.js
import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './Team.css';

const Team = ({ user, tenant }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
     const [isSubmitting, setIsSubmitting] = useState(false);
        const inviteModalRef = useRef(null);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        roleId: ''
    });

    const [errors, setErrors] = useState({});
const [successMessage, setSuccessMessage] = useState('');
const roleModalRef = useRef(null);

const resetInviteForm = () => {
    setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        roleId: ''
    });
    setErrors({});
};

// Reset role form function
const resetRoleForm = () => {
    setRoleForm({
        name: '',
        description: '',
        permissions: []
    });
    setErrors({});
};

// Close invite modal handler
const handleCloseInviteModal = () => {
    if (!isSubmitting) {
        resetInviteForm();
        setShowInviteModal(false);
    }
};

// Close role modal handler
const handleCloseRoleModal = () => {
    resetRoleForm();
    setShowRoleModal(false);
};

// Validate invite form
const validateInviteForm = () => {
    const newErrors = {};
    
    if (!inviteForm.email) {
        newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
        newErrors.email = 'Email is invalid';
    }
    
    if (!inviteForm.firstName.trim()) {
        newErrors.firstName = 'First name is required';
    }
    
    if (!inviteForm.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
    }
    
    if (!inviteForm.roleId) {
        newErrors.roleId = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

     useEffect(() => {
        const handleClickOutside = (event) => {
            if (showInviteModal && 
                inviteModalRef.current && 
                !inviteModalRef.current.contains(event.target) &&
                !isSubmitting
            ) {
                handleCloseInviteModal();
            }
             if (showRoleModal && 
        roleModalRef.current && 
        !roleModalRef.current.contains(event.target)
    ) {
        handleCloseRoleModal(); // Changed from setShowRoleModal(false)
    }
        };

        if (showInviteModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showInviteModal, isSubmitting]);

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
             toast.success('Team data loaded successfully!');

        } catch (error) {
            console.error('Failed to load team data:', error);
             toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
         if (!validateInviteForm()) {
        return;
    }
         if (isSubmitting) return;
          setIsSubmitting(true);
          setErrors({}); // ADD THIS
    setSuccessMessage(''); // ADD THIS
        try {
            const response = await ApiService.inviteUser(inviteForm);
            if (response && response.invitationId) {
                toast.success('Invitation sent successfully!');
                 setSuccessMessage('Invitation sent successfully!');
                setShowInviteModal(false);
                setInviteForm({
                    email: '',
                    firstName: '',
                    lastName: '',
                    roleId: ''
                });
                 setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
                // Show success message
                alert('Invitation sent successfully!');
                setTimeout(() => {
                handleCloseInviteModal(); // Changed from setShowInviteModal(false)
                loadTeamData(); // Refresh team data
            }, 1500);
            }
        } catch (error) {
            console.error('Failed to invite user:', error);
         toast.error(error.message || 'Failed to send invitation');

             setErrors({ // ADD THIS
            submit: error.message || 'Failed to send invitation. Please try again.' 
        });
        }finally{
            setIsSubmitting(false);
        }
    };
    const handleInputChange = (field, value) => {
    setInviteForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
    }
};

    const handleUpdateRole = async (userId, roleId) => {
        try {
            await ApiService.updateUserRole(userId, roleId);
            loadTeamData(); // Reload data
            toast.success('User role updated successfully!')
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role. Please try again.');
        }
    };

    const handleUpdateStatus = async (userId, status) => {
        try {
            await ApiService.updateUserStatus(userId, status);
             toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully!`);
            loadTeamData(); // Reload data
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status. Please try again.');
        }
    };

    const handleDeleteUser = async (userId) => {
    // Get user name for better confirmation message
    const userToDelete = teamMembers.find(member => member.id === userId);
    const userName = userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : 'this user';
    
    // Custom toast confirmation instead of window.confirm
    const userConfirmed = await new Promise((resolve) => {
        toast.custom((t) => (
            <div className="confirm-toast">
                <p>Are you sure you want to remove {userName}?</p>
                <div className="confirm-buttons">
                    <button 
                        className="danger-btn"
                        onClick={() => { 
                            resolve(true); 
                            toast.dismiss(t.id); 
                        }}
                    >
                        Yes, Remove User
                    </button>
                    <button 
                        onClick={() => { 
                            resolve(false); 
                            toast.dismiss(t.id); 
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    });

    if (!userConfirmed) return;

    try {
        await ApiService.deleteUser(userId);
        toast.success(`User ${userName} removed successfully!`); // REPLACE THE ALERT
        loadTeamData();
    } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to remove user. Please try again.'); // ADD ERROR TOAST
    }
};

    return (
        <div className="team-container">
            {/* Team header */}
            {successMessage && (
            <div className="alert alert-success">
                {successMessage}
                <button 
                    className="alert-close"
                    onClick={() => setSuccessMessage('')}
                >
                    ×
                </button>
            </div>
        )}
        
        {/* Error Message - ADD THIS */}
        {errors.general && (
            <div className="alert alert-error">
                {errors.general}
                <button 
                    className="alert-close"
                    onClick={() => setErrors(prev => ({ ...prev, general: '' }))}
                >
                    ×
                </button>
            </div>
        )}
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
                    <div className="modal"  ref={inviteModalRef}>
                        <div className="modal-header">
                            <h3>Invite Team Member</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowInviteModal(false)}
                                  disabled={isSubmitting}
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
                                         disabled={isSubmitting}
                                         className={errors.email ? 'error' : ''}
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input
                                            type="text"
                                            value={inviteForm.firstName}
                                            onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input
                                            type="text"
                                            value={inviteForm.lastName}
                                            onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={inviteForm.roleId}
                                        onChange={(e) => setInviteForm({...inviteForm, roleId: e.target.value})}
                                        required
                                         disabled={isSubmitting}
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
                                     disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                     {isSubmitting ? 'Sending...' : 'Send Invitation'}
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