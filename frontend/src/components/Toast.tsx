import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-xl transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'border-emerald-500/40 bg-slate-900 text-emerald-300'
              : toast.type === 'error'
              ? 'border-rose-500/40 bg-slate-900 text-rose-300'
              : 'border-indigo-500/40 bg-slate-900 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-indigo-400" />}
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
