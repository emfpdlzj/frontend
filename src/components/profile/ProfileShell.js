import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import arrowDownIcon from '../../assets/profile/arrow-down.png';
import arrowUpWhiteIcon from '../../assets/profile/arrow_up_white.png';
import plusIcon from '../../assets/profile/plus_icon.png';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../auth/AuthContext';
import { STORAGE_KEYS } from '../../config/appConfig';
import { FILE_UPLOAD_POLICY } from '../../config/securityPolicy';
import { useProfiles } from '../../hooks/useProfiles';
import { normalizeBirthDate } from '../../utils/birthDate';
import { validateFileUpload } from '../../utils/fileValidation';
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
const MAX_PORTFOLIO_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PORTFOLIO_PDF_SIZE_LABEL = '10MB';
const PROFILE_LEAVE_CONFIRM_MESSAGE = '작성 중인 프로필 정보가 있습니다. 저장하지 않고 나가시겠습니까?';
const DEFAULT_MAJOR_CAREER = '신입';
const HIGHEST_EDUCATION_LABEL_MAP = {
  HIGH_SCHOOL_OR_BELOW: '고졸 이하',
  HIGH_SCHOOL: '고졸',
  COLLEGE: '전문대졸',
  BACHELOR: '대졸',
  MASTER: '석사',
  DOCTOR: '박사',
  OTHER: '기타'
};
const STRUCTURED_EDUCATION_LABEL_MAP = {
  HIGH_SCHOOL: '고등학교',
  COLLEGE_2_3: '전문대(2,3년제)',
  COLLEGE_4: '대학교(4년제)',
  MASTER: '대학원(석사)',
  DOCTOR: '대학원(박사)',
  BOOTCAMP: '부트캠프',
  OTHER: '기타'
};
const STRUCTURED_GRADUATION_STATUS_LABEL_MAP = {
  GRADUATED: '졸업',
  EXPECTED: '졸업예정',
  ENROLLED: '재학',
  COMPLETED: '수료',
  DROPPED_OUT: '중퇴',
  OTHER: '기타'
};
const STRUCTURED_PROJECT_TYPE_LABEL_MAP = {
  COMPANY_PROJECT: '실무 프로젝트',
  BOOTCAMP: '부트캠프',
  FREELANCE: '외주·프리랜서',
  HACKATHON: '해커톤',
  CONTEST: '공모전',
  CLUB: '동아리',
  VOLUNTEER: '봉사활동',
  PERSONAL: '개인 프로젝트',
  OTHER: '기타'
};
const STRUCTURED_EDUCATION_TO_HIGHEST_EDUCATION_MAP = {
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  COLLEGE_2_3: 'COLLEGE',
  COLLEGE_4: 'BACHELOR',
  MASTER: 'MASTER',
  DOCTOR: 'DOCTOR',
  BOOTCAMP: 'OTHER',
  OTHER: 'OTHER'
};
const LEGACY_TO_STRUCTURED_EDUCATION_MAP = {
  HIGH_SCHOOL_OR_BELOW: 'HIGH_SCHOOL',
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  COLLEGE: 'COLLEGE_2_3',
  BACHELOR: 'COLLEGE_4',
  MASTER: 'MASTER',
  DOCTOR: 'DOCTOR',
  OTHER: 'OTHER'
};
const STRUCTURED_GRADUATION_TO_PROFILE_MAP = {
  GRADUATED: 'GRADUATED',
  EXPECTED: 'EXPECTED',
  ENROLLED: 'ENROLLED',
  COMPLETED: 'COMPLETED',
  DROPPED_OUT: 'DROPPED_OUT',
  OTHER: 'OTHER'
};
const EDUCATION_PRIORITY_MAP = {
  HIGH_SCHOOL: 1,
  COLLEGE_2_3: 2,
  COLLEGE_4: 3,
  MASTER: 4,
  DOCTOR: 5,
  BOOTCAMP: 0,
  OTHER: 0
};
let structuredEntrySequence = 0;
const SAFE_PROFILE_DRAFT_FIELDS = [
  'desiredJob',
  'commuteRange',
  'preferredWorkEnvironments',
  'avoidedWorkEnvironments',
  'requiredSupports',
  'sensitiveInfoConsentYn',
  'educationEntries',
  'careerEntries',
  'projectEntries',
  'certificationEntries',
  'languageEntries',
  'portfolioEntries',
  'awardEntries',
  'trainingEntries',
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
  'remoteAvailableYn'
];

function useProfileLeavePrompt(shouldPrompt) {
  const { navigator } = useContext(NavigationContext);

  useEffect(() => {
    if (!shouldPrompt || typeof navigator.block !== 'function') {
      return undefined;
    }

    const unblock = navigator.block((transition) => {
      if (!window.confirm(PROFILE_LEAVE_CONFIRM_MESSAGE)) {
        return;
      }

      unblock();
      transition.retry();
    });

    return unblock;
  }, [navigator, shouldPrompt]);

  useEffect(() => {
    if (!shouldPrompt) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldPrompt]);
}

