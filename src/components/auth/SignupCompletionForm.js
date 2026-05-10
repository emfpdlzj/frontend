import { useMemo, useState } from 'react';
import { GENDER_OPTIONS } from '../../config/appConfig';
import { Field, FieldRow, SelectInput, TextInput } from '../common/FormFields';
import { StatusMessage } from '../common/StatusMessage';

const toInitialForm = (seed) => ({
  name: seed?.name || '',
  age: '',
  gender: '',
  location: '',
  phoneNumber: '',
  contactEmail: seed?.contactEmail || ''
});

export function SignupCompletionForm({ seed, onSubmit, submitting }) {
  const [form, setForm] = useState(() => toInitialForm(seed));
  const [error, setError] = useState('');

  const ageHint = useMemo(() => {
    if (!form.age) {
      return '14~120 숫자를 입력하세요.';
    }
    const ageValue = Number(form.age);
    if (Number.isNaN(ageValue)) {
      return '나이는 숫자만 입력할 수 있습니다.';
    }
    return '';
  }, [form.age]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const ageValue = Number(form.age);
    if (
      !form.name.trim() ||
      Number.isNaN(ageValue) ||
      ageValue < 14 ||
      ageValue > 120 ||
      !form.gender ||
      !form.location.trim() ||
      !form.phoneNumber.trim()
    ) {
      setError('필수 항목을 정확히 입력해 주세요.');
      return;
    }

    const contactEmail = form.contactEmail.trim();

    await onSubmit({
      name: form.name.trim(),
      age: ageValue,
      gender: form.gender,
      location: form.location.trim(),
      phoneNumber: form.phoneNumber.trim(),
      ...(contactEmail ? { contactEmail } : {})
    }).catch((submitError) => {
      setError(submitError.message || '회원가입 완료에 실패했습니다.');
    });
  };

  return (
    <form className="form-layout" onSubmit={handleSubmit}>
      <FieldRow>
        <Field label="이름" required>
          <TextInput value={form.name} onChange={(value) => updateField('name', value)} placeholder="이름 입력" />
        </Field>
        <Field label="나이" required hint={ageHint}>
          <TextInput
            type="number"
            value={form.age}
            onChange={(value) => updateField('age', value)}
            placeholder="예: 28"
          />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="성별" required>
          <SelectInput
            value={form.gender}
            onChange={(value) => updateField('gender', value)}
            options={GENDER_OPTIONS}
          />
        </Field>
        <Field label="거주 지역" required>
          <TextInput
            value={form.location}
            onChange={(value) => updateField('location', value)}
            placeholder="예: 서울 강남구"
          />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="전화번호" required hint="숫자와 + 만 허용됩니다.">
          <TextInput
            value={form.phoneNumber}
            onChange={(value) => updateField('phoneNumber', value)}
            placeholder="예: 010-1234-5678"
          />
        </Field>
        <Field label="이메일">
          <TextInput
            type="email"
            value={form.contactEmail}
            onChange={(value) => updateField('contactEmail', value)}
            placeholder="예: user@example.com"
          />
        </Field>
      </FieldRow>

      <StatusMessage kind="error">{error}</StatusMessage>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? '가입 처리 중...' : '가입 완료'}
      </button>
    </form>
  );
}
