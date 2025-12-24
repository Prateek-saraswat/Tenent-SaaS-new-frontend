import React, { useState, useEffect } from 'react';
import ApiService from '../../services/auth.js';
import './Reports.css';

const Reports = ({ user, tenant, usage }) => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportType, setReportType] = useState('overview');
    const [reportData, setReportData] = useState({
        projectStats: [],
        timeStats: [],
        teamStats: [],
        taskStats: []
    });

    useEffect(() => {
        loadReportData();
    }, [dateRange, reportType]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            
            // Load projects for project stats
            const projects = await ApiService.getProjects({ status: 'active' });
            
            // Load time entries for time stats
            const timeEntries = await ApiService.getWeeklyTime(dateRange.start, dateRange.end);
            
            // Load team members for team stats
            const team = await ApiService.getUsers({ status: 'active' });
            
            // Load tasks for task stats
            const tasks = await ApiService.getTasks({ limit: 100 });

            // Process data for reports
            const projectStats = processProjectStats(projects);
            const timeStats = processTimeStats(timeEntries);
            const teamStats = processTeamStats(team?.users || [], timeEntries);
            const taskStats = processTaskStats(tasks);

            setReportData({
                projectStats,
                timeStats,
                teamStats,
                taskStats
            });

        } catch (error) {
            console.error('Failed to load report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processProjectStats = (projects) => {
        if (!Array.isArray(projects)) return [];
        
        return projects.map(project => ({
            id: project.id,
            name: project.name,
            totalTasks: project.task_count || 0,
            completedTasks: 0, // You'd need to fetch completed tasks per project
            progress: Math.floor(Math.random() * 100), // Mock data
            hoursSpent: Math.floor(Math.random() * 200),
            budget: project.budget || 0,
            spent: Math.floor(Math.random() * (project.budget || 1000))
        }));
    };

    const processTimeStats = (timeEntries) => {
        if (!Array.isArray(timeEntries)) return [];
        
        // Group by date
        const dailyStats = {};
        timeEntries.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    totalHours: 0,
                    billableHours: 0,
                    nonBillableHours: 0
                };
            }
            const hours = (entry.total_minutes || 0) / 60;
            dailyStats[date].totalHours += hours;
            if (entry.is_billable) {
                dailyStats[date].billableHours += hours;
            } else {
                dailyStats[date].nonBillableHours += hours;
            }
        });

        return Object.values(dailyStats);
    };

    const processTeamStats = (teamMembers, timeEntries) => {
        if (!Array.isArray(teamMembers) || !Array.isArray(timeEntries)) return [];
        
        return teamMembers.map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            totalHours: Math.floor(Math.random() * 160), // Mock data
            completedTasks: Math.floor(Math.random() * 50),
            efficiency: Math.floor(Math.random() * 100),
            role: member.roles?.[0]?.name || 'Member'
        }));
    };

    const processTaskStats = (tasks) => {
        if (!Array.isArray(tasks)) return [];
        
        const statusCounts = {
            todo: 0,
            in_progress: 0,
            review: 0,
            completed: 0
        };
        
        const priorityCounts = {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
        };
        
        tasks.forEach(task => {
            statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
            priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
        });

        return {
            statusCounts,
            priorityCounts,
            totalTasks: tasks.length,
            completedTasks: statusCounts.completed || 0,
            completionRate: tasks.length > 0 ? Math.round((statusCounts.completed / tasks.length) * 100) : 0
        };
    };

    const exportReport = (format) => {
        const data = {
            dateRange,
            reportType,
            generatedAt: new Date().toISOString(),
            organization: tenant?.name,
            data: reportData
        };

        let content, mimeType, filename;

        switch(format) {
            case 'csv':
                content = convertToCSV(data);
                mimeType = 'text/csv';
                filename = `report-${dateRange.start}-to-${dateRange.end}.csv`;
                break;
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                filename = `report-${dateRange.start}-to-${dateRange.end}.json`;
                break;
            case 'pdf':
                // For PDF, you would typically use a library like jsPDF
                alert('PDF export requires additional setup with jsPDF library');
                return;
            default:
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const convertToCSV = (data) => {
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Report Period', `${data.dateRange.start} to ${data.dateRange.end}`],
            ['Organization', data.organization],
            ['Generated At', data.generatedAt],
            ['Total Projects', data.data.projectStats.length],
            ['Total Team Members', data.data.teamStats.length],
            ['Total Tasks', data.data.taskStats.totalTasks],
            ['Completion Rate', `${data.data.taskStats.completionRate}%`]
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const renderOverview = () => (
        <div className="report-overview">
            <div className="overview-stats">
                <div className="stat-card">
                    <h3>Projects</h3>
                    <p className="stat-number">{reportData.projectStats.length}</p>
                    <div className="stat-trend">Active</div>
                </div>
                <div className="stat-card">
                    <h3>Team Members</h3>
                    <p className="stat-number">{reportData.teamStats.length}</p>
                    <div className="stat-trend">Active</div>
                </div>
                <div className="stat-card">
                    <h3>Total Tasks</h3>
                    <p className="stat-number">{reportData.taskStats.totalTasks || 0}</p>
                    <div className="stat-trend">{reportData.taskStats.completionRate || 0}% Completed</div>
                </div>
                <div className="stat-card">
                    <h3>Hours Tracked</h3>
                    <p className="stat-number">
                        {reportData.timeStats.reduce((sum, day) => sum + day.totalHours, 0).toFixed(1)}
                    </p>
                    <div className="stat-trend">In selected period</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h4>Task Status Distribution</h4>
                    <div className="status-chart">
                        {Object.entries(reportData.taskStats.statusCounts || {}).map(([status, count]) => (
                            <div key={status} className="status-bar">
                                <div className="status-label">
                                    <span>{status.replace('_', ' ').toUpperCase()}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="status-progress">
                                    <div 
                                        className="progress-bar"
                                        style={{
                                            width: `${(count / reportData.taskStats.totalTasks) * 100 || 0}%`,
                                            background: getStatusColor(status)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card">
                    <h4>Task Priority Distribution</h4>
                    <div className="priority-chart">
                        {Object.entries(reportData.taskStats.priorityCounts || {}).map(([priority, count]) => (
                            <div key={priority} className="priority-item">
                                <span className="priority-label">{priority.toUpperCase()}</span>
                                <span className="priority-count">{count}</span>
                                <div className="priority-progress">
                                    <div 
                                        className="progress-bar"
                                        style={{
                                            width: `${(count / reportData.taskStats.totalTasks) * 100 || 0}%`,
                                            background: getPriorityColor(priority)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h4>Project Progress</h4>
                    <div className="project-progress">
                        {reportData.projectStats.slice(0, 5).map(project => (
                            <div key={project.id} className="project-progress-item">
                                <div className="project-info">
                                    <span className="project-name">{project.name}</span>
                                    <span className="project-progress-value">{project.progress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                                <div className="project-meta">
                                    <span>Tasks: {project.totalTasks}</span>
                                    <span>Hours: {project.hoursSpent}</span>
                                    <span>Budget: ${project.spent}/${project.budget}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTeamPerformance = () => (
        <div className="team-performance">
            <div className="performance-table">
                <table>
                    <thead>
                        <tr>
                            <th>Team Member</th>
                            <th>Role</th>
                            <th>Hours Tracked</th>
                            <th>Tasks Completed</th>
                            <th>Efficiency</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.teamStats.map(member => (
                            <tr key={member.id}>
                                <td>
                                    <div className="member-info">
                                        <div className="member-avatar">
                                            {member.name.charAt(0)}
                                        </div>
                                        <span>{member.name}</span>
                                    </div>
                                </td>
                                <td>{member.role}</td>
                                <td>{member.totalHours}h</td>
                                <td>{member.completedTasks}</td>
                                <td>
                                    <div className="efficiency-bar">
                                        <div 
                                            className="efficiency-fill"
                                            style={{ width: `${member.efficiency}%` }}
                                        ></div>
                                        <span>{member.efficiency}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTimeAnalysis = () => (
        <div className="time-analysis">
            <div className="time-stats">
                <div className="time-stat-card">
                    <h4>Total Hours</h4>
                    <p className="time-stat-number">
                        {reportData.timeStats.reduce((sum, day) => sum + day.totalHours, 0).toFixed(1)}
                    </p>
                </div>
                <div className="time-stat-card">
                    <h4>Billable Hours</h4>
                    <p className="time-stat-number">
                        {reportData.timeStats.reduce((sum, day) => sum + day.billableHours, 0).toFixed(1)}
                    </p>
                </div>
                <div className="time-stat-card">
                    <h4>Average Daily</h4>
                    <p className="time-stat-number">
                        {reportData.timeStats.length > 0 
                            ? (reportData.timeStats.reduce((sum, day) => sum + day.totalHours, 0) / reportData.timeStats.length).toFixed(1)
                            : '0.0'
                        }
                    </p>
                </div>
            </div>

            <div className="time-chart">
                <h4>Daily Time Tracking</h4>
                <div className="chart-bars">
                    {reportData.timeStats.map((day, index) => {
                        const maxHours = Math.max(...reportData.timeStats.map(d => d.totalHours), 1);
                        const height = (day.totalHours / maxHours) * 150;
                        return (
                            <div key={index} className="chart-bar">
                                <div className="bar-tooltip">
                                    <p>Date: {day.date}</p>
                                    <p>Total: {day.totalHours.toFixed(1)}h</p>
                                    <p>Billable: {day.billableHours.toFixed(1)}h</p>
                                </div>
                                <div 
                                    className="bar-fill total"
                                    style={{ height: `${height}px` }}
                                ></div>
                                <div 
                                    className="bar-fill billable"
                                    style={{ 
                                        height: `${(day.billableHours / day.totalHours) * height || 0}px`,
                                        bottom: 0
                                    }}
                                ></div>
                                <div className="bar-label">{day.date.split('/')[1]}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'todo': return '#6B7280';
            case 'in_progress': return '#3B82F6';
            case 'review': return '#8B5CF6';
            case 'completed': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'low': return '#6B7280';
            case 'medium': return '#3B82F6';
            case 'high': return '#F59E0B';
            case 'urgent': return '#EF4444';
            default: return '#6B7280';
        }
    };

    if (loading) {
        return (
            <div className="reports-loading">
                <div className="spinner"></div>
                <p>Generating reports...</p>
            </div>
        );
    }

    return (
        <div className="reports-container">
            {/* Reports header */}
            <div className="reports-header">
                <div className="header-left">
                    <h1>Reports & Analytics</h1>
                    <p>Gain insights into your organization's performance</p>
                </div>
                <div className="header-right">
                    <div className="report-controls">
                        <div className="date-range">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                        <div className="export-buttons">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportReport('csv')}
                            >
                                Export CSV
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportReport('json')}
                            >
                                Export JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="report-tabs">
                <button 
                    className={`tab-btn ${reportType === 'overview' ? 'active' : ''}`}
                    onClick={() => setReportType('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab-btn ${reportType === 'team' ? 'active' : ''}`}
                    onClick={() => setReportType('team')}
                >
                    Team Performance
                </button>
                <button 
                    className={`tab-btn ${reportType === 'time' ? 'active' : ''}`}
                    onClick={() => setReportType('time')}
                >
                    Time Analysis
                </button>
                <button 
                    className={`tab-btn ${reportType === 'projects' ? 'active' : ''}`}
                    onClick={() => setReportType('projects')}
                >
                    Project Analysis
                </button>
            </div>

            {/* Report Content */}
            <div className="report-content">
                {reportType === 'overview' && renderOverview()}
                {reportType === 'team' && renderTeamPerformance()}
                {reportType === 'time' && renderTimeAnalysis()}
                {reportType === 'projects' && renderOverview()} {/* You can create a separate project analysis view */}
            </div>

            {/* Report Summary */}
            <div className="report-summary">
                <div className="summary-card">
                    <h3>Report Summary</h3>
                    <div className="summary-content">
                        <p><strong>Period:</strong> {dateRange.start} to {dateRange.end}</p>
                        <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                        <p><strong>Organization:</strong> {tenant?.name}</p>
                        <p><strong>Report Type:</strong> {reportType.replace('_', ' ').toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;