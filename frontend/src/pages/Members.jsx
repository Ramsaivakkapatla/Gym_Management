import React, { useState, useEffect } from 'react';
import { memberService, membershipService } from '../services/api';
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  History,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // View Details Modal state
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Deactivate/Activate Confirmation
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    member: null,
    loading: false,
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await memberService.getAll(params);
      if (res.data?.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch members.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentMemberId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setIsEditing(true);
    setCurrentMemberId(member._id);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      dob: member.dob ? member.dob.split('T')[0] : '',
      address: member.address || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (isEditing) {
        await memberService.update(currentMemberId, formData);
        setAlert({ type: 'success', message: 'Member updated successfully.' });
      } else {
        await memberService.create(formData);
        setAlert({ type: 'success', message: 'Member registered successfully.' });
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving member details.',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDetails = async (memberId) => {
    setViewDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await memberService.getById(memberId);
      if (res.data?.success) {
        setMemberDetails(res.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Could not load member details and history.',
      });
      setViewDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!confirmDialog.member) return;
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberService.toggleStatus(confirmDialog.member._id);
      setAlert({
        type: 'success',
        message: res.data?.message || 'Member status updated successfully.',
      });
      setConfirmDialog({ isOpen: false, member: null, loading: false });
      fetchMembers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update member status.',
      });
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Member Directory</h2>
          <p className="page-subtitle">Manage member registrations, view profiles and audit history</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchMembers} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            <span>Add New Member</span>
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

      {/* Filters and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, phone, or member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Filter Account:</label>
          <select
            className="form-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Members</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated Accounts</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="content-card">
        {loading ? (
          <LoadingSpinner text="Fetching member records..." />
        ) : members.length === 0 ? (
          <div className="empty-state">
            <UserPlus size={44} className="empty-state-icon" />
            <p className="empty-state-title">No members found</p>
            <p className="empty-state-text">
              {searchQuery
                ? `No members match search term "${searchQuery}".`
                : 'Get started by registering the first gym member.'}
            </p>
            <button className="btn btn-primary mt-3" onClick={handleOpenAddModal}>
              Add Member Now
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Full Name</th>
                  <th>Contact Info</th>
                  <th>Gender / DOB</th>
                  <th>Current Membership</th>
                  <th>Account Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const latest = member.latestMembership;
                  return (
                    <tr key={member._id} className={!member.isActive ? 'row-deactivated' : ''}>
                      <td className="font-mono font-bold text-primary">{member.memberId}</td>
                      <td>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-xs text-muted">
                          Joined: {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="contact-item">
                          <Mail size={13} className="text-muted" />
                          <span>{member.email}</span>
                        </div>
                        <div className="contact-item">
                          <Phone size={13} className="text-muted" />
                          <span>{member.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div>{member.gender}</div>
                        <div className="text-xs text-muted">
                          DOB: {member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        {latest ? (
                          <div>
                            <span
                              className={`badge ${
                                latest.status === 'Active' ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {latest.status}
                            </span>
                            <div className="text-xs text-muted mt-1">
                              Expires: {new Date(latest.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-secondary">No Plan</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            member.isActive ? 'badge-active' : 'badge-inactive'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            className="action-btn action-view"
                            title="View Member Profile & History"
                            onClick={() => handleOpenDetails(member._id)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn action-edit"
                            title="Edit Member Information"
                            onClick={() => handleOpenEditModal(member)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`action-btn ${
                              member.isActive ? 'action-deactivate' : 'action-reactivate'
                            }`}
                            title={member.isActive ? 'Deactivate Member' : 'Reactivate Member'}
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                member,
                                loading: false,
                              })
                            }
                          >
                            {member.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Edit Member Information' : 'Register New Gym Member'}
        onClose={() => setIsModalOpen(false)}
        maxWidth="580px"
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Street address, city, postal code..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
              {formSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Update Member'
                : 'Create Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Details & History Modal */}
      <Modal
        isOpen={viewDetailsOpen}
        title="Member Profile & Membership History"
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="720px"
      >
        {detailsLoading || !memberDetails ? (
          <LoadingSpinner text="Loading member profile & historical records..." />
        ) : (
          <div className="member-details-container">
            {/* Header info card */}
            <div className="details-header-card">
              <div className="details-avatar">
                {memberDetails.member.name.charAt(0).toUpperCase()}
              </div>
              <div className="details-info">
                <div className="details-title-row">
                  <h4>{memberDetails.member.name}</h4>
                  <span className="badge badge-primary font-mono">
                    {memberDetails.member.memberId}
                  </span>
                  <span
                    className={`badge ${
                      memberDetails.member.isActive ? 'badge-active' : 'badge-inactive'
                    }`}
                  >
                    {memberDetails.member.isActive ? 'Active Member' : 'Deactivated'}
                  </span>
                </div>
                <div className="details-meta-grid">
                  <div>
                    <Mail size={13} className="text-muted" /> {memberDetails.member.email}
                  </div>
                  <div>
                    <Phone size={13} className="text-muted" /> {memberDetails.member.phone}
                  </div>
                  <div>
                    <Calendar size={13} className="text-muted" /> DOB:{' '}
                    {new Date(memberDetails.member.dob).toLocaleDateString()}
                  </div>
                  <div>
                    <MapPin size={13} className="text-muted" />{' '}
                    {memberDetails.member.address || 'No address registered'}
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Memberships */}
            <div className="details-section mt-4">
              <h5 className="section-title">
                <Clock size={16} /> All Memberships ({memberDetails.memberships.length})
              </h5>
              {memberDetails.memberships.length === 0 ? (
                <p className="text-muted text-sm italic">No memberships on record.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table text-sm">
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Duration</th>
                        <th>Start Date</th>
                        <th>Expiry Date</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberDetails.memberships.map((m) => (
                        <tr key={m._id}>
                          <td className="font-semibold">
                            {m.planSnapshot?.name || m.plan?.name}
                          </td>
                          <td>{m.planSnapshot?.durationMonths || m.plan?.durationMonths} mo</td>
                          <td>{new Date(m.startDate).toLocaleDateString()}</td>
                          <td>{new Date(m.expiryDate).toLocaleDateString()}</td>
                          <td>${m.planSnapshot?.price || m.plan?.price}</td>
                          <td>
                            <span
                              className={`badge ${
                                m.status === 'Active' ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Renewal History */}
            <div className="details-section mt-4">
              <h5 className="section-title">
                <History size={16} /> Renewal History ({memberDetails.renewalHistory.length})
              </h5>
              {memberDetails.renewalHistory.length === 0 ? (
                <p className="text-muted text-sm italic">No renewals processed yet for this member.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table text-sm">
                    <thead>
                      <tr>
                        <th>Renewal Date</th>
                        <th>Type</th>
                        <th>Plan</th>
                        <th>Prev Expiry</th>
                        <th>New Expiry</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberDetails.renewalHistory.map((r) => (
                        <tr key={r._id}>
                          <td>{new Date(r.renewalDate || r.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span
                              className={`badge ${
                                r.renewalType === 'EARLY_EXTEND'
                                  ? 'badge-plan'
                                  : 'badge-accent'
                              }`}
                            >
                              {r.renewalType === 'EARLY_EXTEND' ? 'Early Extension' : 'Late Renewal'}
                            </span>
                          </td>
                          <td>{r.planSnapshot?.name || r.plan?.name}</td>
                          <td>{new Date(r.previousExpiryDate).toLocaleDateString()}</td>
                          <td className="font-semibold text-primary">
                            {new Date(r.newExpiryDate).toLocaleDateString()}
                          </td>
                          <td>${r.planSnapshot?.amount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewDetailsOpen(false)}
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.member?.isActive ? 'Deactivate Member' : 'Reactivate Member'}
        message={
          confirmDialog.member?.isActive
            ? `Are you sure you want to deactivate ${confirmDialog.member?.name}? They will no longer be eligible for new memberships, but all their historical membership records and renewals will be safely preserved.`
            : `Are you sure you want to reactivate ${confirmDialog.member?.name}? They will become eligible for new memberships and renewals.`
        }
        confirmText={confirmDialog.member?.isActive ? 'Deactivate' : 'Reactivate'}
        confirmVariant={confirmDialog.member?.isActive ? 'danger' : 'primary'}
        onConfirm={handleToggleStatusConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, member: null, loading: false })}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default Members;

