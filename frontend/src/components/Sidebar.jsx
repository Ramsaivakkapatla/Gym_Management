import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BadgeCheck,
  RotateCcw,
  Dumbbell,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/plans', label: 'Membership Plans', icon: CreditCard },
    { to: '/memberships', label: 'Memberships', icon: BadgeCheck },
    { to: '/renewals', label: 'Renewals & History', icon: RotateCcw },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop mobile-only" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Dumbbell className="brand-icon" size={26} />
          </div>
          <div className="brand-info">
            <span className="brand-title">IRONPULSE</span>
            <span className="brand-subtitle">Gym Management</span>
          </div>
          <button className="sidebar-close-btn mobile-only" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">MAIN NAVIGATION</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                onClick={onClose}
              >
                <Icon className="nav-icon" size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="system-pill">
            <span className="pulse-indicator"></span>
            <span>MERN Stack v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

