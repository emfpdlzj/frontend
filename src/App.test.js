import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { useAuth } = require('./auth/AuthContext');

const renderApp = (initialPath) => {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    isInitializing: false,
    logout: jest.fn()
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
});
