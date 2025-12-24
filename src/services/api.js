const API_BASE_URL = 'https://tenant-project-backend.vercel.app';

class AuthService {
    // Store tokens in localStorage
    static setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    static getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    static getRefreshToken() {
        return localStorage.getItem('refreshToken');
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

    // API calls
    static async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    }

    static async login(credentials) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        return response.json();
    }

    static async logout() {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify({ refreshToken })
            });
        }
        this.clearTokens();
    }

    static async getProfile() {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${this.getAccessToken()}`
            }
        });
        return response.json();
    }

    static async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return null;

        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            this.setTokens(data.accessToken, refreshToken);
            return data.accessToken;
        }
        return null;
    }

    // Check if user is authenticated
    static isAuthenticated() {
        return !!this.getAccessToken();
    }

    // Get auth headers for API calls
    static getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json'
        };
    }
}

export default AuthService;