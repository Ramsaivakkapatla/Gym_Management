import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { membershipService, memberService, planService } from '../services/api';
import {
  BadgeCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  RotateCcw,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const Memberships = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all'); // 'all' | 'active' | 'expired'
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [calculatedExpiryPreview, setCalculatedExpiryPreview] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Sync tab with query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['all', 'active', 'expired'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch initial dropdown lists
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [memRes, planRes] = await Promise.all([
          memberService.getAll({ status: 'active' }),
          planService.getAll({ activeOnly: 'true' }),
        ]);
        if (memRes.data?.success) setMembersList(memRes.data.data);
        if (planRes.data?.success) setPlansList(planRes.data.data);
      } catch (err) {
        console.error('Error loading dropdown lists:', err);
      }
    };
    loadDropdownData();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      let res;

      if (selectedMemberFilter) {
        res = await membershipService.getByMember(selectedMemberFilter);
      } else if (activeTab === 'active') {
        res = await membershipService.getActive();
      } else if (activeTab === 'expired') {
        res = await membershipService.getExpired();
      } else {
        res = await membershipService.getAll();
      }

      if (res.data?.success) {
        setMemberships(res.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load membership records.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [activeTab, selectedMemberFilter]);

  // Calculate live preview expiry date when plan or start date changes
  useEffect(() => {
    if (assignForm.startDate && assignForm.planId) {
      const selectedPlan = plansList.find((p) => p._id === assignForm.planId);
      if (selectedPlan) {
        const [year, month, day] = assignForm.startDate.split('-').map(Number);
        const totalMonths = month - 1 + selectedPlan.durationMonths;
        const targetYear = year + Math.floor(totalMonths / 12);
        const targetMonth = ((totalMonths % 12) + 12) % 12;

        const daysInTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        const targetDay = Math.min(day, daysInTarget);

        const expDate = new Date(Date.UTC(targetYear, targetMonth, targetDay));
        setCalculatedExpiryPreview(expDate.toISOString().split('T')[0]);
        return;
      }
    }
    setCalculatedExpiryPreview('');
  }, [assignForm.startDate, assignForm.planId, plansList]);

  const handleOpenAssignModal = () => {
    setAssignForm({
      memberId: membersList.length > 0 ? membersList[0]._id : '',
      planId: plansList.length > 0 ? plansList[0]._id : '',
      startDate: new Date().toISOString().split('T')[0],
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.memberId || !assignForm.planId) {
      setAlert({ type: 'error', message: 'Please select both a member and a plan.' });
      return;
    }

    setAssignSubmitting(true);
    try {
      const res = await membershipService.assign(assignForm);
      setAlert({
        type: 'success',
        message: res.data?.message || 'Membership assigned successfully.',
      });
      setIsAssignModalOpen(false);
      fetchMemberships();
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.response?.data?.message ||
          'Failed to assign membership. Check for overlapping periods.',
      });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gym Memberships</h2>
          <p className="page-subtitle">Track member enrollments, real-time statuses and plan durations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchMemberships} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAssignModal}>
            <Plus size={16} />
            <span>Assign New Membership</span>
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

      {/* Tabs and Member Filter Bar */}
      <div className="tabs-header-bar">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Memberships
          </button>
          <button
            className={`tab-btn ${activeTab === 'active' ? 'tab-btn-active' : ''}`}
            onClick={() => handleTabChange('active')}
          >
            Active Only
          </button>
          <button
            className={`tab-btn ${activeTab === 'expired' ? 'tab-btn-active' : ''}`}
            onClick={() => handleTabChange('expired')}
          >
            Expired Only
          </button>
        </div>

        <div className="filter-group member-filter-box">
          <label className="filter-label">Filter by Member:</label>
          <select
            className="form-select filter-select"
            value={selectedMemberFilter}
            onChange={(e) => setSelectedMemberFilter(e.target.value)}
          >
            <option value="">-- All Registered Members --</option>
            {membersList.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.memberId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Memberships Table */}
      <div className="content-card">
        {loading ? (
          <LoadingSpinner text="Retrieving membership records..." />
        ) : memberships.length === 0 ? (
          <div className="empty-state">
            <BadgeCheck size={44} className="empty-state-icon" />
            <p className="empty-state-title">No memberships found</p>
            <p className="empty-state-text">
              {selectedMemberFilter
                ? 'This member does not have any memberships under this view.'
                : activeTab === 'expired'
                ? 'No expired memberships found.'
                : activeTab === 'active'
                ? 'No active memberships currently running.'
                : 'Assign a membership to get started.'}
            </p>
            <button className="btn btn-primary mt-3" onClick={handleOpenAssignModal}>
              Assign Membership
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan Details (Snapshot)</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Status (Real-Time)</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => {
                  const plan = m.planSnapshot || m.plan || {};
                  const isExpired = m.status === 'Expired';
                  return (
                    <tr key={m._id}>
                      <td>
                        <div className="font-semibold">{m.member?.name || 'Unknown Member'}</div>
                        <div className="text-xs font-mono text-muted">
                          {m.member?.memberId || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-primary">
                          {plan.name || 'Custom Plan'}
                        </div>
                        <div className="text-xs text-muted">
                          {plan.durationMonths} Months | ${plan.price}
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={13} className="text-muted" />
                          <span>{new Date(m.startDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Clock size={13} className="text-muted" />
                          <span className={isExpired ? 'text-danger font-semibold' : ''}>
                            {new Date(m.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.status === 'Active' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-outline btn-xs"
                          title="Renew or Extend Membership"
                          onClick={() =>
                            navigate(`/renewals?membershipId=${m._id}&memberId=${m.member?._id}`)
                          }
                        >
                          <RotateCcw size={13} />
                          <span>Renew</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Membership Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        title="Assign Membership Plan"
        onClose={() => setIsAssignModalOpen(false)}
        maxWidth="540px"
      >
        <form onSubmit={handleAssignSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Active Member *</label>
            {membersList.length === 0 ? (
              <p className="text-danger text-sm">No active members found. Please register an active member first.</p>
            ) : (
              <select
                className="form-select"
                value={assignForm.memberId}
                onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                required
              >
                <option value="">-- Choose Member --</option>
                {membersList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.memberId}) - {m.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Select Active Membership Plan *</label>
            {plansList.length === 0 ? (
              <p className="text-danger text-sm">No active plans found. Please create or activate a plan first.</p>
            ) : (
              <select
                className="form-select"
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                required
              >
                <option value="">-- Choose Plan --</option>
                {plansList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.durationMonths} Month{p.durationMonths > 1 ? 's' : ''} (${p.price})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Membership Start Date *</label>
            <input
              type="date"
              className="form-input"
              value={assignForm.startDate}
              onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              required
            />
          </div>

          {/* Auto-Calculated Expiry Date Preview */}
          {calculatedExpiryPreview && (
            <div className="expiry-preview-box">
              <div className="expiry-preview-icon">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="expiry-preview-info">
                <span className="expiry-preview-label">Auto-Calculated Expiry Date:</span>
                <span className="expiry-preview-date">
                  {new Date(calculatedExpiryPreview).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="expiry-preview-sub">
                  Calculated automatically using calendar months addition with month-end clipping.
                </span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={assignSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={assignSubmitting || membersList.length === 0 || plansList.length === 0}
            >
              {assignSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Memberships;

