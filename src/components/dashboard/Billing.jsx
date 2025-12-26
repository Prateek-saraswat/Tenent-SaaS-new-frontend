import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../../services/auth.js';
import toast from 'react-hot-toast';
import './Billing.css';

const Billing = ({ user, tenant, usage }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const modalRef = useRef(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [upgradingPlanId, setUpgradingPlanId] = useState(null);

     const resetDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmation('');
};

     useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUpgradeModal && 
                modalRef.current && 
                !modalRef.current.contains(event.target) &&
                !loading
            ) {
                handleCloseUpgradeModal();
                setShowUpgradeModal(false);
                toast.dismiss();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUpgradeModal, loading]);

    useEffect(() => {
        loadBillingData();
    }, []);

    const resetUpgradeModal = () => {
    setSelectedPlan(null);
    toast.dismiss();
};

// Update close handlers
const handleCloseUpgradeModal = () => {
    resetUpgradeModal();
    setShowUpgradeModal(false);
};

  
    const loadBillingData = async () => {
        try {
            setLoading(true);
            
            // Load available plans
            const plansData = await ApiService.getPlans();
            if (Array.isArray(plansData)) {
                setPlans(plansData);
                
                // Set current plan
                const current = plansData.find(p => p.id === (tenant?.plan || 'free'));
                setCurrentPlan(current);
            }

            // Load invoices
            const invoicesData = await ApiService.getInvoices();
            if (Array.isArray(invoicesData)) {
                setInvoices(invoicesData);
            }

        } catch (error) {
            console.error('Failed to load billing data:', error);
             toast.error('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradePlan = async (planId) => {
        setUpgradingPlanId(planId);
        setLoading(true);
        try {
            toast.loading('Upgrading your plan...');
            await ApiService.subscribe(planId, billingCycle);
             setCurrentPlan(selectedPlan);
            
             toast.success('✅ Plan upgraded successfully!');
            setShowUpgradeModal(false);
            setSelectedPlan(null);
            loadBillingData(); // Reload to get updated plan
        } catch (error) {
            console.error('Failed to upgrade plan:', error);
             toast.error(error.message || 'Failed to upgrade plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDowngradePlan = async (planId) => {
    const userConfirmed = await new Promise((resolve) => {
        // Show custom confirmation toast
        toast.custom((t) => (
            <div className="confirm-toast">
                <p>Are you sure you want to downgrade to the {planId} plan?</p>
                <div className="confirm-buttons">
                    <button onClick={() => { resolve(true); toast.dismiss(t.id); }}>
                        Yes, Downgrade
                    </button>
                    <button onClick={() => { resolve(false); toast.dismiss(t.id); }}>
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    });

    if (!userConfirmed) return;

    setLoading(true);
    try {
        toast.loading('Processing downgrade...');
        // This would require a POST /billing/downgrade endpoint
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('✅ Plan downgraded successfully!');
        loadBillingData(); // Reload to get updated plan
    } catch (error) {
        console.error('Failed to downgrade plan:', error);
        toast.error('Failed to downgrade plan. Please try again.');
    } finally {
        setLoading(false);
    }
};

    const handleDownloadInvoice = async (invoiceId) => {
        try {
            // This would require an endpoint to download invoice PDF
            toast.loading('Preparing invoice download...');
             await new Promise(resolve => setTimeout(resolve, 1000));
              toast.success('📄 Invoice downloaded successfully!');
            
            // In production:
            // const response = await ApiService.downloadInvoice(invoiceId);
            // const url = window.URL.createObjectURL(response);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = `invoice-${invoiceId}.pdf`;
            // a.click();
        } catch (error) {
            console.error('Failed to download invoice:', error);
             toast.error('Failed to download invoice. Please try again.');
        }
    };

    const getUsagePercentage = (current, limit) => {
        if (!limit || limit <= 0) return 0;
        return Math.min((current / limit) * 100, 100);
    };

    const getUsageColor = (percentage) => {
        if (percentage > 90) return '#EF4444';
        if (percentage > 70) return '#F59E0B';
        return '#10B981';
    };

    const renderOverview = () => (
        <div className="billing-tab-content">
            {/* Current Plan */}
            <div className="current-plan-section">
                <h3>Current Plan</h3>
                <div className="plan-card current">
                    <div className="plan-header">
                        <div>
                            <h4>{currentPlan?.name || 'Free'} Plan</h4>
                            <p className="plan-price">
                                ${currentPlan?.price || 0}
                                <span className="billing-cycle">/{currentPlan?.billing_cycle || 'month'}</span>
                            </p>
                        </div>
                        <div className="plan-status">
                            <span className="status-badge active">Active</span>
                        </div>
                    </div>
                    
                    <div className="plan-features">
                        {currentPlan?.features?.map((feature, index) => (
                            <div key={index} className="feature-item">
                                <span className="feature-icon">✓</span>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="plan-actions">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setActiveTab('plans')}
                        >
                            Change Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Usage Limits */}
            <div className="usage-section">
                <h3>Usage & Limits</h3>
                <div className="usage-cards">
                    <div className="usage-card">
                        <div className="usage-header">
                            <h4>Users</h4>
                            <span className="usage-count">
                                {usage?.current?.users || 0}/{usage?.limits?.users || 5}
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div 
                                className="usage-progress-bar"
                                style={{
                                    width: `${getUsagePercentage(usage?.current?.users || 0, usage?.limits?.users || 5)}%`,
                                    background: getUsageColor(getUsagePercentage(usage?.current?.users || 0, usage?.limits?.users || 5))
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {getUsagePercentage(usage?.current?.users || 0, usage?.limits?.users || 5) > 90 
                                ? 'Limit exceeded' 
                                : getUsagePercentage(usage?.current?.users || 0, usage?.limits?.users || 5) > 70 
                                    ? 'Approaching limit' 
                                    : 'Within limits'
                            }
                        </p>
                    </div>

                    <div className="usage-card">
                        <div className="usage-header">
                            <h4>Projects</h4>
                            <span className="usage-count">
                                {usage?.current?.projects || 0}/{usage?.limits?.projects || 3}
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div 
                                className="usage-progress-bar"
                                style={{
                                    width: `${getUsagePercentage(usage?.current?.projects || 0, usage?.limits?.projects || 3)}%`,
                                    background: getUsageColor(getUsagePercentage(usage?.current?.projects || 0, usage?.limits?.projects || 3))
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {getUsagePercentage(usage?.current?.projects || 0, usage?.limits?.projects || 3) > 90 
                                ? 'Limit exceeded' 
                                : getUsagePercentage(usage?.current?.projects || 0, usage?.limits?.projects || 3) > 70 
                                    ? 'Approaching limit' 
                                    : 'Within limits'
                            }
                        </p>
                    </div>

                    <div className="usage-card">
                        <div className="usage-header">
                            <h4>Storage</h4>
                            <span className="usage-count">
                                {usage?.current?.storage_gb || '0'} GB / {usage?.limits?.storage_gb || 1} GB
                            </span>
                        </div>
                        <div className="usage-progress">
                            <div 
                                className="usage-progress-bar"
                                style={{
                                    width: `${usage?.percentages?.storage || 0}%`,
                                    background: getUsageColor(usage?.percentages?.storage || 0)
                                }}
                            ></div>
                        </div>
                        <p className="usage-note">
                            {usage?.percentages?.storage > 90 
                                ? 'Storage full' 
                                : usage?.percentages?.storage > 70 
                                    ? 'Running low' 
                                    : 'Sufficient storage'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="invoices-section">
                <div className="section-header">
                    <h3>Recent Invoices</h3>
                    <button 
                        className="btn btn-secondary"
                        onClick={() =>{

                            setActiveTab('invoices')
                            toast.loading('Loading invoices...', { duration: 800 });
                        }}
                    >
                        View All
                    </button>
                </div>
                
                <div className="invoices-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.slice(0, 5).map(invoice => (
                                <tr key={invoice.id}>
                                    <td>{invoice.invoice_number}</td>
                                    <td>{new Date(invoice.billing_date).toLocaleDateString()}</td>
                                    <td>${invoice.amount} {invoice.currency}</td>
                                    <td>
                                        <span className={`status-badge ${invoice.status}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-icon"
                                            onClick={() => handleDownloadInvoice(invoice.id)}
                                            title="Download Invoice"
                                        >
                                            📄
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {invoices.length === 0 && (
                    <div className="no-invoices">
                        <p>No invoices found</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderPlans = () => (
        <div className="billing-tab-content">
            <div className="plans-header">
                <h3>Available Plans</h3>
                <div className="billing-cycle-toggle">
                    <button 
                        className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                    >
                        Monthly
                    </button>
                    <button 
                        className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('yearly')}
                    >
                        Yearly (Save 20%)
                    </button>
                </div>
            </div>

            <div className="plans-grid">
                {plans.map(plan => {
                    const isCurrent = plan.id === (currentPlan?.id || tenant?.plan);
                    const price = billingCycle === 'monthly' ? plan.price : plan.yearly_price || plan.price * 12 * 0.8;
                    
                    return (
                        <div 
                            key={plan.id} 
                            className={`plan-card ${isCurrent ? 'current' : ''} ${plan.recommended ? 'recommended' : ''}`}
                        >
                            {plan.recommended && (
                                <div className="recommended-badge">Recommended</div>
                            )}
                            
                            <div className="plan-header">
                                <h4>{plan.name}</h4>
                                <div className="plan-price">
                                    <span className="price-amount">${price.toFixed(2)}</span>
                                    <span className="price-cycle">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                </div>
                                {plan.yearly_price && billingCycle === 'yearly' && (
                                    <p className="price-savings">Save ${(plan.price * 12 - plan.yearly_price).toFixed(2)}/year</p>
                                )}
                            </div>

                            <div className="plan-features">
                                {plan.features?.map((feature, index) => (
                                    <div key={index} className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="plan-limits">
                                <div className="limit-item">
                                    <span className="limit-label">Users:</span>
                                    <span className="limit-value">
                                        {plan.limits?.users === -1 ? 'Unlimited' : plan.limits?.users || 5}
                                    </span>
                                </div>
                                <div className="limit-item">
                                    <span className="limit-label">Projects:</span>
                                    <span className="limit-value">
                                        {plan.limits?.projects === -1 ? 'Unlimited' : plan.limits?.projects || 3}
                                    </span>
                                </div>
                                <div className="limit-item">
                                    <span className="limit-label">Storage:</span>
                                    <span className="limit-value">
                                        {plan.limits?.storage_gb === -1 ? 'Unlimited' : `${plan.limits?.storage_gb || 1} GB`}
                                    </span>
                                </div>
                            </div>

                            <div className="plan-actions">
                                {isCurrent ? (
                                    <button 
                                        className="btn btn-secondary"
                                        disabled
                                    >
                                        Current Plan
                                    </button>
                                ) : plan.id === 'free' ? (
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => handleDowngradePlan(plan.id)}
                                    >
                                        Downgrade to Free
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setSelectedPlan(plan);
                                            setShowUpgradeModal(true);
                                        }}
                                        disabled={upgradingPlanId === plan.id || loading}
                                    >
                                         {upgradingPlanId === plan.id ? 'Upgrading...' : `Upgrade to ${plan.name}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderInvoices = () => (
        <div className="billing-tab-content">
            <div className="invoices-section full">
                <div className="section-header">
                    <h3>Invoice History</h3>
                    <div className="invoice-filters">
                        <select className="filter-select">
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                        <input
                            type="month"
                            className="month-filter"
                        />
                    </div>
                </div>
                
                <div className="invoices-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Paid Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td>{invoice.invoice_number}</td>
                                    <td>{new Date(invoice.billing_date).toLocaleDateString()}</td>
                                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                                    <td>{invoice.plan || currentPlan?.name}</td>
                                    <td>${invoice.amount} {invoice.currency}</td>
                                    <td>
                                        <span className={`status-badge ${invoice.status}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        {invoice.paid_at 
                                            ? new Date(invoice.paid_at).toLocaleDateString()
                                            : '-'
                                        }
                                    </td>
                                    <td>
                                        <div className="invoice-actions">
                                            <button 
                                                className="btn-icon"
                                                onClick={() => handleDownloadInvoice(invoice.id)}
                                                title="Download Invoice"
                                            >
                                                📄
                                            </button>
                                            {invoice.invoice_url && (
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => {
                                                        toast.loading('Opening invoice in new tab...', { duration: 800 });
                                                        window.open(invoice.invoice_url, '_blank')
                                                    }}
                                                    title="View Online"
                                                >
                                                    👁️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {invoices.length === 0 && (
                    <div className="no-invoices">
                        <p>No invoices found</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading && activeTab === 'overview') {
        return (
            <div className="billing-loading">
                <div className="spinner"></div>
                <p>Loading billing information...</p>
            </div>
        );
    }

    return (
        <div className="billing-container">
            {/* Billing header */}
            <div className="billing-header">
                <div className="header-left">
                    <h1>Billing & Subscription</h1>
                    <p>Manage your subscription plan and billing information</p>
                </div>
            </div>

            {/* Billing tabs */}
            <div className="billing-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <span className="tab-icon">📊</span>
                    <span>Overview</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('plans')}
                >
                    <span className="tab-icon">💰</span>
                    <span>Plans</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    <span className="tab-icon">🧾</span>
                    <span>Invoices</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment')}
                >
                    <span className="tab-icon">💳</span>
                    <span>Payment Methods</span>
                </button>
            </div>

            {/* Billing content */}
            <div className="billing-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'plans' && renderPlans()}
                {activeTab === 'invoices' && renderInvoices()}
                {activeTab === 'payment' && (
                    <div className="billing-tab-content">
                        <div className="payment-methods">
                            <h3>Payment Methods</h3>
                            <div className="no-payment-methods">
                                <p>Payment methods management would be implemented here</p>
                                <p className="info-note">
                                    This typically involves integration with payment processors like Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Upgrade Plan Modal */}
            {showUpgradeModal && selectedPlan && (
                <div className="modal-overlay"  onClick={(e) => {
            // Check if click is on the overlay itself (not the modal content)
            if (e.target.className === 'modal-overlay' && !loading) {
                setShowUpgradeModal(false);
                toast.dismiss();
            }
        }}>
                    <div className="modal"  ref={modalRef} onClick={(e) => e.stopPropagation()} >
                        <div className="modal-header">
                            <h3>Upgrade to {selectedPlan.name}</h3>
                            <button 
                                className="close-btn"
                                onClick={handleCloseUpgradeModal} 
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="upgrade-summary">
                                <div className="summary-row">
                                     <span style={{ color: '#333', fontWeight: '500' }}>New Plan:</span>
            <span style={{ color: '#000', fontWeight: '600' }}>{selectedPlan.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span>New Plan:</span>
                                    <span>{selectedPlan.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Billing Cycle:</span>
                                    <span>{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Monthly Price:</span>
                                    <span>
                                        ${billingCycle === 'monthly' 
                                            ? selectedPlan.price 
                                            : (selectedPlan.yearly_price || selectedPlan.price * 12 * 0.8) / 12
                                        }
                                    </span>
                                </div>
                                
                                {billingCycle === 'yearly' && selectedPlan.yearly_price && (
                                    <div className="savings-notice">
                                        🎉 You'll save ${(selectedPlan.price * 12 - selectedPlan.yearly_price).toFixed(2)} per year!
                                    </div>
                                )}
                            </div>

                            <div className="upgrade-features">
                                <h4>New Features You'll Get:</h4>
                                <ul>
                                    {selectedPlan.features?.slice(0, 5).map((feature, index) => (
                                        <li key={index}>✓ {feature}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={handleCloseUpgradeModal}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => handleUpgradePlan(selectedPlan.id)}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Confirm Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;