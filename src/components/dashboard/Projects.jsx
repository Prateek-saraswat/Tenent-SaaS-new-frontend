// components/dashboard/Projects.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/auth.js';
import './Projects.css';

const Projects = ({ user, tenant }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
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
        loadProjects();
    }, [statusFilter, searchTerm]);

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
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.createProject(projectForm);
            if (response && response.projectId) {
                setShowCreateModal(false);
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
        }
    };

    const handleArchiveProject = async () => {
        if (!selectedProject) return;
        
        try {
            await ApiService.archiveProject(selectedProject.id);
            setShowArchiveModal(false);
            setSelectedProject(null);
            loadProjects();
        } catch (error) {
            console.error('Failed to archive project:', error);
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
                        onClick={() => setShowCreateModal(true)}
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
                                        onClick={() => navigate(`/dashboard/projects/${project.id}`)}
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
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create New Project</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject}>
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
                                            value={projectForm.startDate}
                                            onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            value={projectForm.endDate}
                                            onChange={(e) => setProjectForm({...projectForm, endDate: e.target.value})}
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
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Archive Project Modal */}
            {showArchiveModal && selectedProject && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Archive Project</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowArchiveModal(false)}
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
                                onClick={() => setShowArchiveModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-warning"
                                onClick={handleArchiveProject}
                            >
                                Archive Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;