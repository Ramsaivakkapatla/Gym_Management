import React from 'react';
import { Menu, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { admin, logout } = useAuth();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="navbar-heading">
          <h1 className="navbar-title">Gym Management Console</h1>
        </div>
      </div>

      <div className="navbar-right">
        <div className="admin-profile-badge">
          <div className="admin-avatar">
            <UserCheck size={18} />
          </div>
          <div className="admin-details">
            <span className="admin-name">{admin?.name || 'Administrator'}</span>
            <span className="admin-role">Admin</span>
          </div>
        </div>

        <button
          className="btn btn-outline btn-logout"
          onClick={logout}
          title="Sign out of Admin account"
        >
          <LogOut size={16} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

