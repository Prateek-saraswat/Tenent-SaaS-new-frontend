// components/dashboard/Projects.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './Projects.css';

const Projects = ({ user, tenant }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false); // 1. change p
    const [formErrors, setFormErrors] = useState({}); //2.change
    const [archiveLoading, setArchiveLoading] = useState(false); 
    const [showProjectDetails, setShowProjectDetails] = useState(false);
const [projectDetails, setProjectDetails] = useState(null);
const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);
const projectDetailsModalRef = useRef(null);
      const createModalRef = useRef(null);
    const archiveModalRef = useRef(null);
    
    // Form state

    const navigate = useNavigate()
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
        code: '',
        startDate: '',
        endDate: '',
        budget: '',
        color: '#3B82F6'
    });
    useEffect(() => {
    const handleClickOutside = (event) => {
        // For create modal
        if (showCreateModal && 
            createModalRef.current && 
            !createModalRef.current.contains(event.target) &&
            !isSubmitting
        ) {
            resetCreateProjectModal();
        }
        
        // For archive modal
        if (showArchiveModal && 
            archiveModalRef.current && 
            !archiveModalRef.current.contains(event.target) &&
            !archiveLoading
        ) {
            resetArchiveProjectModal();
        }
        
        // Add this for project details modal
        if (showProjectDetails && 
            projectDetailsModalRef.current && 
            !projectDetailsModalRef.current.contains(event.target)
        ) {
            resetProjectDetailsModal();
        }
    };

    if (showCreateModal || showArchiveModal || showProjectDetails) {
        document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [showCreateModal, showArchiveModal, showProjectDetails, isSubmitting, archiveLoading]);
    useEffect(() => {
        loadProjects();
    }, [statusFilter, searchTerm]);

    const resetCreateProjectModal = () => {
    setShowCreateModal(false);
    setIsSubmitting(false);
    setFormErrors({});
    setProjectForm({
        name: '',
        description: '',
        code: '',
        startDate: '',
        endDate: '',
        budget: '',
        color: '#3B82F6'
    });
};
const resetProjectDetailsModal = () => {
    setShowProjectDetails(false);
    setProjectDetails(null);
    setProjectDetailsLoading(false);
};

const resetArchiveProjectModal = () => {
    setShowArchiveModal(false);
    setSelectedProject(null);
    setArchiveLoading(false);
};

// Add this function after other handler functions
const handleViewProjectDetails = async (projectId) => {
    try {
        setProjectDetailsLoading(true);
        // Fetch project details from API
        const data = await ApiService.getProject(projectId);
        setProjectDetails(data);
        setShowProjectDetails(true);
        toast.success('Project details loaded!');
    } catch (error) {
        console.error('Failed to load project details:', error);
        toast.error(error.message || 'Failed to load project details');
    } finally {
        setProjectDetailsLoading(false);
    }
};

    const loadProjects = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;
            
            const data = await ApiService.getProjects(params);
            if (Array.isArray(data)) {
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const validateDates = (start, end) => {
    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (endDate < startDate) {
            return "End date cannot be before start date";
        }
    }
    return "";
};
const validateYear = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    
    if (year < 2000 || year > currentYear + 5) {
        return `Year must be between 2000 and ${currentYear + 5}`;
    }
    
    return "";
};

    const handleCreateProject = async (e) => {
        const dateError = validateDates(projectForm.startDate, projectForm.endDate);
if (dateError) {
    setFormErrors({ ...formErrors, date: dateError });
    setIsSubmitting(false);
    toast.error(dateError);
    return;
}
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
      // Validate dates
    // const dateError = validateDates(projectForm.startDate, projectForm.endDate);
    if (dateError) {
        setFormErrors({ ...formErrors, date: dateError });
        setIsSubmitting(false);
        toast.error(dateError);
        return;
    }
    
    // Validate years
    const startYearError = validateYear(projectForm.startDate);
    const endYearError = validateYear(projectForm.endDate);
    
    if (startYearError || endYearError) {
        setFormErrors({ 
            ...formErrors, 
            startYear: startYearError,
            endYear: endYearError 
        });
        setIsSubmitting(false);
        toast.error(startYearError || endYearError);
        return;
    }
    
    try {
        const response = await ApiService.createProject(projectForm);
        if (response && response.projectId) {
            toast.success('Project created successfully!');
            resetCreateProjectModal();
            setProjectForm({
                name: '',
                description: '',
                code: '',
                startDate: '',
                endDate: '',
                budget: '',
                color: '#3B82F6'
            });
            loadProjects();
        }
    } catch (error) {
        console.error('Failed to create project:', error);
        toast.error(error.message || 'Failed to create project');
    } finally {
        setIsSubmitting(false);
    }
};

    const handleArchiveProject = async () => {
        if (!selectedProject) return;
         setArchiveLoading(true)
        
        try {
            await ApiService.archiveProject(selectedProject.id);
             toast.success(`"${selectedProject.name}" has been archived successfully!`);

            resetArchiveProjectModal(); 
            loadProjects();
        } catch (error) {
            console.error('Failed to archive project:', error);
            toast.error(error.message || 'Failed to archive project'); 
        }finally{
             setArchiveLoading(false); 
        }
    };

    const handleAddMember = async (projectId, userId) => {
        try {
            await ApiService.addProjectMember(projectId, userId);
            loadProjects();
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    };

    const handleRemoveMember = async (projectId, userId) => {
        try {
            await ApiService.removeProjectMember(projectId, userId);
            loadProjects();
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    return (
        <div className="projects-container">
            {/* Projects header with filters and create button */}
            <div className="projects-header">
                <div className="header-left">
                    <h1>Projects</h1>
                    <p>Manage and organize your projects</p>
                </div>
                <div className="header-right">
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter"
                        >
                            <option value="all">All Projects</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setProjectForm({
            name: '',
            description: '',
            code: '',
            startDate: '',
            endDate: '',
            budget: '',
            color: '#3B82F6'
        });
        setFormErrors({});
                            setShowCreateModal(true)
                        }}
                    >
                        + New Project
                    </button>
                </div>
            </div>

            {/* Projects grid/list */}
            <div className="projects-grid">
                {loading ? (
                    <div className="loading">Loading projects...</div>
                ) : projects.length > 0 ? (
                    projects.map(project => (
                        <div key={project.id} className="project-card">
                            <div 
                                className="project-color" 
                                style={{ backgroundColor: project.color }}
                            ></div>
                            <div className="project-content">
                                <div className="project-header">
                                    <h3>{project.name}</h3>
                                    <span className={`project-status ${project.status}`}>
                                        {project.status}
                                    </span>
                                </div>
                                {project.description && (
                                    <p className="project-description">{project.description}</p>
                                )}
                                {project.code && (
                                    <p className="project-code">Code: {project.code}</p>
                                )}
                                
                                <div className="project-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Tasks:</span>
                                        <span className="meta-value">{project.task_count || 0}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Members:</span>
                                        <span className="meta-value">{project.member_count || 0}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Hours:</span>
                                        <span className="meta-value">{project.total_hours || 0}</span>
                                    </div>
                                </div>

                                <div className="project-actions">
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() =>{
                                             handleViewProjectDetails(project.id)
                                        // navigate(`/dashboard/projects/${project.id}`)
                                         toast(`Opening "${project.name}"...`, { // ADD THIS
            icon: '🔍',
            duration: 1000
        });
                                        }}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                       onClick={() => {
        setSelectedProject(project);
        setShowArchiveModal(true);
    }}
                                    >
                                        Archive
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-projects">
                        <p>No projects found. Create your first project!</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => {
    if (e.target.className === 'modal-overlay' && !isSubmitting) {
        resetCreateProjectModal();  // Add this
    }
}}>
                    <div className="modal" ref={createModalRef}>
                        <div className="modal-header">
                            <h3>Create New Project</h3>
                            <button 
                                className="close-btn"
                                onClick={resetCreateProjectModal}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} onKeyDown={(e) => {
    if (e.key === 'Enter') e.preventDefault(); //1.change Prevent enter key from submitting multiple times
}}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Project Name *</label>
                                    <input
                                        type="text"
                                        value={projectForm.name}
                                        onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={projectForm.description}
                                        onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Project Code</label>
                                        <input
                                            type="text"
                                            value={projectForm.code}
                                            onChange={(e) => setProjectForm({...projectForm, code: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={projectForm.color}
                                            onChange={(e) => setProjectForm({...projectForm, color: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            className={formErrors.date ? 'error' : ''}
                                            min="2000-01-01"
                                             max={new Date().getFullYear() + 5 + "-12-31"}
                                            value={projectForm.startDate}
                                            onChange={(e) => {
                                               setFormErrors({...formErrors, date: '', startYear: ''});
            setProjectForm({...projectForm, startDate: e.target.value})
                                            }}
                                             onKeyDown={(e) => e.preventDefault()}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                        min={projectForm.startDate || "2000-01-01"}
                                         max={new Date().getFullYear() + 5 + "-12-31"}
                                        className={formErrors.date ? 'error' : ''}
                                            type="date"
                                             onKeyDown={(e) => e.preventDefault()}
                                            value={projectForm.endDate}
                                            onChange={(e) => {
            setFormErrors({...formErrors, date: '', endYear: ''});
            setProjectForm({...projectForm, endDate: e.target.value});
            
        }
                                                
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Budget ($)</label>
                                    <input
                                        type="number"

                                        value={projectForm.budget}
                                        onChange={(e) => setProjectForm({...projectForm, budget: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetCreateProjectModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting || formErrors.date}

                                >
                                   {isSubmitting ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Archive Project Modal */}
            {showArchiveModal && selectedProject && (
                <div className="modal-overlay" onClick={(e) => {
    if (e.target.className === 'modal-overlay' && !archiveLoading) {
        resetArchiveProjectModal();  // Add this
    }
}}>
                    <div className="modal"   ref={archiveModalRef}>
                        <div className="modal-header">
                            <h3>Archive Project</h3>
                            <button 
                                className="close-btn"
                                onClick={resetArchiveProjectModal}
                                  disabled={archiveLoading}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to archive "{selectedProject.name}"?</p>
                            <p className="warning">Archived projects will be locked and cannot be edited.</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={resetArchiveProjectModal}
                                  disabled={archiveLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-warning"
                                onClick={handleArchiveProject}
                            >
                                 {archiveLoading ? 'Archiving...' : 'Archive Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Project Details Modal */}
{showProjectDetails && projectDetails && (
    <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay') {
            resetProjectDetailsModal();
        }
    }}>
        <div className="modal large" ref={projectDetailsModalRef}>
            <div className="modal-header">
                <h3>Project Details</h3>
                <button 
                    className="close-btn"
                    onClick={resetProjectDetailsModal}
                >
                    ×
                </button>
            </div>
            <div className="modal-body">
                {projectDetailsLoading ? (
                    <div className="loading">Loading project details...</div>
                ) : (
                    <div className="project-details-content">
                        <div className="project-details-header">
                            <div 
                                className="project-color-badge"
                                style={{ backgroundColor: projectDetails.color }}
                            ></div>
                            <h2>{projectDetails.name}</h2>
                            <span className={`project-status-badge ${projectDetails.status}`}>
                                {projectDetails.status}
                            </span>
                        </div>
                        
                        <div className="project-details-grid">
                            <div className="details-section">
                                <h4>Basic Information</h4>
                                <div className="details-row">
                                    <span className="label">Project Code:</span>
                                    <span className="value">{projectDetails.code || 'N/A'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="label">Description:</span>
                                    <span className="value">{projectDetails.description || 'No description'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="label">Budget:</span>
                                    <span className="value">
                                        {projectDetails.budget ? `$${projectDetails.budget}` : 'Not set'}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="label">Created:</span>
                                    <span className="value">
                                        {projectDetails.created_at ? new Date(projectDetails.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="details-section">
                                <h4>Timeline</h4>
                                <div className="details-row">
                                    <span className="label">Start Date:</span>
                                    <span className="value">
                                        {projectDetails.startDate ? new Date(projectDetails.startDate).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="label">End Date:</span>
                                    <span className="value">
                                        {projectDetails.endDate ? new Date(projectDetails.endDate).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="label">Duration:</span>
                                    <span className="value">
                                        {projectDetails.startDate && projectDetails.endDate 
                                            ? `${Math.ceil((new Date(projectDetails.endDate) - new Date(projectDetails.startDate)) / (1000 * 60 * 60 * 24))} days`
                                            : 'N/A'
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            <div className="details-section">
                                <h4>Statistics</h4>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Tasks:</span>
                                        <span className="stat-value">{projectDetails.task_count || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Completed:</span>
                                        <span className="stat-value">
                                            {projectDetails.completed_tasks || 0}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Team Members:</span>
                                        <span className="stat-value">
                                            {projectDetails.member_count || 0}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Hours Logged:</span>
                                        <span className="stat-value">
                                            {projectDetails.total_hours || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Add more sections as needed */}
                            <div className="details-section">
                                <h4>Team Members</h4>
                                {projectDetails.members && projectDetails.members.length > 0 ? (
                                    <div className="team-members-list">
                                        {projectDetails.members.map(member => (
                                            <div key={member.id} className="team-member">
                                                <div className="member-avatar">
                                                    {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-name">
                                                        {member.first_name} {member.last_name}
                                                    </span>
                                                    <span className="member-role">{member.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No team members assigned yet</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="project-actions-footer">
                            
                           
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default Projects;