export function ProfileShell() {
  const { callWithAuth } = useAuth();
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState('');
  const [formatValidationVisible, setFormatValidationVisible] = useState({});
  const [draftToast, setDraftToast] = useState(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState('');
  const [cachedDraftCards, setCachedDraftCards] = useState([]);
  const [isExtractingPortfolio, setIsExtractingPortfolio] = useState(false);
  const [isPortfolioConfirmOpen, setIsPortfolioConfirmOpen] = useState(false);
  const [isEditCancelConfirmOpen, setIsEditCancelConfirmOpen] = useState(false);
  const loadedDraftKeyRef = useRef('');
  const lastAutosavedSnapshotRef = useRef('');
  const autosaveDebounceRef = useRef(null);
  const portfolioFileInputRef = useRef(null);
  const activeRowIndex = sectionRows.findIndex((row) => row.some((section) => section.id === activeSection));
  const visibleTopRows = activeSection && activeRowIndex === 0 ? [sectionRows[0]] : sectionRows;
  const showBottomRow = activeSection && activeRowIndex === 0;
  const isInitialLoading = status === 'idle' || status === 'loading';
  const isEmpty = status === 'empty';
  const isUnavailable = status === 'disabled' || status === 'error';
  const visibleProfile = isCreateMode ? draftProfile : draftProfile || selectedProfile;
  const currentProfileTitle = isCreateMode ? '프로필 추가' : isEditMode ? '프로필 수정' : '프로필 상세';
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
  const selectedProfileSummary = useMemo(
    () => profiles.find((profile) => String(profile.profileId) === String(selectedProfileId)) || null,
    [profiles, selectedProfileId]
  );
  const selectedProfileForToggle = isCreateMode ? null : selectedProfile || selectedProfileSummary;
  const isDefaultProfileSelected = Boolean(selectedProfileForToggle?.isDefault);
  const canDeleteProfile = Boolean(selectedProfile) && !isCreateMode && !selectedProfile.isDefault && profiles.length > 1 && !isMutating;
  const isReadOnlyMode = !isCreateMode && !isEditMode;
  const shouldPromptBeforeLeavingProfile = (isCreateMode || isEditMode) && hasAutosaveTarget && !isMutating;

  useProfileLeavePrompt(shouldPromptBeforeLeavingProfile);

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
      setDraftProfile(normalizeStructuredProfileDraft({
        ...baseDraft,
        ...cachedDraft.draft
      }));
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

  useEffect(() => {
    if (!isExtractingPortfolio) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExtractingPortfolio]);

  const handleTabClick = (sectionId) => {
    setActiveSection((current) => (current === sectionId ? '' : sectionId));
  };

  const handleSetDefault = async () => {
    const targetProfile = selectedProfileForToggle;

    if (!targetProfile || targetProfile.isDefault || isMutating || isExtractingPortfolio) {
      return;
    }

    await setDefaultProfile(targetProfile.profileId);
  };

  const handleAddProfile = () => {
    if (profiles.length >= 3) {
      setFormError('프로필은 최대 3개까지 등록할 수 있습니다.');
      return;
    }

    setIsCreateMode(true);
    setIsEditMode(true);
    const storageKey = getProfileDraftStorageKey('create');
    const cachedDraft = readProfileDraftCache(storageKey);

    if (cachedDraft?.draft) {
      setDraftProfile(normalizeStructuredProfileDraft({
        ...createEmptyProfileDraft(),
        ...cachedDraft.draft
      }));
      setLastAutosavedAt(formatAutosaveTime(cachedDraft.savedAt));
      lastAutosavedSnapshotRef.current = JSON.stringify(cachedDraft.draft);
      loadedDraftKeyRef.current = storageKey;
      showDraftToast('임시저장된 새 프로필을 불러왔습니다.');
    } else {
      const emptyDraft = normalizeStructuredProfileDraft(createEmptyProfileDraft());

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
    setIsEditMode(false);
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
    setIsEditMode(false);
    setDraftProfile(selectedProfile ? toDraftProfile(selectedProfile) : null);
    setLastAutosavedAt('');
    loadedDraftKeyRef.current = '';
    lastAutosavedSnapshotRef.current = selectedProfile ? JSON.stringify(toDraftProfile(selectedProfile)) : '';
    setFormError('');
    setFormatValidationVisible({});
  };

  const handleEditCancelClick = () => {
    if (isCreateMode || isReadOnlyMode || isMutating || isExtractingPortfolio) {
      return;
    }

    setIsEditCancelConfirmOpen(true);
  };

  const handleEditCancelDismiss = () => {
    setIsEditCancelConfirmOpen(false);
  };

  const handleEditCancelConfirm = () => {
    if (!selectedProfile) {
      setIsEditCancelConfirmOpen(false);
      setIsEditMode(false);
      return;
    }

    const storageKey = getProfileDraftStorageKey(selectedProfile.profileId);
    const baseDraft = toDraftProfile(selectedProfile);

    clearProfileDraftCache(storageKey);
    refreshCachedDraftCards();
    setDraftProfile(baseDraft);
    setLastAutosavedAt('');
    loadedDraftKeyRef.current = storageKey;
    lastAutosavedSnapshotRef.current = JSON.stringify(baseDraft);
    setFormError('');
    setFormatValidationVisible({});
    setIsEditMode(false);
    setIsEditCancelConfirmOpen(false);
  };

  const updateDraft = (field, value) => {
    if (!isCreateMode && !isEditMode) {
      return;
    }
    setFormError('');
    const nextValue = field === 'contactPhone' ? formatPhoneNumber(value) : value;
    setDraftProfile((prev) =>
      normalizeStructuredProfileDraft({
        ...createEmptyProfileDraft(),
        ...prev,
        [field]: nextValue
      })
    );
  };

  const showFormatValidation = (field) => {
    setFormatValidationVisible((visible) => ({
      ...visible,
      [field]: true
    }));
  };

  const handleSave = async () => {
    if (!isCreateMode && !isEditMode) {
      setIsEditMode(true);
      return;
    }

    if (!draftProfile || isMutating || isExtractingPortfolio) {
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
        setIsEditMode(false);
        return;
      }

      const editDraftKey = getProfileDraftStorageKey(selectedProfile.profileId);
      await updateProfile(selectedProfile.profileId, payload);
      clearProfileDraftCache(editDraftKey);
      refreshCachedDraftCards();
      setLastAutosavedAt('');
      loadedDraftKeyRef.current = '';
      lastAutosavedSnapshotRef.current = savedDraftSnapshot;
      setIsEditMode(false);
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

  const handlePortfolioExtractClick = () => {
    if (!draftProfile || isMutating || isExtractingPortfolio) {
      return;
    }

    setIsPortfolioConfirmOpen(true);
  };

  const handlePortfolioExtractCancel = () => {
    setIsPortfolioConfirmOpen(false);
  };

  const handlePortfolioExtractConfirm = () => {
    setIsPortfolioConfirmOpen(false);

    if (!portfolioFileInputRef.current) {
      setFormError('파일 업로드 입력을 초기화하지 못했습니다. 화면을 새로고침 후 다시 시도해 주세요.');
      return;
    }

    portfolioFileInputRef.current.value = '';
    portfolioFileInputRef.current.click();
  };

  const handlePortfolioFileSelected = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const fileValidation = validateFileUpload(selectedFile, FILE_UPLOAD_POLICY.portfolioPdf);

    if (!fileValidation.ok) {
      setFormError(fileValidation.reason);
      return;
    }

    if (selectedFile.size > MAX_PORTFOLIO_PDF_SIZE_BYTES) {
      setFormError(`PDF 파일 크기는 ${MAX_PORTFOLIO_PDF_SIZE_LABEL} 이하만 업로드할 수 있습니다.`);
      return;
    }

    setFormError('');
    setIsExtractingPortfolio(true);

    try {
      const result = await callWithAuth((accessToken) =>
        profileApi.extractProfileDraftFromPortfolio(accessToken, selectedFile)
      );
      const extractedDraft = toExtractedDraft(result?.draft);

      if (!extractedDraft) {
        throw new Error('포트폴리오에서 프로필 정보를 추출하지 못했습니다.');
      }

      setDraftProfile((prev) =>
        normalizeStructuredProfileDraft({
          ...createEmptyProfileDraft(),
          profileId: prev?.profileId,
          userId: prev?.userId,
          isDefault: prev?.isDefault,
          updatedAt: prev?.updatedAt,
          ...extractedDraft
        })
      );

      setIsEditMode(true);
      setFormatValidationVisible({});
      showDraftToast('PDF 분석 결과를 반영했습니다. 저장 버튼을 누르면 서버에 반영됩니다.', 'success');
    } catch (error) {
      if (error?.status === 413 || error?.errorCode === 'FILE_TOO_LARGE') {
        setFormError(`PDF 파일 크기는 ${MAX_PORTFOLIO_PDF_SIZE_LABEL} 이하만 업로드할 수 있습니다.`);
        return;
      }
      setFormError(error.message || '포트폴리오 분석에 실패했습니다.');
    } finally {
      setIsExtractingPortfolio(false);
      if (portfolioFileInputRef.current) {
        portfolioFileInputRef.current.value = '';
      }
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
          <input
            ref={portfolioFileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="profile-file-input-hidden"
            onChange={handlePortfolioFileSelected}
          />
          <div className="profile-top-actions">
            {(isCreateMode || (detailStatus === 'success' && visibleProfile)) ? (
              <div className="profile-top-portfolio-group">
                <button
                  type="button"
                  className="profile-secondary-action profile-top-portfolio-button"
                  onClick={handlePortfolioExtractClick}
                  disabled={isMutating || isExtractingPortfolio || (!isCreateMode && detailStatus !== 'success')}
                >
                  {isExtractingPortfolio ? 'PDF 분석 중...' : '내 포트폴리오 pdf 파일로 생성하기'}
                </button>
                <p className="profile-top-portfolio-note">업로드 가능: PDF, 최대 {MAX_PORTFOLIO_PDF_SIZE_LABEL}</p>
              </div>
            ) : null}
            {!isCreateMode && isReadOnlyMode ? (
              <button
                type="button"
                className="profile-primary-action profile-top-edit-button"
                onClick={() => {
                  setFormError('');
                  setIsEditMode(true);
                }}
                disabled={isMutating || isExtractingPortfolio || detailStatus !== 'success'}
              >
                수정하기
              </button>
            ) : null}
            <button type="button" className="profile-delete-button" disabled={!canDeleteProfile} onClick={handleDelete}>
              프로필 삭제
            </button>
          </div>

          <header className="profile-heading">
            <div>
              <h1 id="profile-title">
                {currentProfileTitle}
              </h1>
              {(isCreateMode || (detailStatus === 'success' && visibleProfile)) ? (
                <div className="profile-title-name-field">
                  <label htmlFor="profile-name-title-input" className="profile-title-name-field__label">
                    프로필 이름
                    <em aria-label="필수">*</em>
                  </label>
                  <span className="profile-input-wrap">
                    <input
                      id="profile-name-title-input"
                      className="profile-input"
                      value={visibleProfile?.profileName || ''}
                      onChange={(event) => updateDraft('profileName', event.target.value)}
                      placeholder="예) 기본 생성 프로필, 나의 프로필"
                      disabled={isReadOnlyMode}
                      aria-required="true"
                    />
                  </span>
                </div>
              ) : null}
              <label className="profile-default-toggle">
                <input
                  type="checkbox"
                  checked={isDefaultProfileSelected}
                  disabled={!selectedProfileForToggle || isCreateMode || isDefaultProfileSelected || isMutating || isExtractingPortfolio}
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
                    <>
                      <button
                        type="button"
                        className="profile-secondary-action"
                        onClick={handleCancelCreate}
                        disabled={isMutating || isExtractingPortfolio}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="profile-primary-action"
                        onClick={handleSave}
                        disabled={isMutating || isExtractingPortfolio}
                      >
                        {isMutating ? '저장 중...' : '프로필 추가 완료'}
                      </button>
                    </>
                  ) : (
                    <>
                      {!isReadOnlyMode ? (
                        <>
                          <button
                            type="button"
                            className="profile-secondary-action"
                            onClick={handleEditCancelClick}
                            disabled={isMutating || isExtractingPortfolio}
                          >
                            수정 취소
                          </button>
                          <button
                            type="button"
                            className="profile-primary-action"
                            onClick={handleSave}
                            disabled={isMutating || isExtractingPortfolio || !hasDraftChanges}
                          >
                            {isMutating ? '저장 중...' : '변경사항 저장'}
                          </button>
                        </>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="profile-form-meta">
                  <div className="profile-form-meta__left">
                    {lastAutosavedAt ? (
                      <p className="profile-autosave-note" aria-live="polite">
                        임시저장됨 {lastAutosavedAt}
                      </p>
                    ) : null}
                  </div>
                  <p className="profile-required-note">
                    <em aria-hidden="true">*</em> 필수 입력 정보입니다
                  </p>
                </div>
                <ProfileTabs rows={visibleTopRows} activeSection={activeSection} onTabClick={handleTabClick} />
                <ProfileSectionPanel
                  activeSection={activeSection}
                  profile={visibleProfile}
                  onChange={updateDraft}
                  validationErrors={getVisibleValidationErrors(visibleProfile, formatValidationVisible)}
                  onFieldBlur={showFormatValidation}
                  isReadOnly={isReadOnlyMode}
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
      {isPortfolioConfirmOpen ? (
        <div className="profile-confirm-backdrop" role="presentation">
          <div className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-confirm-title">
            <h2 id="profile-confirm-title">포트폴리오로 프로필 생성</h2>
            <p>이미 입력된 값들도 새로 덮어쓰기 됩니다. 진행하시겠습니까?</p>
            <div className="profile-confirm-actions">
              <button type="button" className="profile-secondary-action" onClick={handlePortfolioExtractCancel}>
                아니오
              </button>
              <button type="button" className="profile-primary-action" onClick={handlePortfolioExtractConfirm}>
                예
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isEditCancelConfirmOpen ? (
        <div className="profile-confirm-backdrop" role="presentation">
          <div className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-cancel-title">
            <h2 id="profile-edit-cancel-title">수정을 취소할까요?</h2>
            <p>
              {hasDraftChanges
                ? '저장하지 않은 변경사항은 사라집니다. 상세 보기로 돌아가시겠습니까?'
                : '수정을 취소하고 상세 보기로 돌아가시겠습니까?'}
            </p>
            <div className="profile-confirm-actions">
              <button type="button" className="profile-primary-action" onClick={handleEditCancelDismiss}>
                계속 수정
              </button>
              <button type="button" className="profile-secondary-action" onClick={handleEditCancelConfirm}>
                수정 취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isExtractingPortfolio ? (
        <div className="profile-loading-backdrop" role="presentation">
          <div className="profile-loading-modal" role="dialog" aria-modal="true" aria-labelledby="profile-loading-title">
            <div className="loading-spinner" aria-hidden="true" />
            <h2 id="profile-loading-title">PDF 분석 중입니다</h2>
            <p>분석이 끝날 때까지 잠시만 기다려 주세요.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const requiredFields = [
  ['profileName', '프로필 이름'],
  ['fullName', '이름'],
  ['contactPhone', '연락처'],
  ['contactEmail', '이메일'],
  ['birthDate', '생년월일'],
  ['genderType', '성별'],
  ['detailAddress', '상세 주소'],
  ['highestEducation', '최종 학력'],
  ['graduationStatus', '졸업 상태'],
  ['majorCareer', '주요 경력'],
  ['targetJob', '지원 직무'],
  ['disabilityType', '장애 유형'],
  ['disabilitySeverity', '장애 정도'],
  ['selfIntroduction', '자기소개']
];

function createStructuredEntryId(prefix) {
  structuredEntrySequence += 1;
  return `${prefix}-${structuredEntrySequence}`;
}

function createEducationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('education'),
    schoolType: '',
    schoolName: '',
    admissionYear: '',
    graduationYear: '',
    graduationStatus: '',
    ...entry
  };
}

function createCareerEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('career'),
    companyName: '',
    departmentName: '',
    startYearMonth: '',
    endYearMonth: '',
    responsibilities: '',
    ...entry
  };
}

function createProjectEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('project'),
    projectType: '',
    projectName: '',
    startYearMonth: '',
    endYearMonth: '',
    projectDescription: '',
    ...entry
  };
}

function createCertificationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('certification'),
    issuer: '',
    certificationName: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createLanguageEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('language'),
    languageName: '',
    testName: '',
    scoreOrGrade: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createPortfolioEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('portfolio'),
    portfolioType: '',
    title: '',
    url: '',
    ...entry
  };
}

function createAwardEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('award'),
    awardName: '',
    awardingOrganization: '',
    awardYear: '',
    awardDescription: '',
    ...entry
  };
}

function createTrainingEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('training'),
    trainingType: '',
    trainingName: '',
    institutionName: '',
    startYearMonth: '',
    endYearMonth: '',
    trainingDescription: '',
    ...entry
  };
}

