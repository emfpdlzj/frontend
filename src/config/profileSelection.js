import { STORAGE_KEYS } from './appConfig';

const SELECTED_PROFILE_STORAGE_KEY = STORAGE_KEYS.selectedProfile;
const PROFILE_SCORING_UPDATED_STORAGE_KEY = 'bridgework:profile-scoring-updated-at';
export const PROFILE_SCORING_UPDATED_EVENT = 'bridgework:profile-scoring-updated';

const canUseSessionStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

export const readSelectedProfilePreference = () => {
  if (!canUseSessionStorage()) {
    return '';
  }

  try {
    return window.sessionStorage.getItem(SELECTED_PROFILE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const writeSelectedProfilePreference = (profileId) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const normalizedProfileId = String(profileId || '');

    if (normalizedProfileId) {
      window.sessionStorage.setItem(SELECTED_PROFILE_STORAGE_KEY, normalizedProfileId);
      return;
    }

    window.sessionStorage.removeItem(SELECTED_PROFILE_STORAGE_KEY);
  } catch {
    // 저장소 접근이 차단되어도 화면 내 선택 상태는 유지된다.
  }
};

export const notifyProfileScoringDataChanged = (profileId) => {
  if (!canUseSessionStorage()) {
    return;
  }

  const detail = {
    profileId: String(profileId || ''),
    updatedAt: Date.now()
  };

  try {
    window.sessionStorage.setItem(PROFILE_SCORING_UPDATED_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // 추천 재계산 알림 실패는 실제 프로필 저장을 막지 않는다.
  }

  try {
    window.dispatchEvent(new CustomEvent(PROFILE_SCORING_UPDATED_EVENT, { detail }));
  } catch {
    // 구형 브라우저의 이벤트 생성 실패는 무시한다.
  }
};
