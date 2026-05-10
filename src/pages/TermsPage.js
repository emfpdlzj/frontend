import { PageShell } from '../components/common/PageShell';
import { POLICY_DOCUMENT_MAP } from '../config/policyDocuments';

export function TermsPage() {
  const policy = POLICY_DOCUMENT_MAP.terms;

  return (
    <PageShell title={policy.title} description={policy.summary}>
      <article className="policy-page">
        {policy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </PageShell>
  );
}