function ensureStructuredEntries(entries, entryFactory) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => entryFactory(entry || {}));
}

function limitText(value, maxLength) {
  const normalized = trimValue(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength);
}

function joinSegments(segments, separator = ' · ') {
  return segments.map((segment) => trimValue(segment)).filter(Boolean).join(separator);
}

function formatStructuredPeriod(start, end) {
  const startText = trimValue(start);
  const endText = trimValue(end);

  if (startText && endText) {
    return `${startText} - ${endText}`;
  }

  if (startText) {
    return `${startText} -`;
  }

  return endText ? `- ${endText}` : '';
}

function stripClientId(entry) {
  const { clientId: _clientId, ...rest } = entry || {};
  return rest;
}

function sanitizeEducationEntries(entries) {
  return ensureStructuredEntries(entries, createEducationEntry)
    .map((entry) => ({
      schoolType: trimValue(entry.schoolType),
      schoolName: trimValue(entry.schoolName),
      admissionYear: trimValue(entry.admissionYear),
      graduationYear: trimValue(entry.graduationYear),
      graduationStatus: trimValue(entry.graduationStatus)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeCareerEntries(entries) {
  return ensureStructuredEntries(entries, createCareerEntry)
    .map((entry) => ({
      companyName: trimValue(entry.companyName),
      departmentName: trimValue(entry.departmentName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      responsibilities: trimValue(entry.responsibilities)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeProjectEntries(entries) {
  return ensureStructuredEntries(entries, createProjectEntry)
    .map((entry) => ({
      projectType: trimValue(entry.projectType),
      projectName: trimValue(entry.projectName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      projectDescription: trimValue(entry.projectDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeCertificationEntries(entries) {
  return ensureStructuredEntries(entries, createCertificationEntry)
    .map((entry) => ({
      issuer: trimValue(entry.issuer),
      certificationName: trimValue(entry.certificationName),
      acquiredYearMonth: trimValue(entry.acquiredYearMonth)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeLanguageEntries(entries) {
  return ensureStructuredEntries(entries, createLanguageEntry)
    .map((entry) => ({
      languageName: trimValue(entry.languageName),
      testName: trimValue(entry.testName),
      scoreOrGrade: trimValue(entry.scoreOrGrade),
      acquiredYearMonth: trimValue(entry.acquiredYearMonth)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizePortfolioEntries(entries) {
  return ensureStructuredEntries(entries, createPortfolioEntry)
    .map((entry) => ({
      portfolioType: trimValue(entry.portfolioType),
      title: trimValue(entry.title),
      url: trimValue(entry.url)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeAwardEntries(entries) {
  return ensureStructuredEntries(entries, createAwardEntry)
    .map((entry) => ({
      awardName: trimValue(entry.awardName),
      awardingOrganization: trimValue(entry.awardingOrganization),
      awardYear: trimValue(entry.awardYear),
      awardDescription: trimValue(entry.awardDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeTrainingEntries(entries) {
  return ensureStructuredEntries(entries, createTrainingEntry)
    .map((entry) => ({
      trainingType: trimValue(entry.trainingType),
      trainingName: trimValue(entry.trainingName),
      institutionName: trimValue(entry.institutionName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      trainingDescription: trimValue(entry.trainingDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function deriveEducationEntries(profile) {
  const entries = ensureStructuredEntries(profile?.educationEntries, createEducationEntry);
  if (entries.length > 0) {
    return entries;
  }

  const highestEducation = trimValue(profile?.highestEducation);
  const graduationStatus = trimValue(profile?.graduationStatus);
  const educationSummary = trimValue(profile?.educationSummary);

  if (!highestEducation && !graduationStatus && !educationSummary) {
    return [];
  }

  return [
    createEducationEntry({
      schoolType: LEGACY_TO_STRUCTURED_EDUCATION_MAP[highestEducation] || '',
      schoolName: '',
      admissionYear: '',
      graduationYear: '',
      graduationStatus: graduationStatus || ''
    })
  ];
}

function deriveCareerEntries(profile) {
  const entries = ensureStructuredEntries(profile?.careerEntries, createCareerEntry);
  if (entries.length > 0) {
    return entries;
  }

  const majorCareer = trimValue(profile?.majorCareer);
  const careerSummary = trimValue(profile?.careerSummary);
  const careerDetail = trimValue(profile?.careerDetail);

  if (!majorCareer && !careerSummary && !careerDetail) {
    return [];
  }

  return [
    createCareerEntry({
      companyName: majorCareer,
      departmentName: '',
      startYearMonth: '',
      endYearMonth: '',
      responsibilities: careerDetail || careerSummary
    })
  ];
}

function deriveProjectEntries(profile) {
  const entries = ensureStructuredEntries(profile?.projectEntries, createProjectEntry);
  if (entries.length > 0) {
    return entries;
  }

  const projectExperience = trimValue(profile?.projectExperience);

  if (!projectExperience) {
    return [];
  }

  return [
    createProjectEntry({
      projectType: 'OTHER',
      projectName: '프로젝트 경험',
      startYearMonth: '',
      endYearMonth: '',
      projectDescription: projectExperience
    })
  ];
}

function deriveCertificationEntries(profile) {
  const entries = ensureStructuredEntries(profile?.certificationEntries, createCertificationEntry);
  if (entries.length > 0) {
    return entries;
  }

  const certifications = toStringArray(profile?.certifications);
  if (certifications.length === 0) {
    return [];
  }

  return certifications.map((certificationName) =>
    createCertificationEntry({
      issuer: '',
      certificationName,
      acquiredYearMonth: ''
    })
  );
}

function deriveLanguageEntries(profile) {
  return ensureStructuredEntries(profile?.languageEntries, createLanguageEntry);
}

function derivePortfolioEntries(profile) {
  const entries = ensureStructuredEntries(profile?.portfolioEntries, createPortfolioEntry);
  if (entries.length > 0) {
    return entries;
  }

  const portfolioUrl = trimValue(profile?.portfolioUrl);
  if (!portfolioUrl) {
    return [];
  }

  return [
    createPortfolioEntry({
      portfolioType: '',
      title: '',
      url: portfolioUrl
    })
  ];
}

function deriveAwardEntries(profile) {
  const entries = ensureStructuredEntries(profile?.awardEntries, createAwardEntry);
  if (entries.length > 0) {
    return entries;
  }

  const awards = trimValue(profile?.awards);
  if (!awards) {
    return [];
  }

  return [
    createAwardEntry({
      awardName: '',
      awardingOrganization: '',
      awardYear: '',
      awardDescription: awards
    })
  ];
}

function deriveTrainingEntries(profile) {
  const entries = ensureStructuredEntries(profile?.trainingEntries, createTrainingEntry);
  if (entries.length > 0) {
    return entries;
  }

  const trainings = trimValue(profile?.trainings);
  if (!trainings) {
    return [];
  }

  return [
    createTrainingEntry({
      trainingType: '',
      trainingName: '',
      institutionName: '',
      startYearMonth: '',
      endYearMonth: '',
      trainingDescription: trainings
    })
  ];
}

function hasSensitiveDisabilityContent(profile) {
  return [
    profile?.disabilityDescription,
    profile?.assistiveDevices,
    profile?.workSupportRequirements
  ].some((value) => trimValue(value).length > 0) || toStringArray(profile?.requiredSupports).length > 0;
}

function deriveEducationFields(profile, educationEntries) {
  const fallbackHighestEducation = trimValue(profile?.highestEducation);
  const fallbackGraduationStatus = trimValue(profile?.graduationStatus);
  const fallbackEducationSummary = normalizeEducationSummary(trimValue(profile?.educationSummary), fallbackHighestEducation);

  if (educationEntries.length === 0) {
    return {
      highestEducation: fallbackHighestEducation,
      graduationStatus: fallbackGraduationStatus,
      educationSummary: fallbackEducationSummary
    };
  }

  const representativeEntry = [...educationEntries].sort(
    (left, right) => (EDUCATION_PRIORITY_MAP[right.schoolType] || 0) - (EDUCATION_PRIORITY_MAP[left.schoolType] || 0)
  )[0];
  const highestEducation = STRUCTURED_EDUCATION_TO_HIGHEST_EDUCATION_MAP[representativeEntry.schoolType] || fallbackHighestEducation;
  const graduationStatus = STRUCTURED_GRADUATION_TO_PROFILE_MAP[representativeEntry.graduationStatus] || fallbackGraduationStatus;
  const educationSummary = limitText(
    educationEntries
      .map((entry) =>
        joinSegments([
          trimValue(entry.schoolName) || STRUCTURED_EDUCATION_LABEL_MAP[entry.schoolType],
          STRUCTURED_EDUCATION_LABEL_MAP[entry.schoolType],
          formatStructuredPeriod(entry.admissionYear, entry.graduationYear),
          STRUCTURED_GRADUATION_STATUS_LABEL_MAP[entry.graduationStatus]
        ])
      )
      .filter(Boolean)
      .join('\n'),
    500
  );

  return {
    highestEducation,
    graduationStatus,
    educationSummary: educationSummary || fallbackEducationSummary
  };
}

function deriveCareerFields(profile, careerEntries) {
  const fallbackMajorCareer = trimValue(profile?.majorCareer);
  const fallbackCareerSummary = trimValue(profile?.careerSummary) || fallbackMajorCareer;
  const fallbackCareerDetail = trimValue(profile?.careerDetail);

  if (careerEntries.length === 0) {
    const majorCareer = fallbackMajorCareer || DEFAULT_MAJOR_CAREER;
    return {
      majorCareer,
      careerSummary: fallbackCareerSummary || majorCareer,
      careerDetail: fallbackCareerDetail
    };
  }

  const representativeEntry = careerEntries[0];
  const majorCareer = limitText(
    joinSegments([
      representativeEntry.companyName,
      representativeEntry.departmentName,
      formatStructuredPeriod(representativeEntry.startYearMonth, representativeEntry.endYearMonth)
    ]),
    500
  );
  const careerSummary = limitText(
    careerEntries
      .map((entry) =>
        joinSegments([
          entry.companyName,
          entry.departmentName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth)
        ])
      )
      .filter(Boolean)
      .join('\n'),
    500
  );
  const careerDetail = careerEntries
    .map((entry) => joinSegments([entry.companyName, entry.responsibilities], ': '))
    .filter(Boolean)
    .join('\n\n');

  return {
    majorCareer: majorCareer || fallbackMajorCareer || DEFAULT_MAJOR_CAREER,
    careerSummary: careerSummary || fallbackCareerSummary || DEFAULT_MAJOR_CAREER,
    careerDetail: careerDetail || fallbackCareerDetail
  };
}

function deriveProjectFields(profile, projectEntries) {
  const fallbackProjectExperience = trimValue(profile?.projectExperience);

  if (projectEntries.length === 0) {
    return {
      projectExperience: fallbackProjectExperience
    };
  }

  return {
    projectExperience: projectEntries
      .map((entry) =>
        joinSegments([
          STRUCTURED_PROJECT_TYPE_LABEL_MAP[entry.projectType],
          entry.projectName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth),
          entry.projectDescription
        ])
      )
      .filter(Boolean)
      .join('\n\n')
  };
}

function deriveJobExtraFields(profile, certificationEntries, portfolioEntries, awardEntries, trainingEntries) {
  const fallbackCertifications = toStringArray(profile?.certifications);
  const fallbackPortfolioUrl = trimValue(profile?.portfolioUrl);
  const fallbackAwards = trimValue(profile?.awards);
  const fallbackTrainings = trimValue(profile?.trainings);

  const certifications = certificationEntries.length
    ? certificationEntries.map((entry) => entry.certificationName).filter(Boolean)
    : fallbackCertifications;

  const primaryPortfolio = portfolioEntries.find((entry) => trimValue(entry.url));
  const portfolioUrl = primaryPortfolio?.url || fallbackPortfolioUrl;
  const awards = awardEntries.length
    ? awardEntries
      .map((entry) =>
        joinSegments([
          entry.awardName,
          entry.awardingOrganization,
          entry.awardYear
        ])
      )
      .concat(awardEntries.map((entry) => trimValue(entry.awardDescription)).filter(Boolean))
      .filter(Boolean)
      .join('\n')
    : fallbackAwards;
  const trainings = trainingEntries.length
    ? trainingEntries
      .map((entry) =>
        joinSegments([
          entry.trainingType,
          entry.trainingName,
          entry.institutionName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth)
        ])
      )
      .concat(trainingEntries.map((entry) => trimValue(entry.trainingDescription)).filter(Boolean))
      .filter(Boolean)
      .join('\n')
    : fallbackTrainings;

  return {
    certifications,
    portfolioUrl,
    awards,
    trainings
  };
}

function normalizeStructuredProfileDraft(profile) {
  const nextProfile = {
    ...createEmptyProfileDraft(),
    ...profile
  };
  const educationEntries = deriveEducationEntries(nextProfile);
  const careerEntries = deriveCareerEntries(nextProfile);
  const projectEntries = deriveProjectEntries(nextProfile);
  const certificationEntries = deriveCertificationEntries(nextProfile);
  const languageEntries = deriveLanguageEntries(nextProfile);
  const portfolioEntries = derivePortfolioEntries(nextProfile);
  const awardEntries = deriveAwardEntries(nextProfile);
  const trainingEntries = deriveTrainingEntries(nextProfile);
  const educationFields = deriveEducationFields(nextProfile, sanitizeEducationEntries(educationEntries));
  const careerFields = deriveCareerFields(nextProfile, sanitizeCareerEntries(careerEntries));
  const projectFields = deriveProjectFields(nextProfile, sanitizeProjectEntries(projectEntries));
  const jobExtraFields = deriveJobExtraFields(
    nextProfile,
    sanitizeCertificationEntries(certificationEntries),
    sanitizePortfolioEntries(portfolioEntries),
    sanitizeAwardEntries(awardEntries),
    sanitizeTrainingEntries(trainingEntries)
  );

  return {
    ...nextProfile,
    educationEntries,
    careerEntries,
    projectEntries,
    certificationEntries,
    languageEntries,
    portfolioEntries,
    awardEntries,
    trainingEntries,
    sensitiveInfoConsentYn:
      typeof nextProfile.sensitiveInfoConsentYn === 'boolean'
        ? nextProfile.sensitiveInfoConsentYn
        : hasSensitiveDisabilityContent(nextProfile),
    ...educationFields,
    ...careerFields,
    ...projectFields,
    ...jobExtraFields
  };
}

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
    profileName: '',
    fullName: '',
    contactPhone: '',
    contactEmail: '',
    birthDate: '',
    genderType: '',
    ageGroup: '',
    detailAddress: '',
    emergencyContact: '',
    highestEducation: '',
    graduationStatus: '',
    educationEntries: [],
    majorCareer: '',
    careerEntries: [],
    careerDetail: '',
    projectEntries: [],
    projectExperience: '',
    careerGapReason: '',
    targetJob: '',
    skills: [],
    certificationEntries: [],
    certifications: [],
    languageEntries: [],
    portfolioEntries: [],
    portfolioUrl: '',
    awardEntries: [],
    awards: '',
    trainingEntries: [],
    trainings: '',
    disabilitySeverity: '',
    disabilityRegisteredYn: null,
    sensitiveInfoConsentYn: false,
    disabilityDescription: '',
    assistiveDevices: '',
    workSupportRequirements: '',
    workAvailability: '',
    workTypes: [],
    expectedSalary: '',
    workTimePreference: '',
    remoteAvailableYn: null,
    selfIntroduction: '',
    motivation: '',
    jobFitDescription: '',
    careerGoal: '',
    strengthsWeaknesses: '',
    militaryService: '',
    patrioticVeteranYn: null,
    snsUrl: ''
  };
}

function toDraftProfile(profile) {
  const { referrer: _referrer, ...profileWithoutReferrer } = profile || {};

  return normalizeStructuredProfileDraft({
    ...createEmptyProfileDraft(),
    ...profileWithoutReferrer,
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
  });
}

function toTextOrEmpty(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function toBooleanOrNull(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

function toExtractedDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return null;
  }

  return normalizeStructuredProfileDraft({
    desiredJob: toTextOrEmpty(draft.desiredJob),
    commuteRange: toTextOrEmpty(draft.commuteRange),
    preferredWorkEnvironments: toStringArray(draft.preferredWorkEnvironments),
    avoidedWorkEnvironments: toStringArray(draft.avoidedWorkEnvironments),
    requiredSupports: toStringArray(draft.requiredSupports),
    disabilityType: toTextOrEmpty(draft.disabilityType),
    careerSummary: toTextOrEmpty(draft.careerSummary),
    educationSummary: normalizeEducationSummary(toTextOrEmpty(draft.educationSummary), toTextOrEmpty(draft.highestEducation)),
    employmentTypeSummary: toTextOrEmpty(draft.employmentTypeSummary),
    profileName: toTextOrEmpty(draft.profileName),
    fullName: toTextOrEmpty(draft.fullName),
    contactPhone: toTextOrEmpty(draft.contactPhone),
    contactEmail: toTextOrEmpty(draft.contactEmail),
    birthDate: toTextOrEmpty(draft.birthDate),
    genderType: toTextOrEmpty(draft.genderType),
    ageGroup: toTextOrEmpty(draft.ageGroup),
    detailAddress: toTextOrEmpty(draft.detailAddress),
    emergencyContact: toTextOrEmpty(draft.emergencyContact),
    highestEducation: toTextOrEmpty(draft.highestEducation),
    graduationStatus: toTextOrEmpty(draft.graduationStatus),
    educationEntries: Array.isArray(draft.educationEntries) ? draft.educationEntries.map((entry) => stripClientId(createEducationEntry(entry))) : [],
    majorCareer: toTextOrEmpty(draft.majorCareer),
    careerEntries: Array.isArray(draft.careerEntries) ? draft.careerEntries.map((entry) => stripClientId(createCareerEntry(entry))) : [],
    careerDetail: toTextOrEmpty(draft.careerDetail),
    projectEntries: Array.isArray(draft.projectEntries) ? draft.projectEntries.map((entry) => stripClientId(createProjectEntry(entry))) : [],
    projectExperience: toTextOrEmpty(draft.projectExperience),
    careerGapReason: toTextOrEmpty(draft.careerGapReason),
    targetJob: toTextOrEmpty(draft.targetJob),
    skills: toStringArray(draft.skills),
    certificationEntries: Array.isArray(draft.certificationEntries)
      ? draft.certificationEntries.map((entry) => stripClientId(createCertificationEntry(entry)))
      : [],
    certifications: toStringArray(draft.certifications),
    languageEntries: Array.isArray(draft.languageEntries)
      ? draft.languageEntries.map((entry) => stripClientId(createLanguageEntry(entry)))
      : [],
    portfolioEntries: Array.isArray(draft.portfolioEntries)
      ? draft.portfolioEntries.map((entry) => stripClientId(createPortfolioEntry(entry)))
      : [],
    portfolioUrl: toTextOrEmpty(draft.portfolioUrl),
    awardEntries: Array.isArray(draft.awardEntries)
      ? draft.awardEntries.map((entry) => stripClientId(createAwardEntry(entry)))
      : [],
    awards: toTextOrEmpty(draft.awards),
    trainingEntries: Array.isArray(draft.trainingEntries)
      ? draft.trainingEntries.map((entry) => stripClientId(createTrainingEntry(entry)))
      : [],
    trainings: toTextOrEmpty(draft.trainings),
    disabilitySeverity: toTextOrEmpty(draft.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(draft.disabilityRegisteredYn),
    sensitiveInfoConsentYn: typeof draft.sensitiveInfoConsentYn === 'boolean' ? draft.sensitiveInfoConsentYn : false,
    disabilityDescription: toTextOrEmpty(draft.disabilityDescription),
    assistiveDevices: toTextOrEmpty(draft.assistiveDevices),
    workSupportRequirements: toTextOrEmpty(draft.workSupportRequirements),
    workAvailability: toTextOrEmpty(draft.workAvailability),
    workTypes: toStringArray(draft.workTypes),
    expectedSalary: toTextOrEmpty(draft.expectedSalary),
    workTimePreference: toTextOrEmpty(draft.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(draft.remoteAvailableYn),
    selfIntroduction: toTextOrEmpty(draft.selfIntroduction),
    motivation: toTextOrEmpty(draft.motivation),
    jobFitDescription: toTextOrEmpty(draft.jobFitDescription),
    careerGoal: toTextOrEmpty(draft.careerGoal),
    strengthsWeaknesses: toTextOrEmpty(draft.strengthsWeaknesses),
    militaryService: toTextOrEmpty(draft.militaryService),
    patrioticVeteranYn: toBooleanOrNull(draft.patrioticVeteranYn),
    snsUrl: toTextOrEmpty(draft.snsUrl)
  });
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
  const normalizedProfile = normalizeStructuredProfileDraft(profile);
  const educationEntries = sanitizeEducationEntries(normalizedProfile.educationEntries);
  const careerEntries = sanitizeCareerEntries(normalizedProfile.careerEntries);
  const projectEntries = sanitizeProjectEntries(normalizedProfile.projectEntries);
  const certificationEntries = sanitizeCertificationEntries(normalizedProfile.certificationEntries);
  const languageEntries = sanitizeLanguageEntries(normalizedProfile.languageEntries);
  const portfolioEntries = sanitizePortfolioEntries(normalizedProfile.portfolioEntries);
  const awardEntries = sanitizeAwardEntries(normalizedProfile.awardEntries);
  const trainingEntries = sanitizeTrainingEntries(normalizedProfile.trainingEntries);
  const payload = {
    profileName: trimValue(normalizedProfile.profileName),
    desiredJob: trimValue(normalizedProfile.desiredJob) || trimValue(normalizedProfile.targetJob),
    commuteRange: trimValue(normalizedProfile.commuteRange),
    preferredWorkEnvironments: toStringArray(normalizedProfile.preferredWorkEnvironments),
    avoidedWorkEnvironments: toStringArray(normalizedProfile.avoidedWorkEnvironments),
    requiredSupports: toStringArray(normalizedProfile.requiredSupports),
    disabilityType: trimValue(normalizedProfile.disabilityType),
    careerSummary: trimValue(normalizedProfile.careerSummary) || trimValue(normalizedProfile.majorCareer),
    educationSummary: normalizeEducationSummary(trimValue(normalizedProfile.educationSummary), trimValue(normalizedProfile.highestEducation)),
    employmentTypeSummary: trimValue(normalizedProfile.employmentTypeSummary) || normalizedProfile.workTypes.join(', '),
    fullName: trimValue(normalizedProfile.fullName),
    contactPhone: trimValue(normalizedProfile.contactPhone),
    contactEmail: trimValue(normalizedProfile.contactEmail),
    birthDate: normalizeBirthDate(normalizedProfile.birthDate),
    genderType: trimValue(normalizedProfile.genderType),
    ageGroup: trimValue(normalizedProfile.ageGroup),
    detailAddress: trimValue(normalizedProfile.detailAddress),
    emergencyContact: trimValue(normalizedProfile.emergencyContact),
    highestEducation: trimValue(normalizedProfile.highestEducation),
    graduationStatus: trimValue(normalizedProfile.graduationStatus),
    educationEntries,
    majorCareer: trimValue(normalizedProfile.majorCareer),
    careerEntries,
    careerDetail: trimValue(normalizedProfile.careerDetail),
    projectEntries,
    projectExperience: trimValue(normalizedProfile.projectExperience),
    careerGapReason: trimValue(normalizedProfile.careerGapReason),
    targetJob: trimValue(normalizedProfile.targetJob),
    skills: toStringArray(normalizedProfile.skills),
    certificationEntries,
    certifications: toStringArray(normalizedProfile.certifications),
    languageEntries,
    portfolioEntries,
    portfolioUrl: trimValue(normalizedProfile.portfolioUrl),
    awardEntries,
    awards: trimValue(normalizedProfile.awards),
    trainingEntries,
    trainings: trimValue(normalizedProfile.trainings),
    disabilitySeverity: trimValue(normalizedProfile.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(normalizedProfile.disabilityRegisteredYn),
    sensitiveInfoConsentYn: normalizedProfile.sensitiveInfoConsentYn === true,
    disabilityDescription: trimValue(normalizedProfile.disabilityDescription),
    assistiveDevices: trimValue(normalizedProfile.assistiveDevices),
    workSupportRequirements: trimValue(normalizedProfile.workSupportRequirements),
    workAvailability: trimValue(normalizedProfile.workAvailability),
    workTypes: toStringArray(normalizedProfile.workTypes),
    expectedSalary: trimValue(normalizedProfile.expectedSalary),
    workTimePreference: trimValue(normalizedProfile.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(normalizedProfile.remoteAvailableYn),
    selfIntroduction: trimValue(normalizedProfile.selfIntroduction),
    motivation: trimValue(normalizedProfile.motivation),
    jobFitDescription: trimValue(normalizedProfile.jobFitDescription),
    careerGoal: trimValue(normalizedProfile.careerGoal),
    strengthsWeaknesses: trimValue(normalizedProfile.strengthsWeaknesses),
    militaryService: trimValue(normalizedProfile.militaryService),
    patrioticVeteranYn: toBooleanOrNull(normalizedProfile.patrioticVeteranYn),
    snsUrl: trimValue(normalizedProfile.snsUrl)
  };

  return compactPayload(payload);
}

function normalizeEducationSummary(summary, highestEducation) {
  const trimmedSummary = trimValue(summary);
  if (trimmedSummary.length > 0) {
    return HIGHEST_EDUCATION_LABEL_MAP[trimmedSummary] || trimmedSummary;
  }

  const educationCode = trimValue(highestEducation);
  if (!educationCode) {
    return '';
  }

  return HIGHEST_EDUCATION_LABEL_MAP[educationCode] || educationCode;
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
  const normalizedProfile = normalizeStructuredProfileDraft(profile);
  const missing = requiredFields.find(([field]) => !hasText(normalizedProfile[field]));

  if (missing) {
    return `${missing[1]} 항목을 입력해 주세요.`;
  }

  const formatMessage = getProfileFormatMessage(normalizedProfile);

  if (formatMessage) {
    return formatMessage;
  }

  if (!Array.isArray(normalizedProfile.skills) || normalizedProfile.skills.length === 0) {
    return '보유 기술/역량을 1개 이상 입력해 주세요.';
  }

  if (!Array.isArray(normalizedProfile.workTypes) || normalizedProfile.workTypes.length === 0) {
    return '근무 형태 가능 범위를 1개 이상 선택해 주세요.';
  }

  if (typeof normalizedProfile.disabilityRegisteredYn !== 'boolean') {
    return '장애 등록 여부를 선택해 주세요.';
  }

  if (normalizedProfile.sensitiveInfoConsentYn !== true) {
    return '민감정보 수집·이용 동의에 체크해 주세요.';
  }

  return '';
}

function ProfileCard({ profile, selected = false, hasDraft = false, onSelect }) {
  const title = profile.profileName || profile.fullName || profile.targetJob || `프로필 ${profile.profileId}`;
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
    </button>
  );
}

function DraftProfileCard({ profile, savedAt, onSelect }) {
  const title = profile?.profileName?.trim() || profile?.fullName?.trim() || profile?.targetJob?.trim() || '현재 작성중';
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
