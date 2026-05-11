import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommonErrorPage } from './CommonErrorPage';

test('renders 404 recovery actions without forcing a full page reload', () => {
  render(
    <MemoryRouter>
      <CommonErrorPage status={404} />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
});
