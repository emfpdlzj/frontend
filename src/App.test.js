import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { useAuth } = require('./auth/AuthContext');

const renderApp = (initialPath, authOverrides = {}) => {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    isInitializing: false,
    logout: jest.fn(),
    ...authOverrides
  });

  return render(
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <App />
    </MemoryRouter>
  );
};

beforeEach(() => {
  useAuth.mockReset();
});

test.each(['/', '/profile', '/my/profile'])('renders the login button in the shared header on %s', (path) => {
  renderApp(path);

  expect(screen.getByRole('button', { name: '회원가입/로그인' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '본문으로 바로가기' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '주요 메뉴로 바로가기' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '하단 정보로 바로가기' })).toBeInTheDocument();
});

test('renders the shared footer on the jobs page', () => {
  renderApp('/jobs', { isAuthenticated: true });

  expect(screen.getByRole('link', { name: '서비스 이용약관' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '개인정보 처리방침' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '개인정보 수집·이용 동의' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '마케팅 정보 수신 동의' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '제3자 제공 동의' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '개인정보 처리위탁 안내' })).toBeInTheDocument();
});
