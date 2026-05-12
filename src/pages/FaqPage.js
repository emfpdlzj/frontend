import { PageShell } from '../components/common/PageShell';
import { SERVICE_FAQ_ITEMS } from '../config/seoContent';

export function FaqPage() {
  return (
    <PageShell
      title="자주 묻는 질문"
      description="BridgeWork의 맞춤 추천, 접근성 점수, 개인정보 입력, 채용 공고 색인 정책을 안내합니다."
    >
      <article className="seo-content-page">
        {SERVICE_FAQ_ITEMS.map((item) => (
          <section key={item.question} className="seo-content-page__section">
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </section>
        ))}
      </article>
    </PageShell>
  );
}
