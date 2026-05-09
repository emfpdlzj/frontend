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
    </main>
  );
}
