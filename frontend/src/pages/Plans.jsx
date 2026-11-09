import React, { useState, useEffect } from 'react';
import { planService } from '../services/api';
import {
  CreditCard,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMonths: 1,
    price: '',
    description: '',
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Status Toggle Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    plan: null,
    loading: false,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await planService.getAll();
      if (res.data?.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch membership plans.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentPlanId(null);
    setFormData({
      name: '',
      durationMonths: 1,
      price: '',
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setIsEditing(true);
    setCurrentPlanId(plan._id);
    setFormData({
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price,
      description: plan.description || '',
      isActive: plan.isActive,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (isEditing) {
        await planService.update(currentPlanId, formData);
        setAlert({ type: 'success', message: 'Membership plan updated successfully.' });
      } else {
        await planService.create(formData);
        setAlert({ type: 'success', message: 'Membership plan created successfully.' });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving membership plan.',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.plan) return;
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const res = await planService.toggleStatus(confirmDialog.plan._id);
      setAlert({
        type: 'success',
        message: res.data?.message || 'Plan status updated successfully.',
      });
      setConfirmDialog({ isOpen: false, plan: null, loading: false });
      fetchPlans();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update plan status.',
      });
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Membership Plans</h2>
          <p className="page-subtitle">Configure subscription tiers, pricing, and active statuses</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchPlans} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {loading ? (
        <LoadingSpinner text="Loading membership plans..." />
      ) : plans.length === 0 ? (
        <div className="empty-state content-card">
          <CreditCard size={44} className="empty-state-icon" />
          <p className="empty-state-title">No membership plans found</p>
          <p className="empty-state-text">
            Create plans with duration and price to start assigning memberships.
          </p>
          <button className="btn btn-primary mt-3" onClick={handleOpenAddModal}>
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`plan-card ${!plan.isActive ? 'plan-card-inactive' : ''}`}
            >
              <div className="plan-card-top">
                <div className="plan-badge-row">
                  <span
                    className={`badge ${
                      plan.isActive ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {plan.isActive ? 'Active Plan' : 'Inactive (Disabled)'}
                  </span>
                  <span className="badge badge-secondary">
                    <Clock size={12} /> {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                  </span>
                </div>
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price-wrap">
                  <span className="plan-currency">$</span>
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">/ {plan.durationMonths} mo</span>
                </div>
                <p className="plan-desc">
                  {plan.description || 'No detailed description specified.'}
                </p>
              </div>

              <div className="plan-card-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEditModal(plan)}
                >
                  <Edit size={14} />
                  <span>Edit Plan</span>
                </button>
                <button
                  className={`btn btn-sm ${
                    plan.isActive ? 'btn-danger-outline' : 'btn-success-outline'
                  }`}
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      plan,
                      loading: false,
                    })
                  }
                >
                  {plan.isActive ? (
                    <>
                      <XCircle size={14} />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Edit Membership Plan' : 'Create New Membership Plan'}
        onClose={() => setIsModalOpen(false)}
        maxWidth="500px"
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Plan Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Quarterly Pro, Annual VIP"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Duration (Months) *</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="e.g. 1, 3, 6, 12"
                value={formData.durationMonths}
                onChange={(e) =>
                  setFormData({ ...formData, durationMonths: parseInt(e.target.value, 10) || 1 })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="e.g. 49.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Plan Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Features, gym floor access, locker rights, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Set as Active Plan (available for new member assignments)</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Plan Status Toggle */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.plan?.isActive ? 'Deactivate Plan' : 'Activate Plan'}
        message={
          confirmDialog.plan?.isActive
            ? `Are you sure you want to deactivate "${confirmDialog.plan?.name}"? New memberships cannot be assigned to inactive plans. Existing memberships using this plan will continue unaffected.`
            : `Are you sure you want to activate "${confirmDialog.plan?.name}"? It will become immediately available for new assignments.`
        }
        confirmText={confirmDialog.plan?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={confirmDialog.plan?.isActive ? 'danger' : 'primary'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmDialog({ isOpen: false, plan: null, loading: false })}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default Plans;

