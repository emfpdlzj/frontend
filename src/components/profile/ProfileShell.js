import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import arrowDownIcon from '../../assets/profile/arrow-down.png';
import arrowUpWhiteIcon from '../../assets/profile/arrow_up_white.png';
import plusIcon from '../../assets/profile/plus_icon.png';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../auth/AuthContext';
import { ROUTE_PATHS } from '../../config/routes';
import { FILE_UPLOAD_POLICY } from '../../config/securityPolicy';
import { useProfiles } from '../../hooks/useProfiles';
import { useLocale } from '../../i18n/LocaleContext';
import { validateFileUpload } from '../../utils/fileValidation';
import {
  clearProfileDraftCache,
  createEmptyProfileDraft,
  getProfileDraftStorageKey,
  getValidationMessage,
  getVisibleValidationErrors,
  normalizeStructuredProfileDraft,
  readProfileDraftCache,
  readProfileDraftSummaries,
  toDraftProfile,
  toExtractedDraft,
  toProfilePayload,
  toSafeProfileDraft,
  writeProfileDraftCache
} from '../../utils/profileDraft';
import { formatPhoneNumber } from '../../utils/formValidation';
import { LoadingView } from '../common/LoadingView';
import { StatusMessage } from '../common/StatusMessage';
import { ProfileSectionPanel } from './ProfileSectionPanel';
import {
  createProfilePdfExportChannelId,
  normalizeProfileDocumentData,
  PROFILE_PDF_EXPORT_DATA_EVENT,
  PROFILE_PDF_EXPORT_READY_EVENT
} from './profileDocumentUtils';

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
const MAX_PORTFOLIO_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PORTFOLIO_PDF_SIZE_LABEL = '10MB';
const PROFILE_LEAVE_CONFIRM_MESSAGE = '작성 중인 프로필 정보가 있습니다. 저장하지 않고 나가시겠습니까?';

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
  const { localizePath } = useLocale();
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

  const handleProfilePdfExportClick = () => {
    const exportProfileId = String(visibleProfile?.profileId || selectedProfile?.profileId || selectedProfileId || '');

    if (!exportProfileId || !visibleProfile) {
      setFormError('PDF로 내보낼 프로필 정보를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const channelId = createProfilePdfExportChannelId();
    const exportPath = localizePath(ROUTE_PATHS.profilePdfExport.replace(':profileId', exportProfileId));
    const exportUrl = `${exportPath}?channel=${encodeURIComponent(channelId)}`;
    const exportPayload = normalizeProfileDocumentData(visibleProfile);
    const origin = window.location.origin;
    let timeoutId = null;

    const handleExportReady = (event) => {
      if (event.origin !== origin) {
        return;
      }

      const message = event.data;
      if (message?.type !== PROFILE_PDF_EXPORT_READY_EVENT || message?.channelId !== channelId) {
        return;
      }

      event.source?.postMessage(
        {
          type: PROFILE_PDF_EXPORT_DATA_EVENT,
          channelId,
          profile: exportPayload
        },
        origin
      );

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener('message', handleExportReady);
    };

    window.addEventListener('message', handleExportReady);
    timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', handleExportReady);
    }, 15000);

    const exportWindow = window.open(exportUrl, '_blank');

    if (!exportWindow) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener('message', handleExportReady);
      showDraftToast('팝업이 차단되어 PDF 미리보기를 열지 못했습니다. 브라우저 팝업 설정을 확인해 주세요.', 'error');
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
                  {isExtractingPortfolio ? 'PDF 분석 중...' : '기존 이력서 파일로 브릿지워크 프로필 생성하기'}
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

          {!isCreateMode && detailStatus === 'success' && visibleProfile ? (
            <div className="profile-export-placeholder">
              <button
                type="button"
                className="profile-primary-action profile-export-placeholder__button"
                onClick={handleProfilePdfExportClick}
                disabled={isMutating || isExtractingPortfolio}
              >
                브릿지워크 프로필을 pdf로 내보내기
              </button>
            </div>
          ) : null}

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
                {isCreateMode || !isReadOnlyMode ? (
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
                    )}
                  </div>
                ) : null}
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
