export function StatusMessage({ kind = 'info', children }) {
  if (!children) {
    return null;
  }

  return <p className={`status-message status-${kind}`}>{children}</p>;
}
