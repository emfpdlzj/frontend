export function LlmExplanationProgress({
  title = '추천 설명을 생성하고 있습니다',
  description = '공고 정보와 프로필 조건을 함께 확인하는 중입니다.',
  className = ''
}) {
  return (
    <div className={`llm-explanation-progress ${className}`.trim()} role="status" aria-live="polite">
      <div className="llm-explanation-progress__header">
        <span className="loading-spinner" aria-hidden="true" />
        <strong>{title}</strong>
      </div>
      <p>{description}</p>
      <div
        className="llm-explanation-progress__bar"
        role="progressbar"
        aria-label="추천 설명 생성 진행 중"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span aria-hidden="true" />
      </div>
    </div>
  );
}
