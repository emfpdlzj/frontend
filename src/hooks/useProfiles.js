import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { profileApi } from '../api/profileApi';
import { clearRecommendationCache } from '../cache/recommendationCache';
import {
  PROFILE_SCORING_UPDATED_EVENT,
  notifyProfileScoringDataChanged,
  readSelectedProfilePreference,
  writeSelectedProfilePreference
} from '../config/profileSelection';

const initialState = {
  status: 'idle',
  detailStatus: 'idle',
  mutationStatus: 'idle',
  error: '',
  detailError: '',
  mutationMessage: '',
  profiles: [],
  selectedProfileId: '',
  selectedProfile: null
};

const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const sortProfiles = (profiles) =>
  [...profiles].sort((left, right) => {
    if (left?.isDefault && !right?.isDefault) {
      return -1;
    }

    if (!left?.isDefault && right?.isDefault) {
      return 1;
    }

    return getProfileId(left).localeCompare(getProfileId(right), undefined, { numeric: true });
  });

export function useProfiles() {
  const { callWithAuth, isAuthenticated } = useAuth();
  const [state, setState] = useState(initialState);
  const selectedProfileIdRef = useRef(readSelectedProfilePreference());
  const mutationInFlightRef = useRef(null);
  const profileLoadSequenceRef = useRef(0);
  const detailLoadSequenceRef = useRef(0);

  const loadProfiles = useCallback(
    async (signal, preferredProfileId = selectedProfileIdRef.current) => {
      const loadSequence = profileLoadSequenceRef.current + 1;
      profileLoadSequenceRef.current = loadSequence;

      if (!isAuthenticated) {
        selectedProfileIdRef.current = '';
        detailLoadSequenceRef.current += 1;
        setState({
          ...initialState,
          status: 'disabled',
          error: '프로필을 확인하려면 로그인이 필요합니다.'
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        status: prev.profiles.length ? 'refetching' : 'loading',
        error: '',
        mutationMessage: ''
      }));

      try {
        const profiles = sortProfiles(await callWithAuth((accessToken) => profileApi.getProfiles(accessToken, signal)));

        if (loadSequence !== profileLoadSequenceRef.current) {
          return;
        }

        const fallbackProfileId = getProfileId(profiles.find((profile) => profile?.isDefault) || profiles[0]);
        const candidateProfileId = String(preferredProfileId || '');
        const nextSelectedProfileId =
          profiles.some((profile) => getProfileId(profile) === candidateProfileId)
            ? candidateProfileId
            : fallbackProfileId;
        writeSelectedProfilePreference(nextSelectedProfileId);
        selectedProfileIdRef.current = nextSelectedProfileId;

        setState((prev) => ({
          ...prev,
          status: profiles.length ? 'success' : 'empty',
          profiles,
          selectedProfileId: nextSelectedProfileId,
          selectedProfile:
            profiles.length && prev.selectedProfile && getProfileId(prev.selectedProfile) === String(nextSelectedProfileId)
              ? {
                  ...prev.selectedProfile,
                  ...profiles.find((profile) => getProfileId(profile) === String(nextSelectedProfileId))
                }
              : null,
          error: ''
        }));
      } catch (error) {
        if (error.name === 'AbortError' || loadSequence !== profileLoadSequenceRef.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error.message || '프로필 목록을 불러오지 못했습니다.'
        }));
      }
    },
    [callWithAuth, isAuthenticated]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleProfileScoringUpdate = (event) => {
      const changedProfileId = String(event.detail?.profileId || '');

      if (!changedProfileId || changedProfileId !== selectedProfileIdRef.current) {
        return;
      }

      clearRecommendationCache();
      loadProfiles(undefined, selectedProfileIdRef.current);
    };

    window.addEventListener(PROFILE_SCORING_UPDATED_EVENT, handleProfileScoringUpdate);

    return () => {
      window.removeEventListener(PROFILE_SCORING_UPDATED_EVENT, handleProfileScoringUpdate);
    };
  }, [loadProfiles]);

  useEffect(() => {
    const controller = new AbortController();
    loadProfiles(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProfiles]);

  useEffect(() => {
    if (!state.selectedProfileId || !isAuthenticated) {
      return undefined;
    }

    const controller = new AbortController();
    const detailLoadSequence = detailLoadSequenceRef.current + 1;
    detailLoadSequenceRef.current = detailLoadSequence;

    const loadDetail = async () => {
      setState((prev) => ({
        ...prev,
        detailStatus: prev.selectedProfile ? 'refetching' : 'loading',
        detailError: ''
      }));

      try {
        const selectedProfile = await callWithAuth((accessToken) =>
          profileApi.getProfile(accessToken, state.selectedProfileId, controller.signal)
        );

        if (detailLoadSequence !== detailLoadSequenceRef.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          detailStatus: selectedProfile ? 'success' : 'empty',
          selectedProfile: selectedProfile || null,
          detailError: ''
        }));
      } catch (error) {
        if (error.name === 'AbortError' || detailLoadSequence !== detailLoadSequenceRef.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          detailStatus: 'error',
          selectedProfile: null,
          detailError: error.message || '프로필 상세 정보를 불러오지 못했습니다.'
        }));
      }
    };

    loadDetail();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, isAuthenticated, state.selectedProfileId]);

  const selectProfile = useCallback((profileId) => {
    selectedProfileIdRef.current = String(profileId);
    writeSelectedProfilePreference(profileId);
    setState((prev) => ({
      ...prev,
      selectedProfileId: String(profileId),
      selectedProfile: null,
      detailError: ''
    }));
  }, []);

  const runMutation = useCallback(
    async (operation, successMessage, resolvePreferredProfileId) => {
      if (mutationInFlightRef.current) {
        return mutationInFlightRef.current;
      }

      const mutationPromise = (async () => {
        setState((prev) => ({
          ...prev,
          mutationStatus: 'loading',
          mutationMessage: ''
        }));

        try {
          const result = await callWithAuth((accessToken) => operation(accessToken));
          const preferredProfileId = String(resolvePreferredProfileId?.(result) || selectedProfileIdRef.current || '');

          if (preferredProfileId) {
            selectedProfileIdRef.current = preferredProfileId;
            writeSelectedProfilePreference(preferredProfileId);
          }

          await loadProfiles(undefined, preferredProfileId);
          setState((prev) => ({
            ...prev,
            mutationStatus: 'success',
            mutationMessage: successMessage
          }));
          return result;
        } catch (error) {
          setState((prev) => ({
            ...prev,
            mutationStatus: 'error',
            mutationMessage: error.message || '프로필 변경에 실패했습니다.'
          }));
          throw error;
        } finally {
          mutationInFlightRef.current = null;
        }
      })();

      mutationInFlightRef.current = mutationPromise;
      return mutationPromise;
    },
    [callWithAuth, loadProfiles]
  );

  const setDefaultProfile = useCallback(
    async (profileId) => {
      selectedProfileIdRef.current = String(profileId);
      writeSelectedProfilePreference(profileId);
      return runMutation(
        (accessToken) => profileApi.setDefaultProfile(accessToken, profileId),
        '기본 프로필을 변경했습니다.'
      );
    },
    [runMutation]
  );

  const createProfile = useCallback(
    async (payload) => {
      const result = await runMutation(
        (accessToken) => profileApi.createProfile(accessToken, payload),
        '프로필을 추가했습니다.',
        getProfileId
      );
      return result;
    },
    [runMutation]
  );

  const updateProfile = useCallback(
    async (profileId, payload) => {
      selectedProfileIdRef.current = String(profileId);
      writeSelectedProfilePreference(profileId);
      const result = await runMutation(
        (accessToken) => profileApi.updateProfile(accessToken, profileId, payload),
        '프로필을 저장했습니다.'
      );
      clearRecommendationCache();
      notifyProfileScoringDataChanged(profileId);
      return result;
    },
    [runMutation]
  );

  const deleteProfile = useCallback(
    async (profileId) => {
      return runMutation(
        (accessToken) => profileApi.deleteProfile(accessToken, profileId),
        '프로필을 삭제했습니다.'
      );
    },
    [runMutation]
  );

  return useMemo(
    () => ({
      ...state,
      isMutating: state.mutationStatus === 'loading',
      selectProfile,
      reload: () => loadProfiles(),
      createProfile,
      updateProfile,
      setDefaultProfile,
      deleteProfile
    }),
    [createProfile, deleteProfile, loadProfiles, selectProfile, setDefaultProfile, state, updateProfile]
  );
}
