import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={16} className="toast-icon success" />;
        if (toast.type === 'error') {
          icon = <AlertTriangle size={16} className="toast-icon error" />;
        } else if (toast.type === 'info') {
          icon = <Info size={16} className="toast-icon info" />;
        }

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type || 'success'}`}>
            <div className="toast-content">
              {icon}
              <div className="toast-text">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
