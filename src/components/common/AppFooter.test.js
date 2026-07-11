import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppFooter } from './AppFooter';

test('applies the Kakao channel link to the entire button content', () => {
  render(
    <MemoryRouter>
      <AppFooter />
    </MemoryRouter>
  );

  const link = screen.getByRole('link', { name: '카톡 상담채널 새 창으로 열기' });
  const label = screen.getByText('카톡상담채널');
  const icon = link.querySelector('img');

  expect(label.closest('a')).toBe(link);
  expect(icon.closest('a')).toBe(link);
  expect(link).toHaveAttribute('href', 'http://pf.kakao.com/_uxoQxbX');
});
