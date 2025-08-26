import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  message, 
  duration = 4000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {getIcon()}
      </div>
      <div className="toast__message">
        {message}
      </div>
      <button 
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;