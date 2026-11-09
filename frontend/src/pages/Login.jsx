import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Alert from '../components/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg(
          'Cannot connect to the backend server. Please make sure the backend is running in your terminal (run: cd backend; npm run dev).'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutofillDemo = () => {
    setEmail('admin@gym.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Dumbbell size={36} />
          </div>
          <h2 className="login-brand-title">IRONPULSE FITNESS</h2>
          <p className="login-brand-subtitle">Gym Membership Management System</p>
        </div>

        <div className="login-header">
          <h3>Admin Sign In</h3>
          <p>Access the management console with your credentials</p>
        </div>

        {errorMsg && (
          <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Admin Email
            </label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-login"
            disabled={submitting}
          >
            {submitting ? (
              <span className="btn-loading">
                <span className="spinner-small"></span> Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-demo-helper">
          <div className="demo-pill" onClick={handleAutofillDemo}>
            <ShieldCheck size={16} className="text-primary" />
            <span>Click to fill default demo credentials (admin@gym.com / admin123)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
