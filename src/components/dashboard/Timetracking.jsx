// components/dashboard/TimeTracking.js
import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import './TimeTracking.css';

const TimeTracking = ({ user, tenant }) => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState([]);
    
    const [manualEntry, setManualEntry] = useState({
        taskId: '',
        startTime: '',
        endTime: '',
        description: '',
        isBillable: true
    });

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

        } catch (error) {
            console.error('Failed to load time data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTimer = async (taskId) => {
        try {
            const response = await ApiService.startTimer(taskId);
            if (response && response.entryId) {
                loadTimeData(); // Reload data
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
        }
    };

    const handleStopTimer = async () => {
        try {
            await ApiService.stopTimer();
            setActiveTimer(null);
            loadTimeData(); // Reload data
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    };

    const handleAddManualEntry = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.addManualTimeEntry(manualEntry);
            if (response && response.entryId) {
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
        }
    };

    const handleSubmitTimesheet = async () => {
        const entryIds = timeEntries
            .filter(e => e.status === 'draft')
            .map(e => e.id);
        
        if (entryIds.length === 0) return;
        
        try {
            await ApiService.submitTimesheet(entryIds);
            loadTimeData(); // Reload data
        } catch (error) {
            console.error('Failed to submit timesheet:', error);
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
                        onClick={() => setShowManualEntry(true)}
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
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add Manual Time Entry</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowManualEntry(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddManualEntry}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Task *</label>
                                    <select
                                        value={manualEntry.taskId}
                                        onChange={(e) => setManualEntry({...manualEntry, taskId: e.target.value})}
                                        required
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
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time *</label>
                                        <input
                                            type="datetime-local"
                                            value={manualEntry.startTime}
                                            onChange={(e) => setManualEntry({...manualEntry, startTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time *</label>
                                        <input
                                            type="datetime-local"
                                            value={manualEntry.endTime}
                                            onChange={(e) => setManualEntry({...manualEntry, endTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        id="isBillable"
                                        checked={manualEntry.isBillable}
                                        onChange={(e) => setManualEntry({...manualEntry, isBillable: e.target.checked})}
                                    />
                                    <label htmlFor="isBillable">Billable</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowManualEntry(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Add Entry
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