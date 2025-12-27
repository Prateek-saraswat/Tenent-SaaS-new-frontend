import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const { login, error: authError, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Clear auth error when component mounts
    useEffect(() => {
           if (authError) {
        toast.error(authError, {
            duration: 4000,
            position: 'top-right'
        });
        clearError(); // Clear error after showing toast
    }
    }, [authError ,clearError]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            const firstErrorKey = Object.keys(validationErrors)[0];
        toast.error(validationErrors[firstErrorKey]);
            return;
        }

        clearError();

        const toastId = toast.loading('Signing in...'); 
        
        const result = await login(
            formData.email,
            formData.password,
            formData.rememberMe
        );

        if (result.success) {
            toast.success('✅ Login successful! Redirecting...', { id: toastId });
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
        else {
             toast.dismiss(toastId);
        }
        
        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="app-logo">
                        <span className="logo-icon">🚀</span>
                        <h1>ProjectFlow</h1>
                    </div>
                    <p className="login-subtitle">Sign in to your account</p>
                </div>

                {/* {authError && (
                    <div className="alert alert-error">
                        {authError}
                    </div>
                )} */}

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-control ${errors.email ? 'error' : ''}`}
                            placeholder="you@example.com"
                            disabled={isSubmitting}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <div className="error-message">{errors.email}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        {/* 🔹 PASSWORD + EYE WRAPPER */}
<div className="password-wrapper">

  {/* 🔹 type changed */}
  <input
    type={showPassword ? 'text' : 'password'} // 👈 CHANGE
    id="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    className={`form-control ${errors.password ? 'error' : ''}`}
    placeholder="••••••••"
    disabled={isSubmitting}
    autoComplete="current-password"
  />

  {/* 🔹 EYE TOGGLE BUTTON */}
  <button
    type="button" // 👈 IMPORTANT
    className="password-toggle"
    onClick={() => setShowPassword(prev => !prev)} // 👈 TOGGLE
    tabIndex={-1}
  >
    {showPassword ? '🙈' : '👁️'}
  </button>

</div>

                        {errors.password && (
                            <div className="error-message">{errors.password}</div>
                        )}
                    </div>

                    <div className="form-options">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="form-check-input"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="rememberMe" className="form-check-label">
                                Remember me
                            </label>
                        </div>

                        <Link to="/forgot-password" className="forgot-password">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-small"></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <div className="social-login">
                        <p className="social-login-text">Continue with</p>
                        <div className="social-buttons">
                            <button type="button" className="social-btn google">
                                <span className="social-icon">G</span>
                                Google
                            </button>
                            <button type="button" className="social-btn github">
                                <span className="social-icon">G</span>
                                GitHub
                            </button>
                        </div>
                    </div>
                </form>

                <div className="login-footer">
                    <p className="signup-text">
                        Don't have an account?{' '}
                        <Link to="/register" className="signup-link">
                            Sign up
                        </Link>
                    </p>
                    <p className="terms-text">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="terms-link">Terms</Link> and{' '}
                        <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;