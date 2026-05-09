import logoBig from '../assets/logo_big.png';

export function MainPage() {
  return (
    <main className="main-page" aria-labelledby="main-page-title">
      <img className="main-page__icon" src={logoBig} alt="" aria-hidden="true" />
      <h1 id="main-page-title">bridgework 메인화면입니다.</h1>
    </main>
  );
}
