// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/auth.js';
import toast from 'react-hot-toast';
import './Dashboard.css';

// Import sub-components
import Overview from './dashboard/Overview2.jsx';
import Projects from './dashboard/Projects';
import Tasks from './dashboard/Tasks';
import TimeTracking from './dashboard/Timetracking.jsx';
import Team from './dashboard/Team';
import Reports from './dashboard/Reports';
import Settings from './dashboard/Settings';
import OrganizationSettings from './dashboard/OrganizationSettings';
import Billing from './dashboard/Billing';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('overview');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [tenant, setTenant] = useState(null);
    const [usage, setUsage] = useState(null);
    
    const navigate = useNavigate();

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                setLoading(true);
                
                // Load user profile
                const profile = await ApiService.getProfile();
                if (profile && !profile.error) {
                    setUser(profile);
                    ApiService.setUser(profile);
                } else {
                    navigate('/login');
                    return;
                }

                // Load tenant info
                const tenantData = await ApiService.getCurrentTenant();
                if (tenantData && !tenantData.error) {
                    setTenant(tenantData);
                }

                // Load usage stats
                // const usageData = await ApiService.getTenantUsage();
                // if (usageData && !usageData.error) {
                //     setUsage(usageData);
                // }

                // Load notifications
                loadNotifications();

            } catch (error) {
                console.error('Dashboard initialization error:', error);
                if (error.message.includes('Session expired') || error.message.includes('401')) {
                    ApiService.clearTokens();
                    navigate('/login');
                }else {
        toast.error('Failed to load dashboard. Please try again.');
    }
            } finally {
                setLoading(false);
            }
        };

        initializeDashboard();
    }, [navigate]);

    const loadNotifications = async () => {
        try {
            const notificationsData = await ApiService.getNotifications({ limit: 5 });
            if (notificationsData && !notificationsData.error) {
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
            }
            
            const unreadData = await ApiService.getUnreadCount();
            if (unreadData && !unreadData.error) {
                setUnreadCount(unreadData.count || 0);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleLogout = async () => {
        try {
            toast.loading('Logging out...');
            await ApiService.logout();
            toast.success('👋 Logged out successfully!');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout properly');
        } finally {
            ApiService.clearTokens();
            setTimeout(() => {
            navigate('/login');
        }, 1000);
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            await ApiService.markNotificationsAsRead([notificationId]);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success('Notification marked as read', {
            duration: 2000,
            position: 'bottom-right'
        });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMenuChange = (menu) => {
        setActiveMenu(menu);
    };

    const renderContent = () => {
        switch(activeMenu) {
            case 'overview':
                return <Overview user={user} tenant={tenant} usage={usage} />;
            case 'projects':
                return <Projects user={user} tenant={tenant} />;
            case 'tasks':
                return <Tasks user={user} tenant={tenant} />;
            case 'time':
                return <TimeTracking user={user} tenant={tenant} />;
            case 'team':
                return <Team user={user} tenant={tenant} />;
            case 'reports':
                return <Reports user={user} tenant={tenant} usage={usage} />;
            case 'settings':
                return <Settings user={user} />;
            case 'organization':
                return <OrganizationSettings user={user} tenant={tenant} />;
            case 'billing':
                return <Billing user={user} tenant={tenant} usage={usage} />;
            default:
                return <Overview user={user} tenant={tenant} usage={usage} />;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="org-logo">
                        {tenant?.name?.charAt(0) || user.tenant?.name?.charAt(0) || 'O'}
                    </div>
                    <div className="org-info">
                        <h2 className="org-name" title={tenant?.name || user.tenant?.name}>
                            {tenant?.name || user.tenant?.name || 'Organization'}
                        </h2>
                        <p className="org-plan">
                            <span className="plan-badge">{tenant?.plan || user.tenant?.plan || 'Free'} Plan</span>
                        </p>
                    </div>
                </div>

                <div className="user-badge">
                    <div className="user-avatar-small">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="user-info-small">
                        <p className="user-name-small">{user.firstName} {user.lastName}</p>
                        <p className="user-role-small">
                            {user.roles?.[0]?.name || 'Admin'}
                        </p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={activeMenu === 'overview' ? 'active' : ''}>
                            <button onClick={() =>{

                                handleMenuChange('overview')
                                 toast.loading('Loading overview...', { 
        duration: 500,
        position: 'top-right'
    });
                                
                            }}>
                            
                             
                                
                                <span className="nav-icon">📊</span>
                                <span>Overview</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'projects' ? 'active' : ''}>
                            <button onClick={() => {

                                handleMenuChange('projects')
                                 toast.loading('Loading projects...', { 
        duration: 300,
        position: 'top-right'
    });
                                }}>
                            
                                <span className="nav-icon">📁</span>
                                <span>Projects</span>
                                {/* <span className="badge">{usage?.current?.projects || 0}/{usage?.limits?.projects || 3}</span> */}
                            </button>
                        </li>
                        <li className={activeMenu === 'tasks' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('tasks')
                                 toast.loading('Loading tasks...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">✅</span>
                                <span>Tasks</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'time' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('time')
                                 toast.loading('Loading time...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">⏱️</span>
                                <span>Time Tracking</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'team' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('team')
                                 toast.loading('Loading team...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">👥</span>
                                <span>Team</span>
                                {/* <span className="badge">{usage?.current?.users || 0}/{usage?.limits?.users || 5}</span> */}
                            </button>
                        </li>
                        <li className={activeMenu === 'reports' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('reports')
                                 toast.loading('Loading reports...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">📈</span>
                                <span>Reports</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'organization' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('organization')
                                 toast.loading('Loading organization...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">🏢</span>
                                <span>Organization</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'billing' ? 'active' : ''}>
                            <button onClick={() => {
                                handleMenuChange('billing')
                                 toast.loading('Loading billing...', { 
        duration: 300,
        position: 'top-right'
    });
                            }}>
                                <span className="nav-icon">💰</span>
                                <span>Billing</span>
                            </button>
                        </li>
                        <li className={activeMenu === 'settings' ? 'active' : ''}>
                            <button onClick={() =>{

                                handleMenuChange('settings')
                                 toast.loading('Loading settings...', { 
        duration: 300,
        position: 'top-right'
    });
                                }}>
                        
                                <span className="nav-icon">⚙️</span>
                                <span>Settings</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="logout-btn"
                        onClick={() => setShowLogoutConfirm(true)}
                    >
                        <span className="logout-icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Navigation Bar */}
                <header className="top-bar">
                    <div className="top-bar-left">
                        <div className="breadcrumb">
                            <span className="breadcrumb-item">Dashboard</span>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-item active">
                                {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="top-bar-right">
                        <div className="top-actions">
                            {/* Notification Dropdown */}
                            <div className="notification-dropdown">
                                <button className="notification-btn">
                                    <span className="notification-icon">🔔</span>
                                    {unreadCount > 0 && (
                                        <span className="notification-count">{unreadCount}</span>
                                    )}
                                </button>
                                <div className="notification-dropdown-content">
                                    <div className="notification-header">
                                        <h4>Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button 
                                                className="mark-all-read"
                                                onClick={() => {
                                                    const unreadIds = notifications
                                                        .filter(n => !n.is_read)
                                                        .map(n => n.id);
                                                    if (unreadIds.length > 0) {
                                                        ApiService.markNotificationsAsRead(unreadIds);
                                                        setNotifications(prev => 
                                                            prev.map(n => ({ ...n, is_read: true }))
                                                        );
                                                        setUnreadCount(0);
                                                        toast.success(`Marked ${unreadIds.length} notification(s) as read`, {
            duration: 2000
        });
                                                    }else{
                                                         toast.info('No unread notifications');
                                                    }
                                                }}
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <div 
                                                    key={notification.id} 
                                                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                                    onClick={() => markNotificationAsRead(notification.id)}
                                                >
                                                    <div className="notification-icon">
                                                        {notification.type === 'project_added' && '📁'}
                                                        {notification.type === 'task_assigned' && '✅'}
                                                        {notification.type === 'mention' && '💬'}
                                                        {notification.type === 'system' && '🔔'}
                                                        {!['project_added', 'task_assigned', 'mention', 'system'].includes(notification.type) && '📢'}
                                                    </div>
                                                    <div className="notification-content">
                                                        <p className="notification-title">{notification.title}</p>
                                                        <p className="notification-message">{notification.message}</p>
                                                        <span className="notification-time">
                                                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-notifications">
                                                <p>No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-footer">
                                        <button 
                                            className="view-all-notifications"
                                            onClick={() => handleMenuChange('settings')}
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            {/* <div className="search-container">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search projects, tasks, team..."
                                />
                                <button className="search-btn">
                                    <span className="search-icon">🔍</span>
                                </button>
                            </div> */}
                            
                            {/* User Profile */}
                            <div className="user-profile-dropdown">
                                <div className="user-profile">
                                    <div className="user-avatar">
                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                    </div>
                                    <div className="user-info">
                                        <p className="user-name">{user.firstName} {user.lastName}</p>
                                        <p className="user-role">
                                            {user.roles?.[0]?.name || 'Admin'} • {tenant?.name || user.tenant?.name}
                                        </p>
                                    </div>
                                    <span className="dropdown-arrow">▼</span>
                                </div>
                                <div className="user-dropdown-content">
                                    <div className="dropdown-section">
                                        <div className="dropdown-user-info">
                                            <div className="dropdown-user-avatar">
                                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="dropdown-user-name">{user.firstName} {user.lastName}</p>
                                                <p className="dropdown-user-email">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <a href="#profile" className="dropdown-item">
                                        <span className="dropdown-icon">👤</span>
                                        <span>Your Profile</span>
                                    </a>
                                    <a href="#sessions" className="dropdown-item">
                                        <span className="dropdown-icon">💻</span>
                                        <span>Active Sessions</span>
                                    </a>
                                    <a href="#settings" className="dropdown-item">
                                        <span className="dropdown-icon">⚙️</span>
                                        <span>Account Settings</span>
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <button 
                                        className="dropdown-item logout-dropdown"
                                        onClick={() => setShowLogoutConfirm(true)}
                                    >
                                        <span className="dropdown-icon">🚪</span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="content-area">
                    {renderContent()}
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Confirm Logout</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to logout from {tenant?.name || user.tenant?.name}?</p>
                            <p>You'll need to sign in again to access your account.</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;