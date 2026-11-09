import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { renewalService, membershipService, planService } from '../services/api';
import {
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  RefreshCw,
  User,
} from 'lucide-react';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const Renewals = () => {
  const [searchParams] = useSearchParams();
  const preselectedMembershipId = searchParams.get('membershipId');
  const preselectedMemberId = searchParams.get('memberId');

  const [renewals, setRenewals] = useState([]);
  const [membershipsList, setMembershipsList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filter renewals by member
  const [selectedMemberFilter, setSelectedMemberFilter] = useState(preselectedMemberId || '');

  // Renewal Form State
  const [selectedMembershipId, setSelectedMembershipId] = useState(preselectedMembershipId || '');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Load initial dropdown data
  const loadData = async () => {
    try {
      const [memRes, planRes] = await Promise.all([
        membershipService.getAll(),
        planService.getAll({ activeOnly: 'true' }),
      ]);

      if (memRes.data?.success) {
        setMembershipsList(memRes.data.data);
        if (!selectedMembershipId && memRes.data.data.length > 0) {
          setSelectedMembershipId(memRes.data.data[0]._id);
        }
      }

      if (planRes.data?.success) {
        setPlansList(planRes.data.data);
        if (planRes.data.data.length > 0) {
          setSelectedPlanId(planRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching initial renewal form data:', err);
    }
  };

  const fetchRenewals = async () => {
    try {
      setLoadingHistory(true);
      let res;
      if (selectedMemberFilter) {
        res = await renewalService.getByMember(selectedMemberFilter);
      } else {
        res = await renewalService.getAll();
      }
      if (res.data?.success) {
        setRenewals(res.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load renewal history.',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchRenewals();
  }, [selectedMemberFilter]);

  // Find currently selected membership object
  const activeMembershipObj = membershipsList.find((m) => m._id === selectedMembershipId);
  const activePlanObj = plansList.find((p) => p._id === selectedPlanId);

  // Calculate renewal preview details
  const getRenewalRulePreview = () => {
    if (!activeMembershipObj || !activePlanObj || !renewalDate) return null;

    const existingExpDate = new Date(activeMembershipObj.expiryDate);
    const existingExpStr = activeMembershipObj.expiryDate.split('T')[0];
    const isEarlyOrOnTime = renewalDate <= existingExpStr;

    const baseDateStr = isEarlyOrOnTime ? existingExpStr : renewalDate;
    const [year, month, day] = baseDateStr.split('-').map(Number);
    const totalMonths = month - 1 + activePlanObj.durationMonths;
    const targetYear = year + Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;

    const daysInTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const targetDay = Math.min(day, daysInTarget);
    const calculatedExpiry = new Date(Date.UTC(targetYear, targetMonth, targetDay))
      .toISOString()
      .split('T')[0];

    return {
      isEarlyOrOnTime,
      ruleName: isEarlyOrOnTime ? 'Case 1: Early Extension' : 'Case 2: Late Renewal',
      ruleClass: isEarlyOrOnTime ? 'rule-early' : 'rule-late',
      ruleDescription: isEarlyOrOnTime
        ? `Renewal date is on or before expiry (${existingExpStr}). Extending from existing expiry date.`
        : `Renewal date is after expiry (${existingExpStr}). Starting fresh membership from renewal date.`,
      newStartDate: baseDateStr,
      newExpiryDate: calculatedExpiry,
      price: activePlanObj.price,
    };
  };

  const preview = getRenewalRulePreview();

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMembershipId || !selectedPlanId) {
      setAlert({ type: 'error', message: 'Please select both a membership and a renewal plan.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await renewalService.renew({
        membershipId: selectedMembershipId,
        planId: selectedPlanId,
        renewalDate,
      });

      setAlert({
        type: 'success',
        message: res.data?.message || 'Membership renewal processed successfully.',
      });

      // Reload dropdowns and history
      await loadData();
      await fetchRenewals();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Renewal processing failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Membership Renewals & Lifecycle</h2>
          <p className="page-subtitle">Process early extensions or late renewals with automated rule calculation</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchRenewals} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
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

      {/* Renewal Action Card */}
      <div className="content-card renewal-action-card mb-6">
        <div className="content-card-header">
          <div>
            <h3 className="card-heading flex-center gap-2">
              <RotateCcw size={18} className="text-primary" />
              <span>Process Membership Renewal</span>
            </h3>
            <p className="card-subheading">
              Select existing membership and renewal plan to apply Case 1 or Case 2 logic
            </p>
          </div>
        </div>

        {membershipsList.length === 0 ? (
          <div className="empty-state py-4">
            <p className="text-muted">No memberships exist to renew. Please assign a membership first.</p>
          </div>
        ) : (
          <form onSubmit={handleRenewalSubmit} className="renewal-form">
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Select Membership to Renew *</label>
                <select
                  className="form-select"
                  value={selectedMembershipId}
                  onChange={(e) => setSelectedMembershipId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Membership --</option>
                  {membershipsList.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.member?.name} ({m.member?.memberId}) — Exp:{' '}
                      {new Date(m.expiryDate).toLocaleDateString()} [{m.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Renewal Plan *</label>
                <select
                  className="form-select"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Plan --</option>
                  {plansList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.durationMonths} Month{p.durationMonths > 1 ? 's' : ''} (${p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Renewal Date (Processed On) *</label>
                <input
                  type="date"
                  className="form-input"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            {preview && (
              <div className={`renewal-preview-banner ${preview.ruleClass}`}>
                <div className="preview-header">
                  <div className="preview-badge-row">
                    <span className="badge badge-primary">{preview.ruleName}</span>
                    <span className="preview-explanation">{preview.ruleDescription}</span>
                  </div>
                  <div className="preview-amount">
                    <span className="text-xs text-muted">Amount Due:</span>
                    <span className="font-bold font-mono text-lg">${preview.price}</span>
                  </div>
                </div>

                <div className="preview-calculation-grid">
                  <div className="calc-item">
                    <span className="calc-label">Previous Expiry:</span>
                    <span className="calc-value">
                      {new Date(activeMembershipObj.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="calc-arrow">
                    <ArrowRight size={18} className="text-muted" />
                  </div>
                  <div className="calc-item">
                    <span className="calc-label">New Period Start:</span>
                    <span className="calc-value">
                      {new Date(preview.newStartDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="calc-arrow">
                    <ArrowRight size={18} className="text-muted" />
                  </div>
                  <div className="calc-item">
                    <span className="calc-label">New Expiry Date:</span>
                    <span className="calc-value font-bold text-primary">
                      {new Date(preview.newExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions-right mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !selectedMembershipId || !selectedPlanId}
              >
                {submitting ? (
                  'Processing Renewal...'
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Confirm & Process Renewal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historical Renewal Audit Log */}
      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h3 className="card-heading flex-center gap-2">
              <History size={18} className="text-muted" />
              <span>Renewal History Audit Log</span>
            </h3>
            <p className="card-subheading">
              Permanent snapshot records of every membership extension and renewal
            </p>
          </div>

          <div className="filter-group member-filter-box">
            <label className="filter-label">Filter History by Member:</label>
            <select
              className="form-select filter-select"
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
            >
              <option value="">-- All Member Renewals --</option>
              {Array.from(
                new Map(
                  membershipsList
                    .filter((m) => m.member)
                    .map((m) => [m.member._id, m.member])
                ).values()
              ).map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.memberId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingHistory ? (
          <LoadingSpinner text="Loading renewal log..." />
        ) : renewals.length === 0 ? (
          <div className="empty-state">
            <History size={44} className="empty-state-icon" />
            <p className="empty-state-title">No renewal records found</p>
            <p className="empty-state-text">
              Renewals processed using the form above will appear in this permanent audit log.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Processed Date</th>
                  <th>Member</th>
                  <th>Renewal Type</th>
                  <th>Plan & Duration Snapshot</th>
                  <th>Previous Expiry</th>
                  <th>New Start Date</th>
                  <th>New Expiry Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => {
                  const plan = r.planSnapshot || r.plan || {};
                  const isEarly = r.renewalType === 'EARLY_EXTEND';
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="date-cell">
                          <Calendar size={13} className="text-muted" />
                          <span>
                            {new Date(r.renewalDate || r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{r.member?.name || 'Unknown Member'}</div>
                        <div className="text-xs font-mono text-muted">
                          {r.member?.memberId || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isEarly ? 'badge-plan' : 'badge-accent'}`}>
                          {isEarly ? 'Early Extension' : 'Late Renewal'}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium">{plan.name || 'Custom'}</div>
                        <div className="text-xs text-muted">
                          {plan.durationMonths} Months | ${plan.amount || plan.price}
                        </div>
                      </td>
                      <td>
                        <span className="text-muted font-mono">
                          {new Date(r.previousExpiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono">
                          {new Date(r.newStartDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-primary">
                          {new Date(r.newExpiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-semibold">${plan.amount || plan.price}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Renewals;

