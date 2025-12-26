// components/dashboard/TimeTracking.js
import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './TimeTracking.css';

const TimeTracking = ({ user, tenant }) => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const manualEntryModalRef = useRef(null);
    const [successMessage , setSuccessMessage] = ('')
    const [formErrors, setFormErrors] = useState({
    startTime: '',
    endTime: ''
});
    
    const [manualEntry, setManualEntry] = useState({
        taskId: '',
        startTime: '',
        endTime: '',
        description: '',
        isBillable: true
    });
    // Reset manual entry form function
const resetManualEntry = () => {
    setManualEntry({
        taskId: '',
        startTime: '',
        endTime: '',
        description: '',
        isBillable: true
    });
    setFormErrors({ startTime: '', endTime: '' });
};

// Close manual entry modal handler
const handleCloseManualEntry = () => {
    if (!isSubmitting) {
        resetManualEntry();
        setShowManualEntry(false);
    }
};

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showManualEntry && 
                manualEntryModalRef.current && 
                !manualEntryModalRef.current.contains(event.target) &&
                !isSubmitting
            ) {
                handleCloseManualEntry();
                setFormErrors({ startTime: '', endTime: '' });
            }
        };

        if (showManualEntry) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showManualEntry, isSubmitting]);

    useEffect(() => {
        loadTimeData();
    }, [selectedDate]);

    const loadTimeData = async () => {
        try {
            setLoading(true);
            
            // Load daily time entries
            const dailyEntries = await ApiService.getDailyTime(selectedDate);
            if (Array.isArray(dailyEntries?.entries)) {
                setTimeEntries(dailyEntries.entries);
            }

            // Load active timer
            const activeEntries = await ApiService.getDailyTime(new Date().toISOString().split('T')[0]);
            const active = Array.isArray(activeEntries?.entries) 
                ? activeEntries.entries.find(e => !e.end_time)
                : null;
            setActiveTimer(active);

            // Load tasks for dropdown
            const tasksData = await ApiService.getTasks({ limit: 50 });
            if (Array.isArray(tasksData)) {
                setTasks(tasksData);
            }
            toast.success('Time data loaded successfully!'); 

        } catch (error) {
            console.error('Failed to load time data:', error);
              toast.error('Failed to load time data');
        } finally {
            setLoading(false);
        }
    };

    const validateManualEntry = (startTime, endTime) => {
    const errors = { startTime: '', endTime: '' };
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start > now) {
        errors.startTime = 'Start time cannot be in the future';
    }
    
    if (endTime && startTime && end <= start) {
        errors.endTime = 'End time must be after start time';
    }
    
    if (end > now) {
        errors.endTime = 'End time cannot be in the future';
    }
    
    return errors;
};
    const handleStartTimer = async (taskId) => {
        try {
            const response = await ApiService.startTimer(taskId);
            if (response && response.entryId) {
                toast.success('Timer started successfully!');
                loadTimeData(); // Reload data
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
            toast.error(error.message || 'Failed to start timer')
        }
    };

    const handleStopTimer = async () => {
        try {
            await ApiService.stopTimer();
            toast.success('Timer stopped successfully!');
            setActiveTimer(null);
            loadTimeData(); // Reload data
        } catch (error) {
            console.error('Failed to stop timer:', error);
             toast.error(error.message || 'Failed to stop timer')
        }
    };

    const handleAddManualEntry = async (e) => {
        e.preventDefault();
           if (isSubmitting) return;
           setIsSubmitting(true);
           const errors = validateManualEntry(manualEntry.startTime, manualEntry.endTime);
    if (errors.startTime || errors.endTime) {
        setFormErrors(errors);
          if (errors.startTime) toast.error(errors.startTime);
        if (errors.endTime) toast.error(errors.endTime);
        setIsSubmitting(false);
        return;
    }
    
    setFormErrors({ startTime: '', endTime: '' });
        try {
            const response = await ApiService.addManualTimeEntry(manualEntry);
            if (response && response.entryId) {
                 toast.success('Time entry added successfully!');
                setSuccessMessage('Time entry added successfully!');
                 setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
                setShowManualEntry(false);
                setManualEntry({
                    taskId: '',
                    startTime: '',
                    endTime: '',
                    description: '',
                    isBillable: true
                });
                loadTimeData();
            }
        } catch (error) {
            console.error('Failed to add manual entry:', error);
             toast.error(error.message || 'Failed to add time entry');
            setFormErrors({ 
            submit: error.message || 'Failed to add time entry. Please try again.' 
        });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitTimesheet = async () => {
        const entryIds = timeEntries
            .filter(e => e.status === 'draft')
            .map(e => e.id);
        
        if (entryIds.length === 0){
toast.error('No draft entries to submit'); 
return
        }
        
        try {
            await ApiService.submitTimesheet(entryIds);
            toast.success('Timesheet submitted successfully!');
            loadTimeData(); // Reload data
        } catch (error) {
            console.error('Failed to submit timesheet:', error);
            toast.error(error.message || 'Failed to submit timesheet');
        }
    };

    const getDurationString = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getTotalDuration = () => {
        return timeEntries.reduce((total, entry) => total + (entry.duration_minutes || 0), 0);
    };

    return (
        <div className="time-tracking-container">
            {/* Time Tracking header */}
             {/* {successMessage && (
            <div className="alert alert-success">
                {successMessage}
                <button 
                    className="alert-close"
                    onClick={() => setSuccessMessage('')}
                >
                    ×
                </button>
            </div>
        )} */}
            <div className="time-header">
                <div className="header-left">
                    <h1>Time Tracking</h1>
                    <p>Track your work hours and productivity</p>
                </div>
                <div className="header-right">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-selector"
                    />
                    <button 
                        className="btn btn-secondary"
                        onClick={() => {
                            setShowManualEntry(true)
                            resetManualEntry();
                        }}
                    >
                        + Manual Entry
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={handleSubmitTimesheet}
                        disabled={!timeEntries.some(e => e.status === 'draft')}
                    >
                        Submit Timesheet
                    </button>
                </div>
            </div>

            {/* Active Timer Section */}
            {activeTimer && (
                <div className="active-timer">
                    <div className="timer-card">
                        <div className="timer-header">
                            <h3>⏱️ Timer Running</h3>
                            <div className="timer-display">
                                {(() => {
                                    const start = new Date(activeTimer.start_time);
                                    const now = new Date();
                                    const diff = Math.floor((now - start) / 1000 / 60);
                                    return getDurationString(diff);
                                })()}
                            </div>
                        </div>
                        <p>Task: {activeTimer.task_title}</p>
                        {activeTimer.description && (
                            <p>Description: {activeTimer.description}</p>
                        )}
                        <button 
                            className="btn btn-danger"
                            onClick={handleStopTimer}
                        >
                            Stop Timer
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Start Timer */}
            <div className="quick-timer">
                <h3>Quick Start Timer</h3>
                <div className="task-buttons">
                    {tasks.slice(0, 5).map(task => (
                        <button
                            key={task.id}
                            className="task-timer-btn"
                            onClick={() => handleStartTimer(task.id)}
                            disabled={!!activeTimer}
                        >
                            <span className="task-name">{task.title}</span>
                            <span className="project-name">{task.project_name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Entries Table */}
            <div className="time-entries">
                <div className="entries-header">
                    <h3>Time Entries for {new Date(selectedDate).toLocaleDateString()}</h3>
                    <div className="total-duration">
                        Total: {getDurationString(getTotalDuration())}
                    </div>
                </div>
                
                {loading ? (
                    <div className="loading">Loading time entries...</div>
                ) : timeEntries.length > 0 ? (
                    <table className="entries-table">
                        <thead>
                            <tr>
                                <th>Task / Project</th>
                                <th>Description</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Billable</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td>
                                        <div>
                                            <strong>{entry.task_title}</strong>
                                            <div className="project-info">{entry.project_name}</div>
                                        </div>
                                    </td>
                                    <td>{entry.description || '-'}</td>
                                    <td>
                                        {new Date(entry.start_time).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        {entry.end_time 
                                            ? new Date(entry.end_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'Running'
                                        }
                                    </td>
                                    <td>{getDurationString(entry.duration_minutes || 0)}</td>
                                    <td>
                                        <span className={`status-badge ${entry.status}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td>
                                        {entry.is_billable ? '✅' : '❌'}
                                    </td>
                                    <td>
                                        {entry.status === 'draft' && (
                                            <button 
                                                className="btn-icon"
                                                onClick={() => {
                                                    // Edit entry
                                                }}
                                            >
                                                ✏️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-entries">
                        <p>No time entries for this date</p>
                    </div>
                )}
            </div>

            {/* Weekly Summary */}
            <div className="weekly-summary">
                <h3>This Week's Summary</h3>
                <div className="summary-cards">
                    <div className="summary-card">
                        <h4>Total Hours</h4>
                        <p className="summary-number">{getDurationString(getTotalDuration())}</p>
                    </div>
                    <div className="summary-card">
                        <h4>Billable Hours</h4>
                        <p className="summary-number">
                            {getDurationString(
                                timeEntries
                                    .filter(e => e.is_billable)
                                    .reduce((total, e) => total + (e.duration_minutes || 0), 0)
                            )}
                        </p>
                    </div>
                    <div className="summary-card">
                        <h4>Tasks Worked On</h4>
                        <p className="summary-number">
                            {new Set(timeEntries.map(e => e.task_id)).size}
                        </p>
                    </div>
                    <div className="summary-card">
                        <h4>Average Per Day</h4>
                        <p className="summary-number">
                            {getDurationString(Math.floor(getTotalDuration() / 7))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="modal-overlay">
                    <div className="modal"  ref={manualEntryModalRef}>
                        <div className="modal-header">
                            <h3>Add Manual Time Entry</h3>
                            <button 
                                className="close-btn"
                                onClick={handleCloseManualEntry}
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddManualEntry}>
                            <div className="modal-body">
                                {formErrors.submit && (
            <div className="alert alert-error">
                {formErrors.submit}
            </div>
        )}
                                <div className="form-group">
                                    <label>Task *</label>
                                    <select
                                        value={manualEntry.taskId}
                                        onChange={(e) => setManualEntry({...manualEntry, taskId: e.target.value})}
                                        required
                                         disabled={isSubmitting}
                                    >
                                        <option value="">Select Task</option>
                                        {tasks.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.title} ({task.project_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={manualEntry.description}
                                        onChange={(e) => setManualEntry({...manualEntry, description: e.target.value})}
                                        placeholder="What did you work on?"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time *</label>
                                        <input
                                            type="datetime-local"
                                             className={formErrors.startTime ? 'error' : ''}
                                              max={new Date().toISOString().slice(0, 16)}
                                            value={manualEntry.startTime}
                                            onChange={(e) => {
    setManualEntry({...manualEntry, startTime: e.target.value});
    if (formErrors.startTime) {
        setFormErrors(prev => ({ ...prev, startTime: '' }));
    }
}}
                                            required
                                            disabled={isSubmitting}
                                        />
                                         {formErrors.startTime && (
        <div className="error-message">{formErrors.startTime}</div>
    )}
                                    </div>
                                    <div className="form-group">
                                        <label>End Time *</label>
                                        <input
                                            type="datetime-local"
                                             className={formErrors.endTime ? 'error' : ''}
                                             min={manualEntry.startTime || new Date().toISOString().slice(0, 16)}
                                              max={new Date().toISOString().slice(0, 16)}
                                            value={manualEntry.endTime}
                                            onChange={(e) => {
    setManualEntry({...manualEntry, endTime: e.target.value});
    if (formErrors.endTime) {
        setFormErrors(prev => ({ ...prev, endTime: '' }));
    }
}}
                                            required
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.endTime && (
        <div className="error-message">{formErrors.endTime}</div>
    )}
                                    </div>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        id="isBillable"
                                        checked={manualEntry.isBillable}
                                        onChange={(e) => setManualEntry({...manualEntry, isBillable: e.target.checked})}
                                        disabled={isSubmitting}
                                    />
                                    <label htmlFor="isBillable">Billable</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseManualEntry}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                     {isSubmitting ? 'Adding...' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTracking;