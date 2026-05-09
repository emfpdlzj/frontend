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
    employmentTypes: ['정규직', '계약직'],
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
    ],
    regions: [
      { value: '서울', label: '서울' },
      { value: '부산', label: '부산' }
    ],
    salaryTypes: [
      { value: '월급', label: '월급' },
      { value: '연봉', label: '연봉' }
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
  expect(screen.getByRole('alert')).toHaveTextContent('이름, 성별, 연락처, 이메일, 생년월일, 근무지역, 거주지 상세 주소를 입력해 주세요.');
  expect(screen.getByRole('heading', { name: '기본 정보' })).toBeInTheDocument();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.type(screen.getByLabelText('생년월일'), '1990.01.01');
  userEvent.selectOptions(screen.getByLabelText('근무지역 *'), '서울');
  expect(screen.getByLabelText(/거주지 상세 주소/)).toHaveValue('');
  expect(screen.getByPlaceholderText('서울 OO구 OO동')).toBeInTheDocument();
  fillAddress('서울시 영등포구 OO로 12');
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
  userEvent.click(screen.getByRole('button', { name: '월급' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '장애 정보' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '지체' }));
  userEvent.click(screen.getByRole('button', { name: '심한 장애 (1~3급)' }));
  userEvent.click(screen.getByRole('button', { name: '등록됨' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '자기소개' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
  expect(screen.getByRole('alert')).toHaveTextContent('자기소개를 입력해 주세요.');
  expect(completeSignup).not.toHaveBeenCalled();

  userEvent.type(screen.getByPlaceholderText('간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.'), '사무 지원 경험이 있습니다.');
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
  expect(screen.getByRole('alert')).toHaveTextContent('지원동기를 입력해 주세요.');
  expect(completeSignup).not.toHaveBeenCalled();

  userEvent.type(screen.getByPlaceholderText('지원하려는 이유와 기대하는 근무 방향을 적어 주세요.'), '안정적으로 일하며 역량을 키우고 싶습니다.');
  userEvent.click(screen.getByRole('button', { name: '가입 완료' }));

  await waitFor(() => expect(completeSignup).toHaveBeenCalledTimes(1));
  expect(completeSignup).toHaveBeenCalledWith(
    expect.objectContaining({
      profile: expect.objectContaining({
        birthDate: '1990-01-01',
        genderType: 'MALE',
        residenceRegion: '서울',
        expectedSalary: '월급',
        selfIntroduction: '사무 지원 경험이 있습니다.',
        motivation: '안정적으로 일하며 역량을 키우고 싶습니다.'
      })
    })
  );
});

test('blocks signup when birth date is missing', async () => {
  renderPage();

  userEvent.type(screen.getByLabelText('이름 *'), '홍길동');
  userEvent.click(screen.getByRole('button', { name: '남성' }));
  userEvent.type(screen.getByLabelText('연락처 *'), '010-1234-5678');
  userEvent.type(screen.getByLabelText('이메일 *'), 'hong@example.com');
  userEvent.selectOptions(screen.getByLabelText('근무지역 *'), '서울');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('alert')).toHaveTextContent('이름, 성별, 연락처, 이메일, 생년월일, 근무지역, 거주지 상세 주소를 입력해 주세요.');
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
  userEvent.selectOptions(screen.getByLabelText('근무지역 *'), '서울');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  expect(screen.getByRole('alert')).toHaveTextContent('장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.');

  userEvent.click(screen.getByRole('button', { name: '지체' }));
  userEvent.click(screen.getByRole('button', { name: '심한 장애 (1~3급)' }));
  userEvent.click(screen.getByRole('button', { name: '등록됨' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.type(screen.getByPlaceholderText('간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.'), '사무 지원 경험이 있습니다.');
  userEvent.type(screen.getByPlaceholderText('지원하려는 이유와 기대하는 근무 방향을 적어 주세요.'), '지원동기입니다.');
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
  userEvent.selectOptions(screen.getByLabelText('근무지역 *'), '서울');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  const needsReviewButtons = screen.getAllByRole('button', { name: '확인 필요' });
  userEvent.click(needsReviewButtons[0]);
  userEvent.click(needsReviewButtons[1]);
  userEvent.click(screen.getByRole('button', { name: '등록 안 됨' }));

  expect(screen.getByRole('group', { name: /장애 유형/ })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /장애 정도/ })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /장애인 등록 여부/ })).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  expect(screen.getByRole('heading', { name: '자기소개' })).toBeInTheDocument();
});

test('rejects birth dates below the minimum working age', () => {
  renderPage();

  const underageBirthDate = new Date();
  underageBirthDate.setFullYear(underageBirthDate.getFullYear() - 14);
  const underageBirthDateText = toDisplayDate(underageBirthDate);
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
  userEvent.selectOptions(screen.getByLabelText('근무지역 *'), '서울');
  fillAddress('서울시 영등포구 OO로 12');
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  userEvent.click(screen.getByRole('button', { name: '대졸' }));
  userEvent.click(screen.getByRole('button', { name: '서비스 기획' }));
  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  const salaryButton = screen.getByRole('button', { name: '월급' });
  userEvent.click(salaryButton);
  expect(salaryButton).toHaveAttribute('aria-pressed', 'true');
  userEvent.click(salaryButton);
  expect(salaryButton).toHaveAttribute('aria-pressed', 'false');

  userEvent.click(screen.getByRole('button', { name: '다음 단계' }));

  const severityButton = screen.getByRole('button', { name: '심한 장애 (1~3급)' });
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
