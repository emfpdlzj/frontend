import {
  createEmptyProfileDraft,
  getProfileDraftStorageKey,
  readProfileDraftCache,
  toSafeProfileDraft,
  writeProfileDraftCache
} from './profileDraft';

beforeEach(() => {
  window.sessionStorage.clear();
});

test('excludes personal and sensitive information from browser autosave drafts', () => {
  const draft = {
    ...createEmptyProfileDraft(),
    fullName: '홍길동',
    detailAddress: '서울시 강남구',
    disabilityType: 'PHYSICAL',
    requiredSupports: ['휠체어 접근'],
    workSupportRequirements: '엘리베이터 필요',
    targetJob: '사무보조',
    skills: ['엑셀']
  };

  expect(toSafeProfileDraft(draft)).toEqual(
    expect.objectContaining({
      targetJob: '사무보조',
      skills: ['엑셀']
    })
  );
  expect(toSafeProfileDraft(draft)).not.toHaveProperty('fullName');
  expect(toSafeProfileDraft(draft)).not.toHaveProperty('detailAddress');
  expect(toSafeProfileDraft(draft)).not.toHaveProperty('disabilityType');
  expect(toSafeProfileDraft(draft)).not.toHaveProperty('requiredSupports');
  expect(toSafeProfileDraft(draft)).not.toHaveProperty('workSupportRequirements');
});

test('sanitizes legacy and newly written browser draft caches', () => {
  const storageKey = getProfileDraftStorageKey('legacy-profile');
  const savedAt = Date.now();
  window.sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      version: 1,
      savedAt,
      draft: {
        targetJob: '사무보조',
        requiredSupports: ['휠체어 접근'],
        disabilityDescription: '이동 지원 필요'
      }
    })
  );

  expect(readProfileDraftCache(storageKey)).toEqual(
    expect.objectContaining({
      version: 2,
      draft: { targetJob: '사무보조' }
    })
  );

  writeProfileDraftCache(storageKey, {
    savedAt,
    draft: {
      skills: ['엑셀'],
      requiredSupports: ['높이 조절 책상']
    }
  });

  expect(JSON.parse(window.sessionStorage.getItem(storageKey))).toEqual(
    expect.objectContaining({
      version: 2,
      draft: { skills: ['엑셀'] }
    })
  );
});
