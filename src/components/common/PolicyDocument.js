import { Link } from 'react-router-dom';
import { POLICY_DOCUMENTS, getPolicyPath } from '../../config/policyDocuments';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';
import { LegalTranslationNotice } from './LegalTranslationNotice';

export function PolicyDocument({ policy }) {
  const { localizePath } = useLocale();

  return (
    <main className="policy-detail-page" aria-labelledby="policy-detail-title">
      <div className="policy-detail-page__layout">
        <aside className="policy-detail-page__side" aria-label="정책 문서 목록">
          <div className="policy-detail-page__side-heading">
            <span>Policy library</span>
            <strong>정책 문서</strong>
          </div>
          <Link className="policy-detail-page__back" to={localizePath(`${ROUTE_PATHS.settings}#policies`)}>
            <span aria-hidden="true">←</span>
            환경설정으로 돌아가기
          </Link>
          <nav aria-label="정책 문서 선택">
            {POLICY_DOCUMENTS.map((item) => (
              <Link
                key={item.id}
                className={`policy-detail-page__nav-link${item.id === policy.id ? ' is-active' : ''}`}
                to={localizePath(getPolicyPath(item.id))}
                aria-current={item.id === policy.id ? 'page' : undefined}
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

          <nav className="policy-detail-page__toc" aria-label={`${policy.title} 목차`}>
            <strong>이 문서의 내용</strong>
            <ol>
              {policy.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#policy-section-${index}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <LegalTranslationNotice />

          <div className="policy-detail-page__body" data-i18n-skip>
            {policy.sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`policy-section-${index}`}>
                <div className="policy-detail-page__section-heading">
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <h2 id={`policy-section-${index}`}>{section.title}</h2>
                </div>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <footer className="policy-detail-page__footer">
            <div className="policy-detail-page__footer-copy">
              <strong>문의 및 정정 요청</strong>
              <p>
                정책 내용에 대한 문의, 개인정보 열람·정정·삭제 요청, 접근성 정보 오류 제보는 고객센터를 통해 접수할 수
                있습니다.
              </p>
            </div>
            <div className="policy-detail-page__footer-actions">
              <a href="mailto:emfpdlzj@gmail.com">이메일 문의</a>
              <a href="http://pf.kakao.com/_uxoQxbX" target="_blank" rel="noreferrer">
                카톡 상담채널
                <span className="sr-only"> 새 창으로 열기</span>
              </a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
