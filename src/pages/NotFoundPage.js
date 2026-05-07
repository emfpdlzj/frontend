import logoBig from '../assets/logo_big.png';

export function NotFoundPage() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-page__content">
        <img className="not-found-page__logo" src={logoBig} alt="BridgeWork" />
        <h1 id="not-found-title">페이지를 찾을 수 없습니다.</h1>

        <div className="not-found-page__support" aria-label="문의 안내">
          <p>문제가 생겼나요?</p>
          <p>언제나 신속하게 해결하는 브릿지워크가 되겠습니다.</p>
          <p>
            문의 메일 :{' '}
            <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a>
          </p>
          <a
            className="not-found-page__kakao-button"
            href="http://pf.kakao.com/_uxoQxbX"
            target="_blank"
            rel="noreferrer"
            aria-label="카톡 상담채널 새 창으로 열기"
          >
            카톡 상담채널
          </a>
        </div>
      </section>
    </main>
  );
}
