const MAP = {
  DRAFT:       'badge-draft',
  CONFIRMED:   'badge-confirmed',
  IN_PROGRESS: 'badge-in_progress',
  DELIVERED:   'badge-delivered',
  RECEIVED:    'badge-received',
  COMPLETED:   'badge-completed',
  CANCELLED:   'badge-cancelled',
  PURCHASE:    'badge-purchase',
  MANUFACTURING: 'badge-manufacturing',
  ACTIVE:      'badge-confirmed',
  INACTIVE:    'badge-cancelled',
};

export default function Badge({ status }) {
  return (
    <span className={`badge ${MAP[status] || 'badge-draft'}`}>{status}</span>
  );
}
