import { PageShell } from '../components/common/PageShell';
import { SERVICE_FAQ_ITEMS } from '../config/seoContent';

export function FaqPage() {
  return (
    <PageShell
      className="readable-page readable-page--faq"
      eyebrow="Help center"
      title="자주 묻는 질문"
      description="BridgeWork의 맞춤 추천, 접근성 점수, 개인정보 입력, 채용 공고 색인 정책을 안내합니다."
      meta={<span>자주 찾는 질문 {SERVICE_FAQ_ITEMS.length}개</span>}
    >
      <article className="faq-document" aria-label="자주 묻는 질문 목록">
        {SERVICE_FAQ_ITEMS.map((item, index) => (
          <details key={item.question} className="faq-document__item">
            <summary>
              <span className="faq-document__number" aria-hidden="true">
                Q{String(index + 1).padStart(2, '0')}
              </span>
              <h2>{item.question}</h2>
              <span className="faq-document__toggle" aria-hidden="true" />
            </summary>
            <div className="faq-document__answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </article>
    </PageShell>
  );
}
