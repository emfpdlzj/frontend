import { Link } from 'react-router-dom';

export function PageShell({ title, description, actions, children }) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </header>
        {children}
      </section>
      <footer className="page-footer">
        <Link to="/login">로그인</Link>
        <span>·</span>
        <Link to="/onboarding">온보딩</Link>
        <span>·</span>
        <Link to="/accessibility-map">지역 접근성 지도</Link>
      </footer>
    </main>
  );
}
