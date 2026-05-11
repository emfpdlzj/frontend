import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { OnboardingPage } from './OnboardingPage';

jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../hooks/useSignupOptions', () => ({
  useSignupOptions: jest.fn()
}));

const { useSignupOptions } = require('../hooks/useSignupOptions');
const completeSignup = jest.fn();

const renderPage = () => {
  useAuth.mockReturnValue({
    pendingSignup: {
      signupToken: 'signup-token',
      email: ''
    },
    completeSignup
  });
  useSignupOptions.mockReturnValue({
    status: 'success',
    error: '',
    employmentTypes: [
      { value: 'FULL_TIME', label: '정규직' },
      { value: 'CONTRACT', label: '계약직' }
    ],
    jobCategories: [
      {
        label: '기획·전략',
        groups: [
          {
            label: '기획',
            jobs: ['서비스 기획']
          }
        ]
      }
    ]
  });

  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <OnboardingPage />
    </MemoryRouter>
  );
};

const fillAddress = (value) => {
  const addressInput = screen.getByLabelText(/거주지 상세 주소/);
  userEvent.clear(addressInput);
  userEvent.type(addressInput, value);
};

const toDisplayDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

beforeEach(() => {
  completeSignup.mockReset();
  useSignupOptions.mockReset();
});

test('blocks each signup step until required fields are completed', async () => {
  renderPage();

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('이름, 성별, 연락처, 이메일, 생년월일, 거주지 상세 주소를 입력해 주세요.');
  expect(screen.getByRole('heading', { name: '기본 정보' })).toBeInTheDocument();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '1990.01.01');
  expect(screen.getByLabelText(/거주지 상세 주소/)).toHaveValue('');
  expect(screen.getByPlaceholderText('서울 OO구 OO동')).toBeInTheDocument();
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '직무·경력' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('최종 학력, 졸업 상태, 주요 경력, 지원 직무를 입력해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '졸업' }));
  userEvent.type(screen.getByLabelText('주요 경력 한 줄 *'), '사무 지원 2년');
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '근무 조건' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '정규직' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('가능한 고용형태를 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '정규직' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '장애 정보' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '지체' }));
  userEvent.click(screen.getByRole('button', { name: '중증' }));
  userEvent.click(screen.getByRole('button', { name: '등록됨' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '자기소개' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
  expect(screen.getByRole('alert')).toHaveTextContent('자기소개를 입력해 주세요.');
  expect(completeSignup).not.toHaveBeenCalled();

  userEvent.type(screen.getByPlaceholderText('간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.'), '사무 지원 경험이 있습니다.');
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));

  await waitFor(() => expect(completeSignup).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByRole('heading', { name: '기본 정보 입력 완료!' })).toBeInTheDocument());
  expect(screen.getByText('15개')).toBeInTheDocument();
  expect(screen.getByText('7개 묶음')).toBeInTheDocument();
  expect(screen.getByText('24개 선택 정보')).toBeInTheDocument();
  expect(screen.getByText('약 5분')).toBeInTheDocument();
  expect(screen.getByText('39개')).toBeInTheDocument();
  expect(screen.queryByText('2.4배')).not.toBeInTheDocument();
  expect(completeSignup).toHaveBeenCalledWith({
    signupToken: 'signup-token',
    profile: {
      fullName: '홍길동',
      contactPhone: '010-1234-5678',
      contactEmail: 'hong@example.com',
      birthDate: '1990-01-01',
      genderType: 'MALE',
      detailAddress: '서울시 영등포구 OO로 12',
      highestEducation: 'BACHELOR',
      graduationStatus: 'GRADUATED',
      majorCareer: '사무 지원 2년',
      targetJob: '서비스 기획',
      skills: ['서비스 기획'],
      disabilityType: 'PHYSICAL',
      disabilitySeverity: 'SEVERE',
      disabilityRegisteredYn: true,
      workTypes: ['FULL_TIME'],
      selfIntroduction: '사무 지원 경험이 있습니다.'
    }
  });
});

test('blocks signup when birth date is missing', async () => {
  renderPage();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('alert')).toHaveTextContent('이름, 성별, 연락처, 이메일, 생년월일, 거주지 상세 주소를 입력해 주세요.');
  expect(screen.getByRole('heading', { name: '기본 정보' })).toBeInTheDocument();
  expect(completeSignup).not.toHaveBeenCalled();
});

