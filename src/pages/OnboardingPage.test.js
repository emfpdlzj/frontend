import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { OnboardingPage } from './OnboardingPage';

jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

const completeSignup = jest.fn();

const renderPage = () => {
  useAuth.mockReturnValue({
    pendingSignup: {
      signupToken: 'signup-token',
      email: ''
    },
    completeSignup
  });

  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <OnboardingPage />
    </MemoryRouter>
  );
};

beforeEach(() => {
  completeSignup.mockReset();
});

test('blocks each signup step until required fields are completed', async () => {
  renderPage();

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('이름, 성별, 연락처, 이메일, 거주지 상세 주소를 입력해 주세요.');
  expect(screen.getByRole('heading', { name: '기본 정보' })).toBeInTheDocument();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '1990.01.01');
  userEvent.type(screen.getByPlaceholderText('서울시 영등포구 OO로 12'), '서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '직무·경력' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('최종 학력과 지원 직무를 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '근무 조건' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '정규직' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('가능한 고용형태를 하나 이상 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '정규직' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '장애 정보' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('장애 유형, 장애 정도, 장애인 등록 여부를 함께 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '지체' }));
  userEvent.click(screen.getByRole('button', { name: '심한 장애 (1~3급)' }));
  userEvent.click(screen.getByRole('button', { name: '등록' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '자기소개' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
  expect(screen.getByRole('alert')).toHaveTextContent('자기소개를 입력해 주세요.');
  expect(completeSignup).not.toHaveBeenCalled();

  userEvent.type(screen.getByPlaceholderText('간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.'), '사무 지원 경험이 있습니다.');
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));

  await waitFor(() => expect(completeSignup).toHaveBeenCalledTimes(1));
});
