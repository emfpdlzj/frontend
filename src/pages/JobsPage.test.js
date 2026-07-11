import { render, screen, within } from '@testing-library/react';
import { JobsPage } from './JobsPage';

const mockUseScrappedJobs = jest.fn();

jest.mock('../hooks/useScrappedJobs', () => ({
  useScrappedJobs: () => mockUseScrappedJobs()
}));

jest.mock('../components/jobs/PostingMapPreview', () => ({
  PostingMapPreview: () => <div>지도 미리보기 영역</div>
}));

const scrap = {
  id: '101',
  postingId: 101,
  company: '브릿지워크',
  title: '사무 지원 담당자',
  location: '서울 중구',
  salary: '월급 250만원',
  employmentType: '정규직',
  statusLabel: '진행중 공고',
  dueLabel: 'D-5',
  termDate: '20260716',
  scrappedAt: '2026-07-11T00:00:00Z'
};

const detail = {
  postingId: 101,
  postingStatus: 'ACTIVE',
  title: '사무 지원 담당자',
  company: '브릿지워크',
  statusLabel: '진행중 공고',
  dueLabel: 'D-5',
  location: '서울특별시 중구 세종대로 1',
  salary: '월급 250만원',
  employmentType: '정규직',
  region: '서울 중구',
  termDateText: '2026.07.16',
  contactNumber: '02-1234-5678',
  agencyName: '브릿지워크',
  registeredAtText: '2026.07.11',
  scrapCount: 4,
  contactFields: [['연락처', '02-1234-5678']],
  workConditionFields: [['고용형태', '정규직']],
  workEnvironmentFields: [['양손 사용', '확인 필요']],
  requirementFields: [['요구경력', '무관']],
  mapPreview: { available: false, label: '지도 위치 데이터가 없습니다.' }
};

describe('JobsPage scrap workspace', () => {
  beforeEach(() => {
    mockUseScrappedJobs.mockReturnValue({
      viewState: 'success',
      errorMessage: '',
      scraps: [scrap],
      selectedPostingId: 101,
      detail,
      detailViewState: 'success',
      detailErrorMessage: '',
      setSelectedPostingId: jest.fn(),
      removeScrap: jest.fn()
    });
  });

  it('separates scrap navigation from the detail body and exposes selection with text', () => {
    render(<JobsPage />);

    const navigationPanel = screen.getByRole('complementary', { name: '스크랩 공고 탐색' });
    const detailPanel = screen.getByRole('complementary', { name: '스크랩 공고 상세' });

    expect(within(navigationPanel).getByRole('heading', { name: '스크랩한 공고', level: 1 })).toBeInTheDocument();
    expect(within(navigationPanel).getByLabelText('공고 정렬')).toBeInTheDocument();
    const selectedScrap = within(navigationPanel).getByRole('button', { name: '사무 지원 담당자, 브릿지워크, 진행중 공고' });
    expect(selectedScrap).toHaveAttribute('aria-pressed', 'true');
    expect(within(selectedScrap).getByText('브릿지워크')).toBeVisible();
    expect(within(selectedScrap).getByText('사무 지원 담당자')).toBeVisible();
    expect(within(selectedScrap).getByText('정규직')).toBeVisible();
    expect(within(selectedScrap).getByText('서울 중구')).toBeVisible();
    expect(within(selectedScrap).getByText('월급 250만원')).toBeVisible();
    expect(within(detailPanel).getByRole('heading', { name: '사무 지원 담당자', level: 2 })).toBeInTheDocument();
    expect(detailPanel.querySelector('.posting-detail-modal__hero')).toBeInTheDocument();
    expect(detailPanel.querySelector('.posting-detail-modal__key-summary')).toBeInTheDocument();
    expect(detailPanel.querySelector('.posting-detail-modal__info-stack')).toBeInTheDocument();
    expect(within(detailPanel).getByRole('heading', { name: '근무 조건', level: 3 })).toBeInTheDocument();
    expect(within(detailPanel).queryByText('접근성 요약')).not.toBeInTheDocument();
    expect(within(detailPanel).queryByText('표시 정보는 공고 상세 API에서 제공한 값 기준입니다.')).not.toBeInTheDocument();
  });
});
