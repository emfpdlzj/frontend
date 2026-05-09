import { PageShell } from '../components/common/PageShell';

export function TermsPage() {
  return (
    <PageShell title="이용약관" description="Bridgework 서비스 이용에 필요한 기본 약관입니다.">
      <article className="policy-page">
        <section>
          <h2>제1조 목적</h2>
          <p>
            본 약관은 Bridgework가 제공하는 구직 접근성 분석 및 추천 서비스의 이용 조건과 절차, 이용자와
            서비스의 권리와 의무를 정합니다.
          </p>
        </section>
        <section>
          <h2>제2조 서비스 이용</h2>
          <p>
            이용자는 소셜 로그인을 통해 서비스를 이용할 수 있으며, 최초 로그인 시 추천 제공에 필요한 기본
            프로필 입력 절차가 진행될 수 있습니다.
          </p>
        </section>
        <section>
          <h2>제3조 이용자의 의무</h2>
          <p>
            이용자는 정확한 정보를 입력해야 하며, 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위를
            해서는 안 됩니다.
          </p>
        </section>
        <section>
          <h2>제4조 서비스 변경</h2>
          <p>
            Bridgework는 서비스 품질 개선, 법령 준수, 운영상 필요에 따라 기능과 제공 범위를 변경할 수
            있습니다.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
