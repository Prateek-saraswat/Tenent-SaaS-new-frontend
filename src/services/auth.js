// services/api.js
const API_BASE_URL =  'https://tenant-project-backend-production-2a83.up.railway.app/api';

class ApiService {
    // Auth methods
    static async register(userData) {
        return this.apiCall('/auth/register', 'POST', userData);
    }

    static async login(credentials) {
        return this.apiCall('/auth/login', 'POST', credentials);
    }

    static async logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            return this.apiCall('/auth/logout', 'POST', { refreshToken });
        }
    }

    static async downgrade(planId = 'free') {
  return this.apiCall('/billing/downgrade', 'POST', { planId });
}

    static async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                return data.accessToken;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    static async getProfile() {
        return this.apiCall('/auth/me', 'GET');
    }

    static async getUserProfile(userId = null) {
    if (userId) {
        return this.apiCall(`/users/${userId}`, 'GET');
    }
    return this.apiCall('/auth/me', 'GET');
}

static async updateUserProfile(userId, data) {
    return this.apiCall(`/users/${userId}`, 'PUT', data);
}

static async changePassword(currentPassword, newPassword) {
    return this.apiCall('/auth/change-password', 'POST', {
        currentPassword,
        newPassword
    });
}

    // Tenant/Organization methods
    static async getCurrentTenant() {
        return this.apiCall('/tenants/current', 'GET');
    }

    static async updateTenant(data) {
        return this.apiCall('/tenants', 'PUT', data);
    }

    static async getTenantUsage() {
        return this.apiCall('/tenants/usage', 'GET');
    }

    static async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.apiCall(`/tenants/audit-logs${query ? `?${query}` : ''}`, 'GET');
    }

    // User management
    static async getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.apiCall(`/users${query ? `?${query}` : ''}`, 'GET');
    }

    static async inviteUser(data) {
        return this.apiCall('/users/invite', 'POST', data);
    }

    static async updateUserRole(userId, roleId) {
        return this.apiCall(`/users/${userId}/role`, 'PUT', { roleId });
    }

    static async updateUserStatus(userId, status) {
        return this.apiCall(`/users/${userId}/status`, 'PUT', { status });
    }

    static async deleteUser(userId) {
        return this.apiCall(`/users/${userId}`, 'DELETE');
    }

    // Roles & Permissions
    static async getRoles() {
        return this.apiCall('/roles', 'GET');
    }

    static async createRole(data) {
        return this.apiCall('/roles', 'POST', data);
    }

    static async updateRole(roleId, data) {
        return this.apiCall(`/roles/${roleId}`, 'PUT', data);
    }

    static async getPermissions() {
        return this.apiCall('/permissions', 'GET');
    }

    // Projects
    static async createProject(data) {
        return this.apiCall('/projects', 'POST', data);
    }

    static async getProjects(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.apiCall(`/projects${query ? `?${query}` : ''}`, 'GET');
    }

    static async getProject(id) {
        return this.apiCall(`/projects/${id}`, 'GET');
    }

    static async updateProject(id, data) {
        return this.apiCall(`/projects/${id}`, 'PUT', data);
    }

    static async archiveProject(id) {
        return this.apiCall(`/projects/${id}/archive`, 'POST');
    }

    static async addProjectMember(projectId, userId, role = 'member') {
        return this.apiCall(`/projects/${projectId}/members`, 'POST', { userId, role });
    }

    static async removeProjectMember(projectId, userId) {
        return this.apiCall(`/projects/${projectId}/members/${userId}`, 'DELETE');
    }

    // Tasks
    static async createTask(data) {
        return this.apiCall('/tasks', 'POST', data);
    }

    static async getTasks(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.apiCall(`/tasks${query ? `?${query}` : ''}`, 'GET');
    }

    static async getTask(id) {
        return this.apiCall(`/tasks/${id}`, 'GET');
    }

    static async updateTask(id, data) {
        return this.apiCall(`/tasks/${id}`, 'PUT', data);
    }

    static async deleteTask(id) {
        return this.apiCall(`/tasks/${id}`, 'DELETE');
    }

    static async assignTask(taskId, userIds) {
        return this.apiCall(`/tasks/${taskId}/assign`, 'POST', { userIds });
    }

    static async addTaskComment(taskId, comment, mentionedUsers = []) {
        return this.apiCall(`/tasks/${taskId}/comments`, 'POST', { comment, mentionedUsers });
    }

    static async getTaskComments(taskId) {
        return this.apiCall(`/tasks/${taskId}/comments`, 'GET');
    }

    static async addTaskDependency(taskId, dependsOnTaskId, dependencyType = 'finish_to_start') {
        return this.apiCall(`/tasks/${taskId}/dependencies`, 'POST', { dependsOnTaskId, dependencyType });
    }

    static async bulkUpdateTasks(taskIds, updates) {
        return this.apiCall('/tasks/bulk-update', 'POST', { taskIds, updates });
    }

    // Time Tracking
    static async startTimer(taskId, description = '') {
        return this.apiCall('/time/start', 'POST', { taskId, description });
    }

    static async stopTimer() {
        return this.apiCall('/time/stop', 'POST');
    }

    static async addManualTimeEntry(data) {
        return this.apiCall('/time/manual', 'POST', data);
    }

    static async getDailyTime(date) {
        const query = date ? `?date=${date}` : '';
        return this.apiCall(`/time/daily${query}`, 'GET');
    }

    static async getWeeklyTime(startDate, endDate) {
        const query = `?startDate=${startDate}&endDate=${endDate}`;
        return this.apiCall(`/time/weekly${query}`, 'GET');
    }

    static async submitTimesheet(entryIds) {
        return this.apiCall('/time/submit', 'POST', { entryIds });
    }

    static async approveTimesheet(entryIds) {
        return this.apiCall('/time/approve', 'POST', { entryIds });
    }

    // Billing
    static async getPlans() {
        return this.apiCall('/billing/plans', 'GET');
    }

    static async subscribe(planId, billingCycle = 'monthly') {
        return this.apiCall('/billing/subscribe', 'POST', { planId, billingCycle });
    }

    static async getInvoices() {
        return this.apiCall('/billing/invoices', 'GET');
    }

    static async getUsage() {
        return this.apiCall('/billing/usage', 'GET');
    }

    // Notifications
    static async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.apiCall(`/notifications${query ? `?${query}` : ''}`, 'GET');
    }

    static async markNotificationsAsRead(notificationIds) {
        return this.apiCall('/notifications/read', 'POST', { notificationIds });
    }

    static async getUnreadCount() {
        return this.apiCall('/notifications/unread-count', 'GET');
    }

    // Helper method for API calls
    static async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add request body for POST/PUT
        if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Handle token expiration
            if (response.status === 401) {
                const newToken = await this.refreshToken();
                if (newToken) {
                    options.headers['Authorization'] = `Bearer ${newToken}`;
                    const retryResponse = await fetch(url, options);
                    return await retryResponse.json();
                } else {
                    localStorage.clear();
                    window.location.href = '/login';
                    throw new Error('Session expired');
                }
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Token management
    static setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    static getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    static clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return !!this.getAccessToken();
    }
}

export default ApiService;