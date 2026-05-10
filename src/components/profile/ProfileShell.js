import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import arrowDownIcon from '../../assets/profile/arrow-down.png';
import arrowUpWhiteIcon from '../../assets/profile/arrow_up_white.png';
import editIcon from '../../assets/profile/edit_icon.png';
import moreIcon from '../../assets/profile/more_icon.png';
import plusIcon from '../../assets/profile/plus_icon.png';
import { STORAGE_KEYS } from '../../config/appConfig';
import { useProfiles } from '../../hooks/useProfiles';
import { normalizeBirthDate } from '../../utils/birthDate';
import { formatPhoneNumber, getFieldFormatMessage } from '../../utils/formValidation';
import { LoadingView } from '../common/LoadingView';
import { StatusMessage } from '../common/StatusMessage';
import { ProfileSectionPanel } from './ProfileSectionPanel';

const sectionRows = [
  [
    { id: 'basic', label: '기본 정보' },
    { id: 'education', label: '학력 / 경력' },
    { id: 'job', label: '직무' },
    { id: 'disability', label: '장애' }
  ],
  [
    { id: 'work', label: '근무 조건' },
    { id: 'intro', label: '자기소개 및 지원 동기' },
    { id: 'extra', label: '기타 정보' }
  ]
];

const PROFILE_DRAFT_AUTOSAVE_DEBOUNCE_MS = 1000;
const PROFILE_DRAFT_AUTOSAVE_INTERVAL_MS = 60000;
const PROFILE_DRAFT_CACHE_TTL_MS = 5 * 60 * 1000;
const SAFE_PROFILE_DRAFT_FIELDS = [
  'desiredJob',
  'commuteRange',
  'preferredWorkEnvironments',
  'avoidedWorkEnvironments',
  'requiredSupports',
  'careerSummary',
  'educationSummary',
  'employmentTypeSummary',
  'highestEducation',
  'graduationStatus',
  'majorCareer',
  'targetJob',
  'skills',
  'certifications',
  'workAvailability',
  'workTypes',
  'expectedSalary',
  'workTimePreference',
  'remoteAvailableYn',
  'mobilityRange'
];

