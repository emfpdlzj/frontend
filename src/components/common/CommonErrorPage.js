import logoBig from '../../assets/logo_big.png';

const ERROR_PAGE_CONTENT = {
  403: {
    title: '접근 권한이 없습니다.',
    description: '이 화면을 이용할 권한이 있는 계정으로 다시 로그인해 주세요.'
  },
  404: {
    title: '페이지를 찾을 수 없습니다.',
    description: '주소가 바뀌었거나 삭제된 페이지일 수 있습니다.'
  },
  500: {
    title: '일시적인 오류가 발생했습니다.',
    description: '잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.'
  }
};

export function CommonErrorPage({ status = 500, title, description, actionHref = '/', actionLabel = '홈으로 이동' }) {
  const content = ERROR_PAGE_CONTENT[status] || ERROR_PAGE_CONTENT[500];

  return (
    <main className="common-error-page" aria-labelledby="common-error-title">
      <section className="common-error-page__content">
        <img className="common-error-page__logo" src={logoBig} alt="BridgeWork" />
        <p className="common-error-page__status">{status}</p>
        <h1 id="common-error-title">{title || content.title}</h1>
        <p className="common-error-page__description">{description || content.description}</p>

        <div className="common-error-page__support" aria-label="문의 안내">
          <p>문의 메일 : <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a></p>
          <a
            className="common-error-page__kakao-button"
            href="http://pf.kakao.com/_uxoQxbX"
            target="_blank"
            rel="noreferrer"
            aria-label="카톡 상담채널 새 창으로 열기"
          >
            카톡 상담채널
          </a>
        </div>

        <a className="common-error-page__home-button" href={actionHref}>
          {actionLabel}
        </a>
      </section>
    </main>
  );
}
