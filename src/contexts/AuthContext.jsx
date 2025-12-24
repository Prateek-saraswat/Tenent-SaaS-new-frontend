import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = AuthService.getAccessToken();
                if (token) {
                    // Try to fetch user profile
                    const profile = await AuthService.getProfile();
                    if (profile && !profile.error) {
                        setUser(profile);
                    } else {
                        // Token might be expired, try to refresh
                        const newToken = await AuthService.refreshToken();
                        if (newToken) {
                            const retryProfile = await AuthService.getProfile();
                            if (retryProfile && !retryProfile.error) {
                                setUser(retryProfile);
                            } else {
                                await logout();
                            }
                        } else {
                            await logout();
                        }
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
                await logout();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        setLoading(true);
        setError(null);
        try {
            const response = await AuthService.login({
                email,
                password,
                rememberMe
            });

            if (response.error) {
                throw new Error(response.error);
            }

            if (response.accessToken && response.refreshToken) {
                AuthService.setTokens(response.accessToken, response.refreshToken);
                setUser(response.user);
                return { success: true };
            }

            throw new Error('Login failed');
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await AuthService.register(userData);

            if (response.error) {
                throw new Error(response.error);
            }

            if (response.accessToken && response.refreshToken) {
                AuthService.setTokens(response.accessToken, response.refreshToken);
                setUser(response.user);
                return { success: true };
            }

            throw new Error('Registration failed');
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AuthService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            AuthService.clearTokens();
            setUser(null);
            setError(null);
            navigate('/login');
        }
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
        AuthService.setUser({ ...user, ...userData });
    };

    const refreshUser = async () => {
        try {
            const profile = await AuthService.getProfile();
            if (profile && !profile.error) {
                setUser(profile);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Refresh user error:', err);
            return false;
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        clearError,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};