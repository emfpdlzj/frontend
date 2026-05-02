function Icon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  switch (name) {
    case 'home':
      return (
        <svg {...commonProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
        </svg>
      );
    case 'map':
      return (
        <svg {...commonProps}>
          <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
          <path d="M9 4v13.5" />
          <path d="M15 6.5V20" />
        </svg>
      );
    case 'document':
      return (
        <svg {...commonProps}>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h6" />
          <path d="M10 17h6" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...commonProps}>
          <path d="M8 7V5h8v2" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M3 12h18" />
          <path d="M12 12v3" />
        </svg>
      );
    case 'user':
      return (
        <svg {...commonProps}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
        </svg>
      );
  }
}

export function AccessibilityMapSidebar({ items }) {
  return (
    <nav className="accessibility-map__sidebar" aria-label="주요 메뉴">
      {items.map(([name, label], index) => (
        <button
          key={name}
          type="button"
          className={`accessibility-map__sidebar-button${index === 0 ? ' is-active' : ''}`}
          aria-label={label}
        >
          <Icon name={name} />
        </button>
      ))}
    </nav>
  );
}