export function ProfileShell() {
  const {
    status,
    detailStatus,
    error,
    detailError,
    mutationMessage,
    profiles,
    selectedProfileId,
    selectedProfile,
    isMutating,
    selectProfile,
    reload,
    createProfile,
    updateProfile,
    setDefaultProfile,
    deleteProfile
  } = useProfiles();
  const [activeSection, setActiveSection] = useState('basic');
  const [draftProfile, setDraftProfile] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formError, setFormError] = useState('');
  const [formatValidationVisible, setFormatValidationVisible] = useState({});
  const [draftToast, setDraftToast] = useState(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState('');
  const [cachedDraftCards, setCachedDraftCards] = useState([]);
  const loadedDraftKeyRef = useRef('');
  const lastAutosavedSnapshotRef = useRef('');
  const autosaveDebounceRef = useRef(null);
  const activeRowIndex = sectionRows.findIndex((row) => row.some((section) => section.id === activeSection));
  const visibleTopRows = activeSection && activeRowIndex === 0 ? [sectionRows[0]] : sectionRows;
  const showBottomRow = activeSection && activeRowIndex === 0;
  const isInitialLoading = status === 'idle' || status === 'loading';
  const isEmpty = status === 'empty';
  const isUnavailable = status === 'disabled' || status === 'error';
  const visibleProfile = isCreateMode ? draftProfile : draftProfile || selectedProfile;
  const currentProfileTitle = isCreateMode
    ? '새 프로필'
    : visibleProfile?.fullName || visibleProfile?.targetJob || '프로필 상세';
  const hasDraftChanges = useMemo(
    () =>
      Boolean(
        visibleProfile &&
          selectedProfile &&
          JSON.stringify(draftProfile) !== JSON.stringify(toDraftProfile(selectedProfile))
      ),
    [draftProfile, selectedProfile, visibleProfile]
  );
  const hasAutosaveTarget = useMemo(() => {
    if (!draftProfile) {
      return false;
    }

    if (isCreateMode) {
      return JSON.stringify(draftProfile) !== JSON.stringify(createEmptyProfileDraft());
    }

    return Boolean(selectedProfile && JSON.stringify(draftProfile) !== JSON.stringify(toDraftProfile(selectedProfile)));
  }, [draftProfile, isCreateMode, selectedProfile]);
  const currentDraftStorageKey = useMemo(() => {
    if (isCreateMode) {
      return getProfileDraftStorageKey('create');
    }

    if (selectedProfile?.profileId) {
      return getProfileDraftStorageKey(selectedProfile.profileId);
    }

    return '';
  }, [isCreateMode, selectedProfile?.profileId]);
  const canDeleteProfile = Boolean(selectedProfile) && !isCreateMode && !selectedProfile.isDefault && profiles.length > 1 && !isMutating;

  const showDraftToast = useCallback((message, kind = 'info') => {
    setDraftToast({
      id: Date.now(),
      message,
      kind
    });
  }, []);

  const refreshCachedDraftCards = useCallback(() => {
    setCachedDraftCards(readProfileDraftSummaries());
  }, []);

  useEffect(() => {
    if (!draftToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDraftToast(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [draftToast]);

  useEffect(() => {
    if (!selectedProfile || isCreateMode) {
      return;
    }

    const storageKey = getProfileDraftStorageKey(selectedProfile.profileId);

    if (loadedDraftKeyRef.current === storageKey) {
      return;
    }

    const baseDraft = toDraftProfile(selectedProfile);
    const cachedDraft = readProfileDraftCache(storageKey);

    if (cachedDraft?.draft && JSON.stringify(cachedDraft.draft) !== JSON.stringify(baseDraft)) {
      setDraftProfile({
        ...baseDraft,
        ...cachedDraft.draft
      });
      setLastAutosavedAt(formatAutosaveTime(cachedDraft.savedAt));
      lastAutosavedSnapshotRef.current = JSON.stringify(cachedDraft.draft);
      showDraftToast('민감 정보를 제외한 임시저장 내용을 불러왔습니다.');
    } else {
      setDraftProfile(baseDraft);
      setLastAutosavedAt('');
      lastAutosavedSnapshotRef.current = JSON.stringify(baseDraft);
    }

    loadedDraftKeyRef.current = storageKey;
    setFormError('');
    setFormatValidationVisible({});
    refreshCachedDraftCards();
  }, [isCreateMode, refreshCachedDraftCards, selectedProfile, showDraftToast]);

  const saveDraftLocally = useCallback(
    (toastMessage = '작성 중인 내용이 임시저장되었습니다.') => {
      if (!draftProfile || !currentDraftStorageKey || !hasAutosaveTarget) {
        return false;
      }

      const snapshot = JSON.stringify(draftProfile);

      if (snapshot === lastAutosavedSnapshotRef.current) {
        return false;
      }

      const savedAt = Date.now();
      const safeDraft = toSafeProfileDraft(draftProfile);
      const saved = writeProfileDraftCache(currentDraftStorageKey, {
        mode: isCreateMode ? 'create' : 'edit',
        profileId: selectedProfile?.profileId || null,
        draft: safeDraft,
        savedAt
      });

      if (!saved) {
        showDraftToast('임시저장 공간을 사용할 수 없습니다. 브라우저 저장소 설정을 확인해 주세요.', 'error');
        return false;
      }

      lastAutosavedSnapshotRef.current = snapshot;
      setLastAutosavedAt(formatAutosaveTime(savedAt));
      refreshCachedDraftCards();
      showDraftToast(`${toastMessage} 민감 정보는 브라우저에 저장하지 않습니다.`, 'success');
      return true;
    },
    [currentDraftStorageKey, draftProfile, hasAutosaveTarget, isCreateMode, refreshCachedDraftCards, selectedProfile?.profileId, showDraftToast]
  );

  useEffect(() => {
    refreshCachedDraftCards();
  }, [refreshCachedDraftCards]);

  useEffect(() => {
    if (autosaveDebounceRef.current) {
      window.clearTimeout(autosaveDebounceRef.current);
    }

    if (!hasAutosaveTarget) {
      return undefined;
    }

    autosaveDebounceRef.current = window.setTimeout(() => {
      saveDraftLocally();
    }, PROFILE_DRAFT_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveDebounceRef.current) {
        window.clearTimeout(autosaveDebounceRef.current);
      }
    };
  }, [hasAutosaveTarget, saveDraftLocally]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      saveDraftLocally('최근 변경사항이 임시저장되었습니다.');
    }, PROFILE_DRAFT_AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [saveDraftLocally]);

  const handleTabClick = (sectionId) => {
    setActiveSection((current) => (current === sectionId ? '' : sectionId));
  };

  const handleSetDefault = async () => {
    if (!selectedProfile || selectedProfile.isDefault || isMutating) {
      return;
    }

    await setDefaultProfile(selectedProfile.profileId);
  };

  const handleAddProfile = () => {
    if (profiles.length >= 3) {
      setFormError('프로필은 최대 3개까지 등록할 수 있습니다.');
      return;
    }

    setIsCreateMode(true);
    const storageKey = getProfileDraftStorageKey('create');
    const cachedDraft = readProfileDraftCache(storageKey);

    if (cachedDraft?.draft) {
      setDraftProfile({
        ...createEmptyProfileDraft(),
        ...cachedDraft.draft
      });
      setLastAutosavedAt(formatAutosaveTime(cachedDraft.savedAt));
      lastAutosavedSnapshotRef.current = JSON.stringify(cachedDraft.draft);
      loadedDraftKeyRef.current = storageKey;
      showDraftToast('임시저장된 새 프로필을 불러왔습니다.');
    } else {
      const emptyDraft = createEmptyProfileDraft();

      setDraftProfile(emptyDraft);
      setLastAutosavedAt('');
      lastAutosavedSnapshotRef.current = JSON.stringify(emptyDraft);
      loadedDraftKeyRef.current = storageKey;
    }

    setActiveSection('basic');
    setFormError('');
    setFormatValidationVisible({});
    refreshCachedDraftCards();
  };

  const handleSelectProfile = (profileId) => {
    saveDraftLocally('작성 중인 내용이 임시저장되었습니다.');
    setIsCreateMode(false);
    setFormError('');
    setLastAutosavedAt('');
    loadedDraftKeyRef.current = '';
    lastAutosavedSnapshotRef.current = '';
    selectProfile(profileId);
    setFormatValidationVisible({});
  };

  const handleCancelCreate = () => {
    clearProfileDraftCache(getProfileDraftStorageKey('create'));
    setIsCreateMode(false);
    setDraftProfile(selectedProfile ? toDraftProfile(selectedProfile) : null);
    setLastAutosavedAt('');
    loadedDraftKeyRef.current = '';
    lastAutosavedSnapshotRef.current = selectedProfile ? JSON.stringify(toDraftProfile(selectedProfile)) : '';
    setFormError('');
    setFormatValidationVisible({});
  };

  const updateDraft = (field, value) => {
    setFormError('');
    const nextValue = field === 'contactPhone' ? formatPhoneNumber(value) : value;
    setDraftProfile((prev) => ({
      ...createEmptyProfileDraft(),
      ...prev,
      [field]: nextValue
    }));
  };

  const showFormatValidation = (field) => {
    setFormatValidationVisible((visible) => ({
      ...visible,
      [field]: true
    }));
  };

  const handleSave = async () => {
    if (!draftProfile || isMutating) {
      return;
    }

    const validationMessage = getValidationMessage(draftProfile);

    if (validationMessage) {
      setFormatValidationVisible({
        fullName: true,
        contactPhone: true,
        contactEmail: true,
        birthDate: true
      });
      setFormError(validationMessage);
      return;
    }

    const payload = toProfilePayload(draftProfile);
    const savedDraftSnapshot = JSON.stringify(draftProfile);

    try {
      if (isCreateMode) {
        const createDraftKey = getProfileDraftStorageKey('create');
        await createProfile(payload);
        clearProfileDraftCache(createDraftKey);
        refreshCachedDraftCards();
        setLastAutosavedAt('');
        loadedDraftKeyRef.current = '';
        lastAutosavedSnapshotRef.current = savedDraftSnapshot;
        setIsCreateMode(false);
        return;
      }

      const editDraftKey = getProfileDraftStorageKey(selectedProfile.profileId);
      await updateProfile(selectedProfile.profileId, payload);
      clearProfileDraftCache(editDraftKey);
      refreshCachedDraftCards();
      setLastAutosavedAt('');
      loadedDraftKeyRef.current = '';
      lastAutosavedSnapshotRef.current = savedDraftSnapshot;
    } catch (error) {
      setFormError(error.message || '프로필 저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!canDeleteProfile) {
      return;
    }

    const confirmed = window.confirm('선택한 프로필을 삭제할까요? 삭제한 프로필은 되돌릴 수 없습니다.');

    if (confirmed) {
      clearProfileDraftCache(getProfileDraftStorageKey(selectedProfile.profileId));
      refreshCachedDraftCards();
      await deleteProfile(selectedProfile.profileId);
      loadedDraftKeyRef.current = '';
      lastAutosavedSnapshotRef.current = '';
    }
  };

  return (
    <main className="profile-page">
      <div className="profile-layout">
        <aside className="profile-list-panel" aria-labelledby="profile-list-title">
          <div className="profile-list-panel__head">
            <h2 id="profile-list-title">내 프로필</h2>
            <button
              type="button"
              className="profile-add-button"
              disabled={isMutating || profiles.length >= 3}
              onClick={handleAddProfile}
            >
              <img src={plusIcon} alt="추가 아이콘" />
              프로필 추가
            </button>
          </div>

          {isInitialLoading ? <LoadingView label="프로필 목록을 불러오는 중입니다." /> : null}

          {isUnavailable ? (
            <div className="profile-status-block">
              <StatusMessage kind={status === 'disabled' ? 'info' : 'error'}>{error}</StatusMessage>
              {status === 'error' ? (
                <button type="button" className="profile-inline-action" onClick={reload}>
                  다시 시도
                </button>
              ) : null}
            </div>
          ) : null}

          {isEmpty ? (
            <StatusMessage kind="info">등록된 프로필이 없습니다. 회원가입 완료 후 기본 프로필이 생성됩니다.</StatusMessage>
          ) : null}

          {isCreateMode ? <DraftProfileCard profile={draftProfile} savedAt={Date.now()} /> : null}
          {!isCreateMode
            ? cachedDraftCards
                .filter((draft) => draft.profileId === 'create' || !profiles.some((profile) => String(profile.profileId) === String(draft.profileId)))
                .map((draft) => (
                  <DraftProfileCard
                    key={draft.storageKey}
                    profile={draft.draft}
                    savedAt={draft.savedAt}
                    onSelect={draft.profileId === 'create' ? handleAddProfile : undefined}
                  />
                ))
            : null}

          {profiles.map((profile) => (
            <ProfileCard
              key={profile.profileId}
              profile={profile}
              selected={!isCreateMode && String(profile.profileId) === String(selectedProfileId)}
              onSelect={handleSelectProfile}
              hasDraft={cachedDraftCards.some((draft) => String(draft.profileId) === String(profile.profileId))}
            />
          ))}

          <ul className="profile-list-note">
            <li>프로필은 최대 3개까지 등록할 수 있습니다.</li>
            <li>기본 프로필은 삭제할 수 없습니다.</li>
          </ul>
        </aside>

        <section className="profile-workspace" aria-labelledby="profile-title">
          <button type="button" className="profile-delete-button" disabled={!canDeleteProfile} onClick={handleDelete}>
            프로필 삭제
          </button>

          <header className="profile-heading">
            <div>
              <h1 id="profile-title">
                {currentProfileTitle}
                <button type="button" aria-label="프로필 이름 수정" className="profile-edit-button" onClick={() => setActiveSection('basic')}>
                  <img src={editIcon} alt="수정 아이콘" />
                </button>
              </h1>
              <label className="profile-default-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(selectedProfile?.isDefault) && !isCreateMode}
                  disabled={!selectedProfile || isCreateMode || selectedProfile.isDefault || isMutating}
                  onChange={handleSetDefault}
                />
                <span aria-hidden="true" />
                기본 프로필로 설정
              </label>
            </div>
          </header>

          <div className="profile-form-area">
            {mutationMessage ? (
              <StatusMessage kind={mutationMessage.includes('실패') ? 'error' : 'success'}>{mutationMessage}</StatusMessage>
            ) : null}
            {formError ? <StatusMessage kind="error">{formError}</StatusMessage> : null}
            {lastAutosavedAt ? (
              <p className="profile-autosave-note" aria-live="polite">
                임시저장됨 {lastAutosavedAt}
              </p>
            ) : null}

            {detailStatus === 'loading' ? <LoadingView label="프로필 상세 정보를 불러오는 중입니다." /> : null}

            {detailStatus === 'error' ? (
              <div className="profile-status-block">
                <StatusMessage kind="error">{detailError}</StatusMessage>
                <button type="button" className="profile-inline-action" onClick={reload}>
                  다시 시도
                </button>
              </div>
            ) : null}

            {(isCreateMode || (detailStatus === 'success' && visibleProfile)) ? (
              <>
                <div className="profile-form-actions">
                  {isCreateMode ? (
                    <button type="button" className="profile-secondary-action" onClick={handleCancelCreate} disabled={isMutating}>
                      취소
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="profile-primary-action"
                    onClick={handleSave}
                    disabled={isMutating || (!isCreateMode && !hasDraftChanges)}
                  >
                    {isMutating ? '저장 중...' : isCreateMode ? '프로필 추가 완료' : '변경사항 저장'}
                  </button>
                </div>
                <ProfileTabs rows={visibleTopRows} activeSection={activeSection} onTabClick={handleTabClick} />
                <ProfileSectionPanel
                  activeSection={activeSection}
                  profile={visibleProfile}
                  onChange={updateDraft}
                  validationErrors={getVisibleValidationErrors(visibleProfile, formatValidationVisible)}
                  onFieldBlur={showFormatValidation}
                />
                {showBottomRow ? (
                  <ProfileTabs rows={[sectionRows[1]]} activeSection={activeSection} onTabClick={handleTabClick} compact />
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </div>
      {draftToast ? (
        <div className={`profile-toast profile-toast--${draftToast.kind}`} role="status" aria-live="polite">
          {draftToast.message}
        </div>
      ) : null}
    </main>
  );
}

const requiredFields = [
  ['fullName', '이름'],
  ['contactPhone', '연락처'],
  ['contactEmail', '이메일'],
  ['birthDate', '생년월일'],
  ['genderType', '성별'],
  ['residenceRegion', '거주 지역'],
  ['detailAddress', '상세 주소'],
  ['highestEducation', '최종 학력'],
  ['graduationStatus', '졸업 상태'],
  ['majorCareer', '주요 경력'],
  ['targetJob', '지원 직무'],
  ['disabilityType', '장애 유형'],
  ['disabilitySeverity', '장애 정도'],
  ['workAvailability', '근무 가능 시점'],
  ['selfIntroduction', '자기소개']
];

function createEmptyProfileDraft() {
  return {
    desiredJob: '',
    commuteRange: '',
    preferredWorkEnvironments: [],
    avoidedWorkEnvironments: [],
    requiredSupports: [],
    disabilityType: '',
    careerSummary: '',
    educationSummary: '',
    employmentTypeSummary: '',
    fullName: '',
    contactPhone: '',
    contactEmail: '',
    birthDate: '',
    genderType: '',
    ageGroup: '',
    residenceRegion: '',
    detailAddress: '',
    emergencyContact: '',
    highestEducation: '',
    graduationStatus: '',
    majorCareer: '',
    careerDetail: '',
    projectExperience: '',
    careerGapReason: '',
    targetJob: '',
    skills: [],
    certifications: [],
    portfolioUrl: '',
    awards: '',
    trainings: '',
    disabilitySeverity: '',
    disabilityRegisteredYn: null,
    disabilityDescription: '',
    assistiveDevices: '',
    workSupportRequirements: '',
    workAvailability: '',
    workTypes: [],
    expectedSalary: '',
    workTimePreference: '',
    remoteAvailableYn: null,
    mobilityRange: '',
    selfIntroduction: '',
    motivation: '',
    jobFitDescription: '',
    careerGoal: '',
    strengthsWeaknesses: '',
    militaryService: '',
    patrioticVeteranYn: null,
    referrer: '',
    snsUrl: ''
  };
}

function toDraftProfile(profile) {
  return {
    ...createEmptyProfileDraft(),
    ...profile,
    preferredWorkEnvironments: profile?.preferredWorkEnvironments || [],
    avoidedWorkEnvironments: profile?.avoidedWorkEnvironments || [],
    requiredSupports: profile?.requiredSupports || [],
    skills: profile?.skills || [],
    certifications: profile?.certifications || [],
    workTypes: profile?.workTypes || [],
    disabilityRegisteredYn:
      typeof profile?.disabilityRegisteredYn === 'boolean' ? profile.disabilityRegisteredYn : null,
    remoteAvailableYn: typeof profile?.remoteAvailableYn === 'boolean' ? profile.remoteAvailableYn : null,
    patrioticVeteranYn: typeof profile?.patrioticVeteranYn === 'boolean' ? profile.patrioticVeteranYn : null
  };
}

function trimValue(value) {
  return String(value ?? '').trim();
}

function compactPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null || value === undefined || value === '') {
        return false;
      }

      return !(Array.isArray(value) && value.length === 0);
    })
  );
}

function toProfilePayload(profile) {
  const payload = {
    ...profile,
    desiredJob: trimValue(profile.desiredJob) || trimValue(profile.targetJob),
    careerSummary: trimValue(profile.careerSummary) || trimValue(profile.majorCareer),
    educationSummary: trimValue(profile.educationSummary) || trimValue(profile.highestEducation),
    employmentTypeSummary: trimValue(profile.employmentTypeSummary) || profile.workTypes.join(', '),
    fullName: trimValue(profile.fullName),
    contactPhone: trimValue(profile.contactPhone),
    contactEmail: trimValue(profile.contactEmail),
    birthDate: normalizeBirthDate(profile.birthDate),
    genderType: trimValue(profile.genderType),
    residenceRegion: trimValue(profile.residenceRegion),
    detailAddress: trimValue(profile.detailAddress),
    highestEducation: trimValue(profile.highestEducation),
    graduationStatus: trimValue(profile.graduationStatus),
    majorCareer: trimValue(profile.majorCareer),
    targetJob: trimValue(profile.targetJob),
    disabilityType: trimValue(profile.disabilityType),
    disabilitySeverity: trimValue(profile.disabilitySeverity),
    disabilityRegisteredYn: Boolean(profile.disabilityRegisteredYn),
    workAvailability: trimValue(profile.workAvailability),
    workTypes: profile.workTypes,
    selfIntroduction: trimValue(profile.selfIntroduction)
  };

  delete payload.profileId;
  delete payload.userId;
  delete payload.isDefault;
  delete payload.aiJobTags;
  delete payload.aiEnvironmentTags;
  delete payload.aiSupportTags;
  delete payload.profileImageUrl;
  delete payload.updatedAt;

  return compactPayload(payload);
}

function getProfileDraftStorageKey(profileId) {
  return `${STORAGE_KEYS.profileDraftAutosave}:${profileId}`;
}

function toSafeProfileDraft(profile) {
  return Object.fromEntries(
    SAFE_PROFILE_DRAFT_FIELDS
      .filter((field) => Object.prototype.hasOwnProperty.call(profile || {}, field))
      .map((field) => [field, profile[field]])
  );
}

function readProfileDraftCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }

  try {
    const rawCache = window.sessionStorage.getItem(storageKey);

    if (!rawCache) {
      return null;
    }

    const parsed = JSON.parse(rawCache);

    if (!parsed?.draft || !parsed?.savedAt) {
      return null;
    }

    if (Date.now() - parsed.savedAt > PROFILE_DRAFT_CACHE_TTL_MS) {
      clearProfileDraftCache(storageKey);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function readProfileDraftSummaries() {
  if (typeof window === 'undefined') {
    return [];
  }

  const prefix = `${STORAGE_KEYS.profileDraftAutosave}:`;
  const summaries = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index);

    if (!storageKey?.startsWith(prefix)) {
      continue;
    }

    const cached = readProfileDraftCache(storageKey);

    if (!cached?.draft) {
      continue;
    }

    summaries.push({
      storageKey,
      profileId: storageKey.slice(prefix.length),
      draft: cached.draft,
      savedAt: cached.savedAt
    });
  }

  return summaries.sort((a, b) => b.savedAt - a.savedAt);
}

function writeProfileDraftCache(storageKey, value) {
  if (!storageKey || typeof window === 'undefined') {
    return false;
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        ...value
      })
    );
    return true;
  } catch {
    return false;
  }
}

function clearProfileDraftCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // 로컬 임시저장 정리 실패는 실제 프로필 저장 흐름을 막지 않습니다.
  }
}

function hasText(value) {
  return trimValue(value).length > 0;
}

const profileFormatFields = [
  ['fullName', 'name'],
  ['contactPhone', 'phone'],
  ['contactEmail', 'email'],
  ['birthDate', 'birthDate']
];

function getProfileFormatMessage(profile) {
  const invalidField = profileFormatFields.find(([profileField, formatField]) => getFieldFormatMessage(formatField, profile[profileField]));
  return invalidField ? getFieldFormatMessage(invalidField[1], profile[invalidField[0]]) : '';
}

function getVisibleValidationErrors(profile, visible) {
  if (!profile) {
    return {};
  }

  return Object.fromEntries(
    profileFormatFields
      .filter(([profileField]) => visible[profileField])
      .map(([profileField, formatField]) => [profileField, getFieldFormatMessage(formatField, profile[profileField])])
      .filter(([, message]) => message)
  );
}

function getValidationMessage(profile) {
  const missing = requiredFields.find(([field]) => !hasText(profile[field]));

  if (missing) {
    return `${missing[1]} 항목을 입력해 주세요.`;
  }

  const formatMessage = getProfileFormatMessage(profile);

  if (formatMessage) {
    return formatMessage;
  }

  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    return '보유 기술/역량을 1개 이상 입력해 주세요.';
  }

  if (!Array.isArray(profile.workTypes) || profile.workTypes.length === 0) {
    return '근무 형태 가능 범위를 1개 이상 선택해 주세요.';
  }

  if (typeof profile.disabilityRegisteredYn !== 'boolean') {
    return '장애 등록 여부를 선택해 주세요.';
  }

  return '';
}

