const UNSUPPORTED_COMMUTE_DATA_SENTENCE =
  '다만 근무지 주변 이동·대중교통 통근 정보는 근거 데이터가 부족해서, 지원 전 확인이 필요해요.';

export function getRecommendationGradeFromScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return '';
  }
  if (score >= 80) {
    return 'A등급';
  }
  if (score >= 60) {
    return 'B등급';
  }
  return 'C등급';
}

function getGradeFromScoreText(scoreText) {
  const score = Number(scoreText);
  return getRecommendationGradeFromScore(score);
}

export function formatRecommendationExplanationText(text, fallbackScore) {
  if (!text) {
    return '';
  }

  const fallbackGrade = getRecommendationGradeFromScore(fallbackScore);

  return String(text)
    .replace(UNSUPPORTED_COMMUTE_DATA_SENTENCE, '')
    .replace(/\bGOOD\b/g, fallbackGrade || 'A등급')
    .replace(/\bWARNING\b/g, 'B등급')
    .replace(/\bCAUTION\b/g, 'B등급')
    .replace(/\bERROR\b/g, 'C등급')
    .replace(/\bRISK\b/g, 'C등급')
    .replace(/(종합 추천 점수\s*)(\d+)\s*점(?!\s*\((?:A등급|B등급|C등급)\))/g, (_match, prefix, scoreText) => {
      const grade = getGradeFromScoreText(scoreText) || fallbackGrade;
      return grade ? `${prefix}${scoreText}점(${grade})` : `${prefix}${scoreText}점`;
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function formatRecommendationExplanationList(items, fallbackScore) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => formatRecommendationExplanationText(item, fallbackScore))
    .filter(Boolean);
}
