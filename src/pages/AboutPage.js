import { PageShell } from '../components/common/PageShell';
import { ABOUT_SECTIONS } from '../config/seoContent';

export function AboutPage() {
  return (
    <PageShell
      className="readable-page readable-page--about"
      eyebrow="About Bridgework"
      title="서비스 소개"
      description="BridgeWork는 장애인 구직자가 추천 이유와 접근성 정보를 함께 확인하며 일자리를 탐색하도록 돕습니다."
      meta={<span>서비스를 설계하는 3가지 원칙</span>}
    >
      <article className="seo-content-page seo-content-page--about">
        {ABOUT_SECTIONS.map((section, index) => (
          <section key={section.title} className="seo-content-page__section">
            <span className="seo-content-page__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </article>
    </PageShell>
  );
}
