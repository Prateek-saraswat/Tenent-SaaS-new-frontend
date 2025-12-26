import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast'; 
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
        agreeTerms: false,
        subscribe: true
    });
    
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, error: authError, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Clear auth error when component mounts
    useEffect(() => {
        if (authError) {
        toast.error(authError, {
            duration: 4000,
            position: 'top-right'
        });
        clearError();
    } else {
        clearError();
    }
    }, [authError ,clearError]);

    // Calculate password strength
    useEffect(() => {
        if (!formData.password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        if (formData.password.length >= 8) strength += 1;
        if (/[A-Z]/.test(formData.password)) strength += 1;
        if (/[a-z]/.test(formData.password)) strength += 1;
        if (/[0-9]/.test(formData.password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
        
        setPasswordStrength(strength);
    }, [formData.password]);

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
        
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.organizationName.trim()) {
            newErrors.organizationName = 'Organization name is required';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 3) {
            newErrors.password = 'Password is too weak';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!formData.agreeTerms) {
            newErrors.agreeTerms = 'You must agree to the terms and conditions';
        }
        
        return newErrors;
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return 'Very Weak';
        if (passwordStrength === 1) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        if (passwordStrength >= 4) return 'Strong';
        return '';
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 1) return '#ef4444';
        if (passwordStrength === 2) return '#f59e0b';
        if (passwordStrength === 3) return '#10b981';
        if (passwordStrength >= 4) return '#3b82f6';
        return '#d1d5db';
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
        const toastId = toast.loading('Creating your account...');
        
        try {

              const result = await register({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            organizationName: formData.organizationName
        });
        if (result.success) {
             toast.success('✅ Account created successfully! Welcome to ProjectFlow', { 
                id: toastId,
                duration: 3000
            });
            // Small delay to show success message
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1500);
        }else {
             toast.dismiss(toastId);
        }

        }catch (error){
 toast.dismiss(toastId);
        toast.error('An unexpected error occurred. Please try again.');
        }finally{

            setIsSubmitting(false);
        }
      
        
        
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <div className="app-logo">
                        <span className="logo-icon">🚀</span>
                        <h1>Join ProjectFlow</h1>
                    </div>
                    <p className="register-subtitle">
                        Start your 14-day free trial. No credit card required.
                    </p>
                </div>

                {/* {authError && (
                    <div className="alert alert-error">
                        {authError}
                    </div>
                )} */}

                <form onSubmit={handleSubmit} className="register-form" noValidate>
                    {/* Personal Information */}
                    <div className="form-section">
                        <h3 className="section-title">Personal Information</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`form-control ${errors.firstName ? 'error' : ''}`}
                                    placeholder="John"
                                    disabled={isSubmitting}
                                />
                                {errors.firstName && (
                                    <div className="error-message">{errors.firstName}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`form-control ${errors.lastName ? 'error' : ''}`}
                                    placeholder="Doe"
                                    disabled={isSubmitting}
                                />
                                {errors.lastName && (
                                    <div className="error-message">{errors.lastName}</div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-control ${errors.email ? 'error' : ''}`}
                                placeholder="john@example.com"
                                disabled={isSubmitting}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <div className="error-message">{errors.email}</div>
                            )}
                        </div>
                    </div>

                    {/* Organization Information */}
                    <div className="form-section">
                        <h3 className="section-title">Organization Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="organizationName" className="form-label">
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                id="organizationName"
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleChange}
                                className={`form-control ${errors.organizationName ? 'error' : ''}`}
                                placeholder="Acme Inc."
                                disabled={isSubmitting}
                            />
                            {errors.organizationName && (
                                <div className="error-message">{errors.organizationName}</div>
                            )}
                            <small className="form-hint">
                                This will be your team's workspace name
                            </small>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="form-section">
                        <h3 className="section-title">Set Password</h3>
                        
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`form-control ${errors.password ? 'error' : ''}`}
                                placeholder="••••••••"
                                disabled={isSubmitting}
                            />
                            {formData.password && (
                                <div className="password-strength">
                                    <div className="strength-meter">
                                        {[1, 2, 3, 4, 5].map((step) => (
                                            <div
                                                key={step}
                                                className="strength-segment"
                                                style={{
                                                    backgroundColor: passwordStrength >= step 
                                                        ? getPasswordStrengthColor() 
                                                        : '#e5e7eb'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span 
                                        className="strength-text"
                                        style={{ color: getPasswordStrengthColor() }}
                                    >
                                        {getPasswordStrengthText()}
                                    </span>
                                </div>
                            )}
                            {errors.password && (
                                <div className="error-message">{errors.password}</div>
                            )}
                            <small className="form-hint">
                                Must be at least 8 characters with uppercase, lowercase, and numbers
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder="••••••••"
                                disabled={isSubmitting}
                            />
                            {errors.confirmPassword && (
                                <div className="error-message">{errors.confirmPassword}</div>
                            )}
                        </div>
                    </div>

                    {/* Terms and Preferences */}
                    <div className="form-section">
                        <div className={'form-check'}>
                            <input
                                type="checkbox"
                                id="agreeTerms"
                                name="agreeTerms"
                                checked={formData.agreeTerms}
                                onChange={handleChange}
                                
                                disabled={isSubmitting}
                                className={`form-check-input ${errors.agreeTerms ? 'error' : ''}`}
                            />
                            <label htmlFor="agreeTerms" className="form-check-label">
                                I agree to the{' '}
                                <Link to="/terms" className="terms-link">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="terms-link">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        {errors.agreeTerms && (
                            <div className="error-message">{errors.agreeTerms}</div>
                        )}

                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="subscribe"
                                name="subscribe"
                                checked={formData.subscribe}
                                onChange={handleChange}
                                className="form-check-input"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="subscribe" className="form-check-label">
                                Send me product updates, tips, and resources (optional)
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-small"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Plan Info */}
                    <div className="plan-info">
                        <p className="plan-title">Free Plan Includes:</p>
                        <ul className="plan-features">
                            <li>✓ Up to 5 team members</li>
                            <li>✓ 3 active projects</li>
                            <li>✓ 1 GB storage</li>
                            <li>✓ Basic project management</li>
                            <li>✓ Email support</li>
                        </ul>
                    </div>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <div className="social-signup">
                        <p className="social-signup-text">Sign up with</p>
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

                <div className="register-footer">
                    <p className="login-text">
                        Already have an account?{' '}
                        <Link to="/login" className="login-link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;