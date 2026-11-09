import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className={`alert-box alert-${type}`}>
      <div className="alert-content">
        {isSuccess && <CheckCircle2 className="alert-icon text-success" size={20} />}
        {isError && <AlertCircle className="alert-icon text-error" size={20} />}
        {!isSuccess && !isError && <Info className="alert-icon text-info" size={20} />}
        <span className="alert-text">{message}</span>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close alert">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;