function ProfileCard({ profile, selected = false, hasDraft = false, onSelect }) {
  const title = profile.fullName || profile.targetJob || `프로필 ${profile.profileId}`;
  const updatedAtText = formatDate(profile.updatedAt);

  return (
    <button
      type="button"
      className={`profile-card profile-card--button${selected ? ' is-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect(profile.profileId)}
    >
      {profile.isDefault ? <span className="profile-card__badge">기본</span> : null}
      {hasDraft ? <span className="profile-card__draft-label">임시저장 있음</span> : null}
      <div>
        <h3>{title}</h3>
        <p>{hasDraft ? '5분 이내 임시저장 내용 있음' : updatedAtText ? `최종 수정일 ${updatedAtText}` : '최종 수정일 확인 필요'}</p>
      </div>
      <span className="profile-card__more" aria-hidden="true">
        <img src={moreIcon} alt="더보기 아이콘" />
      </span>
    </button>
  );
}

function DraftProfileCard({ profile, savedAt, onSelect }) {
  const title = profile?.fullName?.trim() || profile?.targetJob?.trim() || '현재 작성중';
  const savedAtText = formatAutosaveTime(savedAt);
  const content = (
    <>
      <span className="profile-card__badge profile-card__badge--draft">작성 중</span>
      <div>
        <h3>{title}</h3>
        <p>{savedAtText ? `임시저장됨 ${savedAtText}` : '저장 전 임시 프로필'}</p>
      </div>
      <span className="profile-card__draft-dot" aria-hidden="true" />
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className="profile-card profile-card--draft profile-card--draft-button" onClick={onSelect}>
        {content}
      </button>
    );
  }

  return (
    <article className="profile-card profile-card--draft is-selected" aria-current="true">
      {content}
    </article>
  );
}

function ProfileTabs({ rows, activeSection, onTabClick, compact = false }) {
  return (
    <div className={`profile-tabs${compact ? ' profile-tabs--compact' : ''}`} aria-label="프로필 입력 섹션">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="profile-tabs__row">
          {row.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                className={`profile-tabs__button${active ? ' is-active' : ''}`}
                onClick={() => onTabClick(section.id)}
                aria-expanded={active}
              >
                <span>{section.label}</span>
                <img
                  className="profile-tabs__chevron"
                  src={active ? arrowUpWhiteIcon : arrowDownIcon}
                  alt={active ? '접기 아이콘' : '펼치기 아이콘'}
                />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatAutosaveTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}
