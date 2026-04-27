export function LoadingView({ label = '처리 중입니다...' }) {
  return (
    <div className="loading-view" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
