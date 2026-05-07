import { useState } from 'react';
import { Link } from 'react-router-dom';
import editIcon from '../../assets/profile/edit_icon.png';
import moreIcon from '../../assets/profile/more_icon.png';
import plusIcon from '../../assets/profile/plus_icon.png';
import homeIcon from '../../assets/tab/home_icon.png';
import mapIcon from '../../assets/tab/map_icon.png';
import docsIcon from '../../assets/tab/docs_icon.png';
import businesscardIcon from '../../assets/tab/businesscard_icon.png';
import profileIcon from '../../assets/tab/profile_icon.png';
import settingIcon from '../../assets/tab/setting_icon.png';
import { ProfileSectionPanel } from './ProfileSectionPanel';

const navItems = [
  { id: 'home', label: '홈', icon: homeIcon, to: '/home' },
  { id: 'map', label: '접근성 지도', icon: mapIcon, to: '/accessibility-map', active: true },
  { id: 'docs', label: '문서', icon: docsIcon, to: '/profile' },
  { id: 'business', label: '공고', icon: businesscardIcon, to: '/jobs' },
  { id: 'profile', label: '내 정보', icon: profileIcon, to: '/me-profile', bottom: true },
  { id: 'settings', label: '설정', icon: settingIcon, to: '/settings', bottom: true }
];

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

export function ProfileShell() {
  const [activeSection, setActiveSection] = useState('');
  const activeRowIndex = sectionRows.findIndex((row) => row.some((section) => section.id === activeSection));
  const visibleTopRows = activeSection && activeRowIndex === 0 ? [sectionRows[0]] : sectionRows;
  const showBottomRow = activeSection && activeRowIndex === 0;

  const handleTabClick = (sectionId) => {
    setActiveSection((current) => (current === sectionId ? '' : sectionId));
  };

  return (
    <main className="profile-page">
      <div className="profile-layout">
        <aside className="profile-icon-rail" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`profile-icon-rail__button${item.active ? ' is-active' : ''}${item.bottom ? ' is-bottom' : ''}`}
              aria-label={item.label}
            >
              <img src={item.icon} alt="" aria-hidden="true" />
            </Link>
          ))}
        </aside>

        <aside className="profile-list-panel" aria-labelledby="profile-list-title">
          <div className="profile-list-panel__head">
            <h2 id="profile-list-title">내 프로필</h2>
            <button type="button" className="profile-add-button">
              <img src={plusIcon} alt="" aria-hidden="true" />
              프로필 추가
            </button>
          </div>

          <ProfileCard title="기본 프로필" selected badge="기본" />
          <ProfileCard title="웹 개발자 지원용" />

          <ul className="profile-list-note">
            <li>프로필은 최대 3개까지 등록할 수 있습니다.</li>
            <li>기본 프로필은 삭제할 수 없습니다.</li>
          </ul>
        </aside>

        <section className="profile-workspace" aria-labelledby="profile-title">
          <button type="button" className="profile-delete-button">
            프로필 삭제
          </button>

          <header className="profile-heading">
            <div>
              <h1 id="profile-title">
                기본 프로필
                <button type="button" aria-label="프로필 이름 수정" className="profile-edit-button">
                  <img src={editIcon} alt="" aria-hidden="true" />
                </button>
              </h1>
              <label className="profile-default-toggle">
                <input type="checkbox" checked readOnly />
                <span aria-hidden="true" />
                기본 프로필로 설정
              </label>
            </div>
          </header>

          <div className="profile-form-area">
            <ProfileTabs rows={visibleTopRows} activeSection={activeSection} onTabClick={handleTabClick} />
            <ProfileSectionPanel activeSection={activeSection} />
            {showBottomRow ? (
              <ProfileTabs rows={[sectionRows[1]]} activeSection={activeSection} onTabClick={handleTabClick} compact />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileCard({ title, selected = false, badge }) {
  return (
    <article className={`profile-card${selected ? ' is-selected' : ''}`} aria-current={selected ? 'true' : undefined}>
      {badge ? <span className="profile-card__badge">{badge}</span> : null}
      <div>
        <h3>{title}</h3>
        <p>최종 수정일 2026.04.25</p>
      </div>
      <button type="button" aria-label={`${title} 더보기`} className="profile-card__more">
        <img src={moreIcon} alt="" aria-hidden="true" />
      </button>
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
                <span className="profile-tabs__chevron" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
