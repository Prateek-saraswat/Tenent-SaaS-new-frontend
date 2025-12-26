// components/dashboard/Overview.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast'
import './Overview.css';

function Overview({ user, tenant, usage }) {
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        teamMembers: 0,
        hoursThisWeek: 0,
        storageUsed: '0 GB'
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadOverviewData = async () => {
    try {
        setLoading(true);
        
        // Optional: Show loading toast for longer operations
        const loadingToast = toast.loading('Loading dashboard data...');
        
        // Load projects
        const projects = await ApiService.getProjects({ status: 'active', limit: 100 });

        // Load tasks
        const tasks = await ApiService.getTasks({ limit: 100 });

        // Load team members
        const team = await ApiService.getUsers({ status: 'active' });

        // Load recent time entries
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weeklyTime = await ApiService.getWeeklyTime(lastWeek, today);

        // Calculate stats
        const activeTasks = Array.isArray(tasks) ? tasks.filter(t => t.status !== 'completed').length : 0;
        const completedTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed').length : 0;

        // Calculate weekly hours
        let weeklyHours = 0;
        if (Array.isArray(weeklyTime)) {
            weeklyHours = weeklyTime.reduce((sum, entry) => sum + (entry.total_minutes || 0), 0) / 60;
        }

        setStats({
            totalProjects: Array.isArray(projects) ? projects.length : 0,
            activeTasks,
            completedTasks,
            teamMembers: Array.isArray(team?.users) ? team.users.length : 0,
            hoursThisWeek: weeklyHours,
            storageUsed: usage?.current?.storage_gb || '0'
        });

        // Load audit logs for recent activity
        const auditLogs = await ApiService.getAuditLogs({ limit: 5 });
        if (Array.isArray(auditLogs)) {
            setRecentActivity(auditLogs);
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Show success toast if data loaded successfully
        toast.success('Dashboard loaded successfully!');

    } catch (error) {
        console.error('Failed to load overview data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
    } finally {
        setLoading(false);
    }
};

        loadOverviewData();
    }, [usage]);

    const getProgressPercentage = (current, limit) => {
        if (!limit || limit <= 0) return 0;
        return Math.min((current / limit) * 100, 100);
    };

    // Quick Actions Handlers
    const handleCreateProject = () => {
            toast('Navigating to create project...', {
        icon: '📁',
        duration: 2000
    });
        navigate('/projects', { state: { createNew: true } });
    };

    const handleInviteMember = () => {
          toast('Opening team invitation...', {
        icon: '👥',
        duration: 2000
    });
        navigate('/team', { state: { showInvite: true } });
    };

    const handleCreateTask = () => {
          toast('Creating new task...', {
        icon: '✅',
        duration: 2000
    });
        navigate('/tasks', { state: { createNew: true } });
    };

    const handleStartTimer = () => {
         toast('Starting timer...', {
        icon: '⏱️',
        duration: 2000
    });
        navigate('/time', { state: { startTimer: true } });
    };

    const handleViewReports = () => {
         toast('Loading reports...', {
        icon: '📈',
        duration: 2000
    });
        navigate('/reports');
    };

    const handleSettings = () => {
          toast('Opening settings...', {
        icon: '⚙️',
        duration: 2000
    });
        navigate('/settings');
    };

    const handleViewAllActivity = () => {
          toast('Loading audit logs...', {
        icon: '📋',
        duration: 2000
    });
        navigate('/organization/audit-logs');
    };

    const handleUpgradePlan = () => {
         toast('Opening billing page...', {
        icon: '💳',
        duration: 2000
    });
        navigate('/billing');
    };

    if (loading) {
        return (
            <div className="overview-loading">
                <div className="spinner"></div>
                <p>Loading overview...</p>
                {/* {toast.loading('Loading your dashboard...', {
                id: 'dashboard-loading'
            })} */}
            </div>
        );
    }

    return (
        <div className="overview-container">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-card">
                    <h1>Welcome back, {user?.firstName}! 👋</h1>
                    <p>Here's what's happening with {tenant?.name || 'your organization'} today.</p>

                    <div className="welcome-info">
                        <div className="info-item">
                            <span className="info-label">Organization:</span>
                            <span className="info-value">{tenant?.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Your Role:</span>
                            <span className="info-value">{user?.roles?.[0]?.name || 'Administrator'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Account Type:</span>
                            <span className="info-value">{tenant?.plan || 'Free'} Plan</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#3B82F6' }}>
                        📊
                    </div>
                    <div className="stat-content">
                        <h3>Active Projects</h3>
                        <p className="stat-number">{stats.totalProjects}</p>
                        <div className="stat-progress">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${getProgressPercentage(stats.totalProjects, usage?.limits?.projects || 3)}%`
                                }}
                            ></div>
                        </div>
                        <p className="stat-trend">
                            {stats.totalProjects}/{usage?.limits?.projects || 3} limit
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#10B981' }}>
                        ✅
                    </div>
                    <div className="stat-content">
                        <h3>Tasks</h3>
                        <p className="stat-number">{stats.activeTasks + stats.completedTasks}</p>
                        <div className="stat-details">
                            <span className="stat-detail active">{stats.activeTasks} active</span>
                            <span className="stat-detail completed">{stats.completedTasks} completed</span>
                        </div>
                        <p className="stat-trend">
                            {stats.completedTasks > 0 ? `${Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100)}% completion` : 'No tasks yet'}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#F59E0B' }}>
                        ⏱️
                    </div>
                    <div className="stat-content">
                        <h3>Hours This Week</h3>
                        <p className="stat-number">{stats.hoursThisWeek.toFixed(1)}</p>
                        <div className="stat-progress">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${Math.min((stats.hoursThisWeek / 40) * 100, 100)}%`,
                                    background: '#F59E0B'
                                }}
                            ></div>
                        </div>
                        <p className="stat-trend">Tracked this week</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#8B5CF6' }}>
                        👥
                    </div>
                    <div className="stat-content">
                        <h3>Team Members</h3>
                        <p className="stat-number">{stats.teamMembers}</p>
                        <div className="stat-progress">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${getProgressPercentage(stats.teamMembers, usage?.limits?.users || 5)}%`,
                                    background: '#8B5CF6'
                                }}
                            ></div>
                        </div>
                        <p className="stat-trend">
                            {stats.teamMembers}/{usage?.limits?.users || 5} limit
                        </p>
                    </div>
                </div>
            </div>

            {/* Usage Limits */}
            <div className="usage-section">
                <div className="section-header">
                    <h2>Usage & Limits</h2>
                    <button
                        className="btn btn-secondary"
                        onClick={handleUpgradePlan}
                    >
                        Upgrade Plan
                    </button>
                </div>

                <div className="usage-cards">
                    <div className="usage-card">
                        <div className="usage-header">
                            <h3>Users</h3>
                            <span className="usage-count">
                                {stats.teamMembers}/{usage?.limits?.users || 5}
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div
                                className="usage-progress-bar"
                                style={{
                                    width: `${getProgressPercentage(stats.teamMembers, usage?.limits?.users || 5)}%`,
                                    background: getProgressPercentage(stats.teamMembers, usage?.limits?.users || 5) > 80 ? '#EF4444' : '#3B82F6'
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {getProgressPercentage(stats.teamMembers, usage?.limits?.users || 5) > 80
                                ? 'Approaching limit'
                                : 'Within limits'}
                        </p>
                    </div>

                    <div className="usage-card">
                        <div className="usage-header">
                            <h3>Projects</h3>
                            <span className="usage-count">
                                {stats.totalProjects}/{usage?.limits?.projects || 3}
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div
                                className="usage-progress-bar"
                                style={{
                                    width: `${getProgressPercentage(stats.totalProjects, usage?.limits?.projects || 3)}%`,
                                    background: getProgressPercentage(stats.totalProjects, usage?.limits?.projects || 3) > 80 ? '#EF4444' : '#10B981'
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {getProgressPercentage(stats.totalProjects, usage?.limits?.projects || 3) > 80
                                ? 'Approaching limit'
                                : 'Within limits'}
                        </p>
                    </div>

                    <div className="usage-card">
                        <div className="usage-header">
                            <h3>Storage</h3>
                            <span className="usage-count">
                                {usage?.current?.storage_gb || '0'} GB / {usage?.limits?.storage_gb || 1} GB
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div
                                className="usage-progress-bar"
                                style={{
                                    width: `${usage?.percentages?.storage || 0}%`,
                                    background: usage?.percentages?.storage > 80 ? '#EF4444' : '#F59E0B'
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {usage?.percentages?.storage > 80
                                ? 'Running low on storage'
                                : 'Sufficient storage available'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="dashboard-row">
                <div className="activity-section">
                    <div className="section-header">
                        <h2>Recent Activity</h2>
                        <button
                            className="btn btn-secondary"
                            onClick={handleViewAllActivity}
                        >
                            View All
                        </button>
                    </div>

                    <div className="activity-list">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">
                                        {activity.action === 'create' && '➕'}
                                        {activity.action === 'update' && '✏️'}
                                        {activity.action === 'delete' && '🗑️'}
                                        {activity.action === 'login' && '🔐'}
                                        {!['create', 'update', 'delete', 'login'].includes(activity.action) && '📝'}
                                    </div>
                                    <div className="activity-content">
                                        <p>
                                            <strong>{activity.user_name || 'System'}</strong>{' '}
                                            {activity.action} {activity.entity_type}
                                            {activity.entity_id && ` #${activity.entity_id}`}
                                        </p>
                                        <small>
                                            {new Date(activity.created_at).toLocaleDateString()} •
                                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-activity">
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* <div className="quick-actions-section">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>

                    <div className="quick-actions-grid">
                        <button
                            className="quick-action"
                            onClick={handleCreateProject}
                        >
                            <span className="action-icon">➕</span>
                            <span className="action-text">New Project</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={handleInviteMember}
                        >
                            <span className="action-icon">👥</span>
                            <span className="action-text">Invite Member</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={handleCreateTask}
                        >
                            <span className="action-icon">✅</span>
                            <span className="action-text">Create Task</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={handleStartTimer}
                        >
                            <span className="action-icon">⏱️</span>
                            <span className="action-text">Start Timer</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={handleViewReports}
                        >
                            <span className="action-icon">📈</span>
                            <span className="action-text">View Reports</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={handleSettings}
                        >
                            <span className="action-icon">⚙️</span>
                            <span className="action-text">Settings</span>
                        </button>
                    </div>
                </div> */}
            </div>

            {/* Getting Started */}
            {/* <div className="getting-started">
                <div className="section-header">
                    <h2>Getting Started</h2>
                    <p>Complete these steps to maximize your experience</p>
                </div>

                <div className="steps-grid">
                    <div className={`step-card ${stats.teamMembers > 1 ? 'completed' : ''}`}>
                        <div className="step-number">1</div>
                        <h3>Invite Team Members</h3>
                        <p>Add members to collaborate</p>
                        {stats.teamMembers > 1 ? (
                            <span className="step-status">✓ Completed</span>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                onClick={handleInviteMember}
                            >
                                Invite Now
                            </button>
                        )}
                    </div>

                    <div className={`step-card ${stats.totalProjects > 0 ? 'completed' : ''}`}>
                        <div className="step-number">2</div>
                        <h3>Create First Project</h3>
                        <p>Start organizing your work</p>
                        {stats.totalProjects > 0 ? (
                            <span className="step-status">✓ Completed</span>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                onClick={handleCreateProject}
                            >
                                Create Project
                            </button>
                        )}
                    </div>

                    <div className={`step-card ${stats.activeTasks + stats.completedTasks > 0 ? 'completed' : ''}`}>
                        <div className="step-number">3</div>
                        <h3>Add Tasks</h3>
                        <p>Create tasks for your projects</p>
                        {stats.activeTasks + stats.completedTasks > 0 ? (
                            <span className="step-status">✓ Completed</span>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                onClick={handleCreateTask}
                            >
                                Add Task
                            </button>
                        )}
                    </div>

                    <div className={`step-card ${stats.hoursThisWeek > 0 ? 'completed' : ''}`}>
                        <div className="step-number">4</div>
                        <h3>Track Time</h3>
                        <p>Start tracking work hours</p>
                        {stats.hoursThisWeek > 0 ? (
                            <span className="step-status">✓ Completed</span>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                onClick={handleStartTimer}
                            >
                                Start Timer
                            </button>
                        )}
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default Overview;