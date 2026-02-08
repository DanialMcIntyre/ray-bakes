import React from 'react';

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 'min(520px, 94vw)', background: 'white', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 20px 60px rgba(2,6,23,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
            {description && <div style={{ marginTop: 8, color: '#475569' }}>{description}</div>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(2,6,23,0.08)', padding: '0.5rem 0.8rem', borderRadius: 8, cursor: 'pointer' }}>{cancelLabel}</button>
          <button onClick={async () => { await onConfirm(); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
