import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SocialLoginButtons } from './SocialLoginButtons';
import { oauthUtils } from '../../utils/oauth';

jest.mock('../../utils/oauth', () => ({
  oauthUtils: {
    saveReturnTo: jest.fn(),
    buildAuthorizeUrl: jest.fn()
  }
}));

beforeEach(() => {
  oauthUtils.saveReturnTo.mockClear();
  oauthUtils.buildAuthorizeUrl.mockReset();
  oauthUtils.buildAuthorizeUrl.mockReturnValue('https://login.example.com/oauth');
});

test('disables social login buttons after one provider starts navigation', () => {
  const navigateTo = jest.fn();

  render(
    <MemoryRouter initialEntries={['/jobs?tab=scraps']}>
      <SocialLoginButtons navigateTo={navigateTo} />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

  expect(oauthUtils.saveReturnTo).toHaveBeenCalledWith('/jobs?tab=scraps');
  expect(navigateTo).toHaveBeenCalledWith('https://login.example.com/oauth');
  expect(screen.getByRole('button', { name: /로그인 화면으로 이동 중/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /네이버로 시작하기/ })).toBeDisabled();
});
