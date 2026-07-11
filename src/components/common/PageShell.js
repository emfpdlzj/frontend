export function PageShell({ title, description, actions, children, className = '', eyebrow = null, meta = null }) {
  const titleId = 'page-shell-title';

  return (
    <main className={`page-shell${className ? ` ${className}` : ''}`} aria-labelledby={titleId}>
      <section className="page-card">
        <header className="page-header">
          <div>
            {eyebrow ? <span className="page-header__eyebrow">{eyebrow}</span> : null}
            <h1 id={titleId}>{title}</h1>
            {description ? <p>{description}</p> : null}
            {meta ? <div className="page-header__meta">{meta}</div> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
