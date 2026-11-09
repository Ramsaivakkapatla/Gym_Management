import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import {
  Users,
  CheckCircle,
  ClockAlert,
  CreditCard,
  ArrowUpRight,
  UserPlus,
  BadgePlus,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMemberships: 0,
    expiredMemberships: 0,
    totalPlans: 0,
    recentMemberships: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await dashboardService.getStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Failed to load dashboard metrics from backend API.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'card-blue',
      link: '/members',
      subtext: 'Registered gym members',
    },
    {
      title: 'Active Memberships',
      value: stats.activeMemberships,
      icon: CheckCircle,
      color: 'card-green',
      link: '/memberships?tab=active',
      subtext: 'Currently valid & active',
    },
    {
      title: 'Expired Memberships',
      value: stats.expiredMemberships,
      icon: ClockAlert,
      color: 'card-red',
      link: '/memberships?tab=expired',
      subtext: 'Requires plan renewal',
    },
    {
      title: 'Membership Plans',
      value: stats.totalPlans,
      icon: CreditCard,
      color: 'card-purple',
      link: '/plans',
      subtext: 'Configured plan offerings',
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Dashboard</h2>
          <p className="page-subtitle">Real-time gym performance and membership lifecycle overview</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchStats} title="Refresh dashboard data">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <Link to="/members" className="btn btn-primary">
            <UserPlus size={16} />
            <span>Add Member</span>
          </Link>
          <Link to="/memberships" className="btn btn-accent">
            <BadgePlus size={16} />
            <span>Assign Membership</span>
          </Link>
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      {loading ? (
        <LoadingSpinner text="Loading gym metrics..." />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link to={card.link} key={idx} className={`stat-card ${card.color}`}>
                  <div className="stat-card-header">
                    <span className="stat-title">{card.title}</span>
                    <div className="stat-icon-wrap">
                      <Icon size={22} />
                    </div>
                  </div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-footer">
                    <span className="stat-subtext">{card.subtext}</span>
                    <ArrowUpRight size={16} className="stat-link-icon" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recent Memberships Overview */}
          <div className="content-card mt-6">
            <div className="content-card-header">
              <div>
                <h3 className="card-heading">Recent Membership Assignments</h3>
                <p className="card-subheading">Latest members enrolled into gym plans</p>
              </div>
              <Link to="/memberships" className="btn btn-outline btn-sm">
                View All Memberships
              </Link>
            </div>

            {stats.recentMemberships.length === 0 ? (
              <div className="empty-state">
                <BadgePlus size={40} className="empty-state-icon" />
                <p className="empty-state-title">No memberships assigned yet</p>
                <p className="empty-state-text">
                  Assign a plan to a registered member to begin tracking their membership period.
                </p>
                <Link to="/memberships" className="btn btn-primary mt-3">
                  Assign First Membership
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Full Name</th>
                      <th>Plan Assigned</th>
                      <th>Start Date</th>
                      <th>Expiry Date</th>
                      <th>Current Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentMemberships.map((item) => (
                      <tr key={item._id}>
                        <td className="font-mono text-muted">{item.member?.memberId || 'N/A'}</td>
                        <td className="font-semibold">{item.member?.name || 'Unknown Member'}</td>
                        <td>
                          <span className="badge badge-plan">
                            {item.planSnapshot?.name || item.plan?.name || 'Standard'} (
                            {item.planSnapshot?.durationMonths || 1} mo)
                          </span>
                        </td>
                        <td>{new Date(item.startDate).toLocaleDateString()}</td>
                        <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.status === 'Active' ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link to="/renewals" className="btn btn-outline btn-xs">
                            Renew
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