test('normalizes keyboard birth date input before signup submit', async () => {
  renderPage();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '2003.09.15');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '졸업' }));
  userEvent.type(screen.getByLabelText('주요 경력 한 줄 *'), '사무 지원 2년');
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '지체' }));
  userEvent.click(screen.getByRole('button', { name: '중증' }));
  userEvent.click(screen.getByRole('button', { name: '등록됨' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.type(screen.getByPlaceholderText('간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.'), '사무 지원 경험이 있습니다.');
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));

  await waitFor(() => expect(completeSignup).toHaveBeenCalledTimes(1));
  expect(completeSignup).toHaveBeenCalledWith(
    expect.objectContaining({
      profile: expect.objectContaining({
        birthDate: '2003-09-15'
      })
    })
  );
});

test('pads one digit birth month and day after text input blur', () => {
  renderPage();

  const birthDateInput = screen.getByLabelText('생년월일');

  userEvent.type(birthDateInput, '2003.9.15');
  userEvent.tab();

  expect(birthDateInput).toHaveValue('2003.09.15');
  expect(screen.queryByText(/형식이 일치하지 않아요/)).not.toBeInTheDocument();
});

test('allows non-disability choices without hiding required accessibility fields', async () => {
  renderPage();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '1990.01.01');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '졸업' }));
  userEvent.type(screen.getByLabelText('주요 경력 한 줄 *'), '사무 지원 2년');
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '기타' }));
  userEvent.click(screen.getByRole('button', { name: '경증' }));
  userEvent.click(screen.getByRole('button', { name: '등록 안 됨' }));

  expect(screen.getByRole('group', { name: /장애 유형/ })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /장애 정도/ })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /장애인 등록 여부/ })).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '자기소개' })).toBeInTheDocument();
});

test('rejects birth dates below the minimum working age', () => {
  renderPage();

  const underageBirthDateText = `${new Date().getFullYear() - 14}.12.09`;
  const birthDateInput = screen.getByLabelText('생년월일');

  userEvent.type(birthDateInput, underageBirthDateText);

  expect(screen.getByRole('alert')).toHaveTextContent(
    '근로기준법상 취업 가능한 노동 가능 연령은 원칙적으로 만 15세 이상입니다.'
  );
  expect(birthDateInput).not.toHaveValue(underageBirthDateText);
});

test('formats phone number while typing on signup step', async () => {
  renderPage();

  const phoneInput = screen.getByLabelText('연락처 *');

  userEvent.type(phoneInput, '01025626895');

  expect(phoneInput).toHaveValue('010-2562-6895');
});

test('keeps required single-choice signup fields selected when clicked again', async () => {
  renderPage();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '1990.01.01');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '졸업' }));
  userEvent.type(screen.getByLabelText('주요 경력 한 줄 *'), '사무 지원 2년');
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  const severityButton = screen.getByRole('button', { name: '중증' });
  userEvent.click(severityButton);
  expect(severityButton).toHaveAttribute('aria-pressed', 'true');
  userEvent.click(severityButton);
  expect(severityButton).toHaveAttribute('aria-pressed', 'true');

  const registeredButton = screen.getByRole('button', { name: '등록됨' });
  userEvent.click(registeredButton);
  expect(registeredButton).toHaveAttribute('aria-pressed', 'true');
  userEvent.click(registeredButton);
  expect(registeredButton).toHaveAttribute('aria-pressed', 'true');
});
