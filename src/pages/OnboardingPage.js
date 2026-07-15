import { LoadingView } from '../components/common/LoadingView';
import { StatusMessage } from '../components/common/StatusMessage';
import { CompletionPanel, OptionStatePanel, StepContent, StepRail } from '../components/onboarding/OnboardingSteps';
import { ONBOARDING_STEPS as STEPS } from '../constants/onboarding';
import { ROUTE_PATHS } from '../config/routes';
import { useOnboardingController } from '../hooks/useOnboardingController';
import { getCompletionSummary } from '../utils/onboardingProfile';

export function OnboardingPage() {
  const {
    currentStep,
    form,
    formatValidationForm,
    formatValidationVisible,
    goNext,
    goPrevious,
    isComplete,
    localizePath,
    navigate,
    progressWidth,
    retryLoadOptions,
    showFormatValidation,
    signupOptions,
    submitError,
    submitting,
    toggleArrayValue,
    updateField
  } = useOnboardingController();

return (
    <main className="onboarding-page">
      {isComplete ? (
        <CompletionPanel
          summary={getCompletionSummary(form)}
          onBack={() => navigate(localizePath(ROUTE_PATHS.accessibilityMap))}
          onProfile={() => navigate(localizePath(ROUTE_PATHS.myProfile))}
        />
      ) : (
        <section className="onboarding-main" aria-labelledby="onboarding-title">
          <div className="onboarding-intro">
            <p className="onboarding-step-count">
              <strong>{currentStep}단계</strong> / {STEPS.length}단계
            </p>
            <h1 id="onboarding-title">기본 정보 입력</h1>
            <p>처음이신가요?  브릿지워크를 시작하기 위해 꼭 필요한 정보만 먼저 입력해요. 기본 프로필 생성 후 자세한 내용을 입력해 나가요.</p>
          </div>

          <div className="onboarding-progress" aria-label={`전체 ${STEPS.length}단계 중 ${currentStep}단계`}>
            <span style={{ width: progressWidth }} />
          </div>

          <div className="onboarding-workspace">
            <StepRail currentStep={currentStep} />
            <section className="onboarding-panel" aria-label={`${currentStep}단계 입력 영역`}>
              {signupOptions.status === 'idle' || signupOptions.status === 'loading' ? (
                <LoadingView label="회원가입 옵션을 불러오는 중입니다..." />
              ) : signupOptions.status === 'error' ? (
                <OptionStatePanel
                  title="회원가입 옵션을 불러오지 못했습니다."
                  message={signupOptions.error}
                  actionLabel="다시 시도"
                  onAction={retryLoadOptions}
                />
              ) : signupOptions.status === 'empty' ? (
                <OptionStatePanel
                  title="회원가입 옵션을 확인할 수 없습니다."
                  message="고용형태, 희망 직무 옵션을 다시 불러와 주세요."
                  actionLabel="다시 시도"
                  onAction={retryLoadOptions}
                />
              ) : (
                <StepContent
                  currentStep={currentStep}
                  form={form}
                  options={signupOptions}
                  formatValidationForm={formatValidationForm}
                  formatValidationVisible={formatValidationVisible}
                  updateField={updateField}
                  showFormatValidation={showFormatValidation}
                  toggleArrayValue={toggleArrayValue}
                />
              )}

              <StatusMessage kind="error">{submitError}</StatusMessage>

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-button onboarding-button--secondary"
                  onClick={goPrevious}
                  disabled={currentStep === 1 || submitting || signupOptions.status !== 'success'}
                >
                  이전
                </button>
                <button
                  type="button"
                  className="onboarding-button onboarding-button--primary"
                  onClick={goNext}
                  disabled={submitting || signupOptions.status !== 'success'}
                >
                  {currentStep === STEPS.length ? (submitting ? '가입 처리 중...' : '가입 완료') : '다음 단계'}
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
