import { PageShell } from '../components/common/PageShell';

export function PrivacyPage() {
  return (
    <PageShell title="개인정보 처리방침" description="Bridgework가 개인정보를 처리하는 기준입니다.">
      <article className="policy-page">
        <section>
          <h2>수집하는 개인정보</h2>
          <p>
            Bridgework는 회원 식별, 구직 추천, 접근성 분석을 위해 이름, 연락처, 이메일, 거주지, 학력,
            경력, 희망 직무 등 이용자가 입력한 정보를 처리할 수 있습니다.
          </p>
        </section>
        <section>
          <h2>개인정보 이용 목적</h2>
          <p>
            수집한 정보는 회원 관리, 맞춤형 일자리 추천, 통근 및 접근성 분석, 서비스 개선과 문의 대응을
            위해 사용됩니다.
          </p>
        </section>
        <section>
          <h2>보유 및 이용 기간</h2>
          <p>
            개인정보는 서비스 제공에 필요한 기간 동안 보관하며, 이용자가 탈퇴하거나 삭제를 요청하면 관련
            법령에 따라 지체 없이 파기합니다.
          </p>
        </section>
        <section>
          <h2>이용자의 권리</h2>
          <p>
            이용자는 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있으며 Bridgework는 관련
            요청을 확인한 뒤 필요한 조치를 진행합니다.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
