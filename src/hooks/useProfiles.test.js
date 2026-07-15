import { renderHook, waitFor } from '@testing-library/react';
import { profileApi } from '../api/profileApi';
import { useAuth } from '../auth/AuthContext';
import { STORAGE_KEYS } from '../config/appConfig';
import { useProfiles } from './useProfiles';

jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../api/profileApi', () => ({
  profileApi: {
    getProfiles: jest.fn(),
    getProfile: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    setDefaultProfile: jest.fn()
  }
}));

beforeEach(() => {
  window.sessionStorage.clear();
  jest.clearAllMocks();
  useAuth.mockReturnValue({
    isAuthenticated: true,
    callWithAuth: (operation) => operation('access-token')
  });
});

test('restores a valid selected profile preference instead of forcing the default profile', async () => {
  window.sessionStorage.setItem(STORAGE_KEYS.selectedProfile, '2');
  profileApi.getProfiles.mockResolvedValue([
    { profileId: 1, profileName: '기본 프로필', isDefault: true },
    { profileId: 2, profileName: '지원용 프로필', isDefault: false }
  ]);
  profileApi.getProfile.mockResolvedValue({
    profileId: 2,
    profileName: '지원용 프로필',
    isDefault: false
  });

  const { result } = renderHook(() => useProfiles());

  await waitFor(() => expect(result.current.selectedProfileId).toBe('2'));
  await waitFor(() => expect(result.current.detailStatus).toBe('success'));
  expect(profileApi.getProfile).toHaveBeenCalledWith('access-token', '2', expect.any(AbortSignal));
  expect(result.current.selectedProfile?.profileId).toBe(2);
});
