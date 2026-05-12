import { PageShell } from '../components/common/PageShell';
import { ABOUT_SECTIONS } from '../config/seoContent';

export function AboutPage() {
  return (
    <PageShell
      title="서비스 소개"
      description="BridgeWork는 장애인 구직자가 추천 이유와 접근성 정보를 함께 확인하며 일자리를 탐색하도록 돕습니다."
    >
      <article className="seo-content-page">
        {ABOUT_SECTIONS.map((section) => (
          <section key={section.title} className="seo-content-page__section">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </PageShell>
  );
}
