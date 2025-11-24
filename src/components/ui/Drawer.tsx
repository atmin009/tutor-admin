import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Drawer = ({ isOpen, onClose, title, children, footer }: DrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-card border-l border-slate-200 z-50 flex flex-col transform transition-transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close drawer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200">{footer}</div>
        )}
      </div>
    </>
  );

  // Use portal to render at body level, avoiding overflow issues
  return createPortal(drawerContent, document.body);
};

export default Drawer;

