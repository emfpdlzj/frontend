import { Link, Navigate, useParams } from 'react-router-dom';
import { LegalTranslationNotice } from '../components/common/LegalTranslationNotice';
import { POLICY_DOCUMENTS, POLICY_DOCUMENT_MAP, getPolicyPath } from '../config/policyDocuments';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function PolicyDetailPage() {
  const { policyId } = useParams();
  const { localizePath } = useLocale();
  const policy = POLICY_DOCUMENT_MAP[policyId];

  if (!policy) {
    return <Navigate to={localizePath(ROUTE_PATHS.settings)} replace />;
  }

  return (
    <main className="policy-detail-page" aria-labelledby="policy-detail-title">
      <div className="policy-detail-page__layout">
        <aside className="policy-detail-page__side" aria-label="정책 문서 목록">
          <Link className="policy-detail-page__back" to={localizePath(`${ROUTE_PATHS.settings}#policies`)}>
            환경설정으로 돌아가기
          </Link>
          <nav>
            {POLICY_DOCUMENTS.map((item) => (
              <Link
                key={item.id}
                className={`policy-detail-page__nav-link${item.id === policy.id ? ' is-active' : ''}`}
                to={localizePath(getPolicyPath(item.id))}
              >
                <span data-i18n-skip>{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <article className="policy-detail-page__content">
          <header className="policy-detail-page__header">
            <span>Bridgework 정책 문서</span>
            <h1 id="policy-detail-title" data-i18n-skip>{policy.title}</h1>
            <p data-i18n-skip>{policy.summary}</p>
            <dl>
              <div>
                <dt>마지막 수정일</dt>
                <dd>{policy.updatedAt}</dd>
              </div>
              <div>
                <dt>적용 서비스</dt>
                <dd>Bridgework 웹 서비스</dd>
              </div>
            </dl>
          </header>

          <LegalTranslationNotice />

          <div className="policy-detail-page__body" data-i18n-skip>
            {policy.sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`policy-section-${index}`}>
                <h2 id={`policy-section-${index}`}>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <footer className="policy-detail-page__footer">
            <strong>문의 및 정정 요청</strong>
            <p>
              정책 내용에 대한 문의, 개인정보 열람·정정·삭제 요청, 접근성 정보 오류 제보는 고객센터를 통해 접수할 수
              있습니다.
            </p>
            <div>
              <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a>
              <a href="http://pf.kakao.com/_uxoQxbX" target="_blank" rel="noreferrer">
                카톡 상담채널
              </a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
