import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignupCompletionForm } from '../components/auth/SignupCompletionForm';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAuth } from '../auth/AuthContext';

export function SignupPage() {
  const { pendingSignup, completeSignup, isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!pendingSignup?.signupToken) {
    return (
      <PageShell title="가입 세션이 만료되었습니다" description="다시 소셜 로그인을 진행해 주세요.">
        <StatusMessage kind="warning">소셜 로그인 단계가 없으면 가입을 완료할 수 없습니다.</StatusMessage>
      </PageShell>
    );
  }

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      await completeSignup({
        signupToken: pendingSignup.signupToken,
        ...form
      });
      navigate('/onboarding', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="추가 정보 입력"
      description="최초 로그인 사용자는 필수 정보를 입력해야 가입이 완료됩니다."
    >
      <SignupCompletionForm seed={pendingSignup} onSubmit={handleSubmit} submitting={submitting} />
    </PageShell>
  );
}
