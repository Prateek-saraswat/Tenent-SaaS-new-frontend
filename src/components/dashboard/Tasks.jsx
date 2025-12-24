// components/dashboard/Tasks.js
import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import './Tasks.css';

const Tasks = ({ user, tenant }) => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTaskDetails, setShowTaskDetails] = useState(null);
    const [filters, setFilters] = useState({
        projectId: '',
        status: '',
        priority: '',
        assignedTo: '',
        search: ''
    });

    const [taskForm, setTaskForm] = useState({
        projectId: '',
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        estimatedHours: '',
        dueDate: '',
        startDate: ''
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load projects for dropdown
            const projectsData = await ApiService.getProjects({ status: 'active' });
            if (Array.isArray(projectsData)) {
                setProjects(projectsData);
            }

            // Load tasks with filters
            const params = {};
            if (filters.projectId) params.projectId = filters.projectId;
            if (filters.status) params.status = filters.status;
            if (filters.priority) params.priority = filters.priority;
            if (filters.assignedTo) params.assignedTo = filters.assignedTo;
            if (filters.search) params.search = filters.search;
            
            const tasksData = await ApiService.getTasks(params);
            if (Array.isArray(tasksData)) {
                setTasks(tasksData);
            }

        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.createTask(taskForm);
            if (response && response.taskId) {
                setShowCreateModal(false);
                setTaskForm({
                    projectId: '',
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: 'medium',
                    type: 'task',
                    estimatedHours: '',
                    dueDate: '',
                    startDate: ''
                });
                loadData();
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await ApiService.updateTask(taskId, updates);
            loadData();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await ApiService.deleteTask(taskId);
                loadData();
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const handleAssignTask = async (taskId, userIds) => {
        try {
            await ApiService.assignTask(taskId, userIds);
            loadData();
        } catch (error) {
            console.error('Failed to assign task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'medium': return '#3B82F6';
            case 'low': return '#6B7280';
            default: return '#6B7280';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'todo': return '#6B7280';
            case 'in_progress': return '#3B82F6';
            case 'review': return '#8B5CF6';
            case 'completed': return '#10B981';
            default: return '#6B7280';
        }
    };

    return (
        <div className="tasks-container">
            {/* Tasks header */}
            <div className="tasks-header">
                <div className="header-left">
                    <h1>Tasks</h1>
                    <p>Manage and track your work</p>
                </div>
                <div className="header-right">
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="search-input"
                        />
                        <select 
                            value={filters.projectId}
                            onChange={(e) => setFilters({...filters, projectId: e.target.value})}
                            className="filter-select"
                        >
                            <option value="">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select 
                            value={filters.priority}
                            onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            className="filter-select"
                        >
                            <option value="">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + New Task
                    </button>
                </div>
            </div>

            {/* Kanban Board or Task List */}
            <div className="tasks-view">
                {loading ? (
                    <div className="loading">Loading tasks...</div>
                ) : (
                    <div className="kanban-board">
                        {['todo', 'in_progress', 'review', 'completed'].map(status => {
                            const statusTasks = tasks.filter(task => task.status === status);
                            return (
                                <div key={status} className="kanban-column">
                                    <div className="column-header">
                                        <h3>
                                            {status.replace('_', ' ').toUpperCase()}
                                            <span className="task-count">({statusTasks.length})</span>
                                        </h3>
                                    </div>
                                    <div className="column-tasks">
                                        {statusTasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                className="task-card"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('taskId', task.id);
                                                }}
                                                onClick={() => setShowTaskDetails(task)}
                                            >
                                                <div className="task-header">
                                                    <h4>{task.title}</h4>
                                                    <span 
                                                        className="priority-badge"
                                                        style={{ background: getPriorityColor(task.priority) }}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                {task.description && (
                                                    <p className="task-description">{task.description}</p>
                                                )}
                                                <div className="task-meta">
                                                    <span className="meta-item">
                                                        <strong>Project:</strong> {task.project_name}
                                                    </span>
                                                    {task.dueDate && (
                                                        <span className="meta-item">
                                                            <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="task-assignees">
                                                    {task.assignees && task.assignees.split(', ').map((assignee, idx) => (
                                                        <span key={idx} className="assignee">
                                                            {assignee.charAt(0)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <div className="modal-header">
                            <h3>Create New Task</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Project *</label>
                                    <select
                                        value={taskForm.projectId}
                                        onChange={(e) => setTaskForm({...taskForm, projectId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Task Title *</label>
                                    <input
                                        type="text"
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                                        rows="4"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={taskForm.status}
                                            onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="review">Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select
                                            value={taskForm.priority}
                                            onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={taskForm.startDate}
                                            onChange={(e) => setTaskForm({...taskForm, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Due Date</label>
                                        <input
                                            type="date"
                                            value={taskForm.dueDate}
                                            onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Estimated Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={taskForm.estimatedHours}
                                        onChange={(e) => setTaskForm({...taskForm, estimatedHours: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details Modal */}
            {showTaskDetails && (
                <div className="modal-overlay">
                    <div className="modal xlarge">
                        <div className="modal-header">
                            <h3>Task Details</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowTaskDetails(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="task-details">
                                <div className="task-main">
                                    <h2>{showTaskDetails.title}</h2>
                                    <div className="task-meta-info">
                                        <span className="task-status" style={{ color: getStatusColor(showTaskDetails.status) }}>
                                            {showTaskDetails.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="task-priority" style={{ color: getPriorityColor(showTaskDetails.priority) }}>
                                            {showTaskDetails.priority.toUpperCase()}
                                        </span>
                                        <span className="task-project">
                                            Project: {showTaskDetails.project_name}
                                        </span>
                                    </div>
                                    {showTaskDetails.description && (
                                        <div className="task-description">
                                            <h4>Description</h4>
                                            <p>{showTaskDetails.description}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="task-sidebar">
                                    <div className="sidebar-section">
                                        <h4>Assigned To</h4>
                                        <div className="assignee-list">
                                            {/* Show assignees here */}
                                        </div>
                                        <button className="btn btn-secondary">Assign</button>
                                    </div>
                                    
                                    <div className="sidebar-section">
                                        <h4>Time Tracking</h4>
                                        <p>Estimated: {showTaskDetails.estimated_hours || 0} hours</p>
                                        <p>Actual: {showTaskDetails.actual_hours || 0} hours</p>
                                        <button className="btn btn-secondary">Start Timer</button>
                                    </div>
                                    
                                    <div className="sidebar-section">
                                        <h4>Actions</h4>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                // Edit task
                                            }}
                                        >
                                            Edit Task
                                        </button>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteTask(showTaskDetails.id)}
                                        >
                                            Delete Task
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;