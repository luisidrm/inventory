"use client";

import { Icon } from "@/components/ui/Icon";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  error?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export function FormModal({
  open,
  onClose,
  title,
  icon = "edit",
  onSubmit,
  submitting = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  error,
  maxWidth = "560px",
  children,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header__icon">
            <Icon name={icon} />
          </div>
          <h2 className="modal-header__title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <div className="modal-form-grid">
            {children}
          </div>

          {error && (
            <p className="form-error" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn--ghost"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={submitting}
            >
              {submitting ? <div className="dt-state__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}