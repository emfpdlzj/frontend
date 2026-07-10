import { render, screen } from '@testing-library/react';

const mockPostingMapPreview = jest.fn(() => <div data-testid="map-preview" />);

jest.mock('../components/jobs/PostingMapPreview', () => ({
  PostingMapPreview: (props) => mockPostingMapPreview(props)
}));

import { PopularPostingDetailModal } from './MainPage';

const buildDetail = () => ({
  postingId: 101,
  scrappedByMe: false,
  postingStatus: 'ACTIVE',
  termDate: '20261231',
  offerRegisteredAt: '2026.07.11',
  contactNumber: '02-1234-5678',
  agencyName: '브릿지워크',
  geoMatchedAddress: '서울특별시 중구 세종대로 1',
  geoLatitude: 37.5665,
  geoLongitude: 126.978,
  workAddress: '서울특별시 중구 세종대로 1',
  salaryText: '월급 250만원',
  employmentType: '정규직',
  enterType: '신입',
  envBothHands: '확인 필요',
  envEyesight: '확인 필요',
  envLstnTalk: '확인 필요',
  envHandWork: '확인 필요',
  envLiftPower: '확인 필요',
  envStndWalk: '확인 필요',
  requiredCareer: '무관',
  requiredEducation: '고졸',
  requiredMajor: '무관',
  requiredLicenses: '없음',
  scrapCount: 3,
  dueLabel: '상시모집',
  jobTitle: '사무 보조',
  companyName: '브릿지워크'
});

describe('PopularPostingDetailModal', () => {
  beforeEach(() => {
    mockPostingMapPreview.mockClear();
  });

  it('does not refocus the close button when the parent passes a new onClose callback', () => {
    const detail = buildDetail();
    const initialOnClose = jest.fn();
    const nextOnClose = jest.fn();

    const { rerender } = render(
      <PopularPostingDetailModal
        detail={detail}
        loading={false}
        error=""
        onClose={initialOnClose}
        onScrap={jest.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    const closeButton = screen.getByRole('button', { name: '공고 상세 창 닫기' });
    dialog.scrollTop = 240;
    closeButton.focus = jest.fn(() => {
      dialog.scrollTop = 0;
    });

    rerender(
      <PopularPostingDetailModal
        detail={detail}
        loading={false}
        error=""
        onClose={nextOnClose}
        onScrap={jest.fn()}
      />
    );

    expect(closeButton.focus).not.toHaveBeenCalled();
    expect(dialog.scrollTop).toBe(240);
  });

  it('does not re-render when parent updates with identical modal props', () => {
    const detail = buildDetail();
    const onClose = jest.fn();
    const onScrap = jest.fn();
    const quickExplainState = { status: 'success', error: '', data: { shortSummary: '요약' } };

    const { rerender } = render(
      <PopularPostingDetailModal
        detail={detail}
        loading={false}
        error=""
        quickFitScore={82}
        quickExplainState={quickExplainState}
        onClose={onClose}
        onScrap={onScrap}
      />
    );

    expect(mockPostingMapPreview).toHaveBeenCalledTimes(1);

    rerender(
      <PopularPostingDetailModal
        detail={detail}
        loading={false}
        error=""
        quickFitScore={82}
        quickExplainState={quickExplainState}
        onClose={onClose}
        onScrap={onScrap}
      />
    );

    expect(mockPostingMapPreview).toHaveBeenCalledTimes(1);
  });
});
