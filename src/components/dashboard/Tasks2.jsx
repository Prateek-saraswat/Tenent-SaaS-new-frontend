// components/dashboard/Tasks.js
import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './Tasks.css';

const Tasks = ({ user, tenant }) => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTaskDetails, setShowTaskDetails] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createModalRef = useRef(null);
    const detailsModalRef = useRef(null);
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
    
    const [formErrors, setFormErrors] = useState({
        projectId: '',
        title: '',
        description: '',
        startDate: '',
        dueDate: '',
        estimatedHours: ''
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCreateModal && 
                createModalRef.current && 
                !createModalRef.current.contains(event.target) &&
                !isSubmitting
            ) {
                resetCreateTaskModal();
            }
            
            if (showTaskDetails && 
                detailsModalRef.current && 
                !detailsModalRef.current.contains(event.target)
            ) {
                resetTaskDetailsModal(); 
            }
        };

        if (showCreateModal || showTaskDetails) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCreateModal, showTaskDetails, isSubmitting]);

    useEffect(() => {
        loadData();
    }, [filters]);

    const resetCreateTaskModal = () => {
        setShowCreateModal(false);
        setIsSubmitting(false);
        setFormErrors({
            projectId: '',
            title: '',
            description: '',
            startDate: '',
            dueDate: '',
            estimatedHours: ''
        });
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
    };

    const resetTaskDetailsModal = () => {
        setShowTaskDetails(null);
    };

    const validateTaskForm = () => {
        const errors = {
            projectId: '',
            title: '',
            description: '',
            startDate: '',
            dueDate: '',
            estimatedHours: ''
        };

        // Required fields validation
        if (!taskForm.projectId) {
            errors.projectId = 'Project is required';
        }

        if (!taskForm.title.trim()) {
            errors.title = 'Task title is required';
        } else if (taskForm.title.trim().length < 3) {
            errors.title = 'Task title must be at least 3 characters';
        }

        if (!taskForm.description.trim()) {
            errors.description = 'Task description is required';
        } else if (taskForm.description.trim().length < 10) {
            errors.description = 'Description must be at least 10 characters';
        }

        // Date & hours validation
        const dateErrors = validateDates(
            taskForm.startDate,
            taskForm.dueDate,
            taskForm.estimatedHours
        );

        return { ...errors, ...dateErrors };
    };

    const validateDates = (startDate, dueDate, estimatedHours) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const errors = { startDate: '', dueDate: '', estimatedHours: '' };

        // Start Date validation
        if (!startDate) {
            errors.startDate = 'Start date is required';
        } else {
            const start = new Date(startDate).setHours(0, 0, 0, 0);
            if (start < today) {
                errors.startDate = 'Start date cannot be in the past';
            }
            const year = new Date(startDate).getFullYear();
            if (year < 1900 || year > 2100) {
                errors.startDate = 'Please enter a valid year (1900-2100)';
            }
        }

        // Due Date validation
        if (!dueDate) {
            errors.dueDate = 'Due date is required';
        } else {
            const due = new Date(dueDate);
            if (startDate) {
                const start = new Date(startDate);
                if (due < start) {
                    errors.dueDate = 'Due date must be after start date';
                }
            }
            const dueYear = due.getFullYear();
            if (dueYear < 1900 || dueYear > 2100) {
                errors.dueDate = 'Please enter a valid year (1900-2100)';
            }
        }

        // Estimated Hours validation
        if (!estimatedHours) {
            errors.estimatedHours = 'Estimated hours is required';
        } else {
            const hours = parseFloat(estimatedHours);
            if (isNaN(hours)) {
                errors.estimatedHours = 'Estimated hours must be a number';
            } else if (hours <= 0) {
                errors.estimatedHours = 'Estimated hours must be greater than 0';
            } else if (hours > 999) {
                errors.estimatedHours = 'Estimated hours cannot exceed 999';
            }
        }

        return errors;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            
            const projectsData = await ApiService.getProjects({ status: 'active' });
            if (Array.isArray(projectsData)) {
                setProjects(projectsData);
            }

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
            toast.success('Tasks loaded successfully!');
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        const validationErrors = validateTaskForm();
        const hasErrors = Object.values(validationErrors).some(error => error !== '');

        if (hasErrors) {
            setFormErrors(validationErrors);
            
            const errorCount = Object.values(validationErrors).filter(error => error !== '').length;
            toast.error(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting`, {
                duration: 3000,
            });
            
            return;
        }

        setIsSubmitting(true);

        try {
            await ApiService.createTask(taskForm);
            toast.success('Task created successfully!');
            resetCreateTaskModal();
            loadData();
        } catch (error) {
            console.error('Failed to create task:', error);
            toast.error(error.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await ApiService.updateTask(taskId, updates);
            toast.success('Task updated successfully!');
            loadData();
        } catch (error) {
            console.error('Failed to update task:', error);
            toast.error(error.message || 'Failed to update task'); 
        }
    };

    const handleDeleteTask = async (taskId) => {
        const taskToDelete = tasks.find(task => task.id === taskId);
        const taskTitle = taskToDelete?.title || 'this task';
        
        const userConfirmed = await new Promise((resolve) => {
            toast.custom((t) => (
                <div className="confirm-toast">
                    <p>Are you sure you want to delete "{taskTitle}"?</p>
                    <div className="confirm-buttons">
                        <button 
                            className="danger-btn"
                            onClick={() => { 
                                resolve(true); 
                                toast.dismiss(t.id); 
                            }}
                        >
                            Delete Task
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
            await ApiService.deleteTask(taskId);
            toast.success(`Task "${taskTitle}" deleted successfully!`);
            loadData();
            if (showTaskDetails?.id === taskId) {
                resetTaskDetailsModal();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error(error.message || 'Failed to delete task');
        }
    };

    const handleAssignTask = async (taskId, userIds) => {
        try {
            await ApiService.assignTask(taskId, userIds);
            toast.success('Task assigned successfully!');
            loadData();
        } catch (error) {
            console.error('Failed to assign task:', error);
            toast.error(error.message || 'Failed to assign task')
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

    // Helper function to clear specific error when user types
    const clearError = (fieldName) => {
        setFormErrors(prev => ({
            ...prev,
            [fieldName]: ''
        }));
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
                            onChange={(e) => {
                                setFilters({...filters, search: e.target.value})
                                if (e.target.value) {
                                    toast(`Searching for "${e.target.value}"...`, {
                                        icon: '🔍',
                                        duration: 500
                                    });
                                }
                            }}
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
                        onClick={() => {
                            setShowCreateModal(true)
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
                            setFormErrors({ 
                                projectId: '', 
                                title: '', 
                                description: '',
                                startDate: '', 
                                dueDate: '', 
                                estimatedHours: '' 
                            });
                            toast('Creating new task...', {
                                icon: '✅',
                                duration: 1000
                            });
                        }}
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
                                                onClick={() => {
                                                    setShowTaskDetails(task)
                                                    toast(`Opening "${task.title}" details...`, {
                                                        icon: '📋',
                                                        duration: 1000
                                                    });
                                                }}
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
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.className === 'modal-overlay' && !isSubmitting) {
                        resetCreateTaskModal();
                    }
                }}>
                    <div className="modal large" ref={createModalRef}>
                        <div className="modal-header">
                            <h3>Create New Task</h3>
                            <button 
                                className="close-btn"
                                onClick={resetCreateTaskModal}
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Validation Errors Summary */}
                        {Object.values(formErrors).some(error => error !== '') && (
                            <div className="form-errors-summary" style={{
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                borderRadius: '8px',
                                padding: '16px',
                                margin: '0 20px 20px 20px'
                            }}>
                                <p style={{ color: '#DC2626', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                                    ⚠️ Please fix the following errors:
                                </p>
                                <ul style={{ color: '#991B1B', margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                                    {formErrors.projectId && <li>• {formErrors.projectId}</li>}
                                    {formErrors.title && <li>• {formErrors.title}</li>}
                                    {formErrors.description && <li>• {formErrors.description}</li>}
                                    {formErrors.startDate && <li>• {formErrors.startDate}</li>}
                                    {formErrors.dueDate && <li>• {formErrors.dueDate}</li>}
                                    {formErrors.estimatedHours && <li>• {formErrors.estimatedHours}</li>}
                                </ul>
                            </div>
                        )}
                        
                        <form onSubmit={handleCreateTask} onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                        }}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Project *</label>
                                    <select
                                        value={taskForm.projectId}
                                        onChange={(e) => {
                                            setTaskForm({...taskForm, projectId: e.target.value});
                                            clearError('projectId');
                                        }}
                                        className={formErrors.projectId ? 'error' : ''}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.projectId && (
                                        <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                            {formErrors.projectId}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>Task Title *</label>
                                    <input
                                        type="text"
                                        value={taskForm.title}
                                        onChange={(e) => {
                                            setTaskForm({...taskForm, title: e.target.value});
                                            clearError('title');
                                        }}
                                        className={formErrors.title ? 'error' : ''}
                                        required
                                    />
                                    {formErrors.title && (
                                        <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                            {formErrors.title}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea
                                        value={taskForm.description}
                                        onChange={(e) => {
                                            setTaskForm({...taskForm, description: e.target.value});
                                            clearError('description');
                                        }}
                                        rows="4"
                                        className={formErrors.description ? 'error' : ''}
                                        required
                                    />
                                    {formErrors.description && (
                                        <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                            {formErrors.description}
                                        </span>
                                    )}
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
                                        <label>Start Date *</label>
                                        <input
                                            type="date"
                                            onKeyDown={(e) => e.preventDefault()}
                                            className={formErrors.startDate ? 'error' : ''}
                                            min={new Date().toISOString().split('T')[0]}
                                            value={taskForm.startDate}
                                            onChange={(e) => {
                                                setTaskForm({...taskForm, startDate: e.target.value});
                                                clearError('startDate');
                                            }}
                                            required
                                        />
                                        {formErrors.startDate && (
                                            <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                                {formErrors.startDate}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Due Date *</label>
                                        <input
                                            type="date"
                                            className={formErrors.dueDate ? 'error' : ''}
                                            min={taskForm.startDate || new Date().toISOString().split('T')[0]}
                                            value={taskForm.dueDate}
                                            onChange={(e) => {
                                                setTaskForm({...taskForm, dueDate: e.target.value});
                                                clearError('dueDate');
                                            }}
                                            onKeyDown={(e) => e.preventDefault()}
                                            required
                                        />
                                        {formErrors.dueDate && (
                                            <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                                {formErrors.dueDate}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Estimated Hours *</label>
                                    <input
                                        type="number"
                                        className={formErrors.estimatedHours ? 'error' : ''}
                                        step="0.5"
                                        value={taskForm.estimatedHours}
                                        onChange={(e) => {
                                            setTaskForm({...taskForm, estimatedHours: e.target.value});
                                            clearError('estimatedHours');
                                        }}
                                        placeholder="e.g., 2.5"
                                        min="0.5"
                                        max="999"
                                        required
                                    />
                                    {formErrors.estimatedHours && (
                                        <span className="error-message" style={{display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                            {formErrors.estimatedHours}
                                        </span>
                                    )}
                                    <small className="form-hint">Enter hours (e.g., 1.5 for 1 hour 30 minutes)</small>
                                </div>
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetCreateTaskModal}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details Modal */}
            {showTaskDetails && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.className === 'modal-overlay') {
                        resetTaskDetailsModal();
                    }
                }}>
                    <div className="modal xlarge" ref={detailsModalRef}>
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