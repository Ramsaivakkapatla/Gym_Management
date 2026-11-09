import React from 'react';

const LoadingSpinner = ({ text = 'Loading data...', small = false }) => {
  return (
    <div className={`spinner-container ${small ? 'spinner-small' : ''}`}>
      <div className="spinner"></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

