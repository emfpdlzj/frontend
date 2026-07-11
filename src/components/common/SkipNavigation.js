const SKIP_LINKS = [
  { href: '#page-main-region', label: '본문으로 바로가기' },
  { href: '#primary-navigation', label: '주요 메뉴로 바로가기' },
  { href: '#page-footer', label: '하단 정보로 바로가기' }
];

export function SkipNavigation() {
  return (
    <nav className="skip-navigation" aria-label="건너뛰기 링크">
      {SKIP_LINKS.map((item) => (
        <a key={item.href} className="skip-navigation__link" href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
