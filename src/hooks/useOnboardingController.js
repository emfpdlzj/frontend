import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ONBOARDING_STEPS as STEPS } from '../constants/onboarding';
import { useSignupOptions } from './useSignupOptions';
import { useLocale } from '../i18n/LocaleContext';
import { formatPhoneNumber } from '../utils/formValidation';
import {
  formatValidationFields,
  getSignupValidationMessage,
  getStepValidationMessage,
  toInitialForm,
  toSignupProfile
} from '../utils/onboardingProfile';

export function useOnboardingController() {

  const navigate = useNavigate();
  const { localizePath } = useLocale();
  const { pendingSignup, completeSignup, isAuthenticated } = useAuth();
  const signupOptions = useSignupOptions();
  const wasAuthenticatedAtMountRef = useRef(isAuthenticated);
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState(() => toInitialForm(pendingSignup));
  const [formatValidationForm, setFormatValidationForm] = useState(form);
  const [formatValidationVisible, setFormatValidationVisible] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const signupInFlightRef = useRef(false);

  const progressWidth = useMemo(() => `${(currentStep / STEPS.length) * 100}%`, [currentStep]);
  const validationMessage = useMemo(() => getSignupValidationMessage(form), [form]);

  const retryLoadOptions = () => {
    window.location.reload();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormatValidationForm(form);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form]);

  const updateField = (field, value) => {
    setSubmitError('');
    setForm((prev) => {
      return {
        ...prev,
        [field]: field === 'phone' ? formatPhoneNumber(value) : value
      };
    });
  };

  const showFormatValidation = (field) => {
    setFormatValidationVisible((prev) => ({
      ...prev,
      [field]: true
    }));
    setFormatValidationForm((prev) => ({
      ...prev,
      [field]: form[field]
    }));
  };

  const toggleArrayValue = (field, value) => {
    setSubmitError('');
    setForm((prev) => {
      const values = prev[field];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

      return {
        ...prev,
        [field]: nextValues
      };
    });
  };

  const goPrevious = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const goNext = async () => {
    if (signupInFlightRef.current) {
      return;
    }

    setSubmitError('');
    const stepValidationMessage = getStepValidationMessage(currentStep, form);

    if (stepValidationMessage) {
      if (currentStep === 1) {
        setFormatValidationVisible((prev) =>
          formatValidationFields.reduce(
            (next, field) => ({
              ...next,
              [field]: true
            }),
            prev
          )
        );
        setFormatValidationForm(form);
      }
      setSubmitError(stepValidationMessage);
      return;
    }

    if (currentStep === STEPS.length) {
      if (validationMessage) {
        setSubmitError(validationMessage);
        return;
      }

      if (!pendingSignup?.signupToken) {
        setSubmitError('회원가입 세션을 확인할 수 없습니다. 다시 로그인해 주세요.');
        return;
      }

      try {
        signupInFlightRef.current = true;
        setSubmitting(true);
        await completeSignup({
          signupToken: pendingSignup.signupToken,
          profile: toSignupProfile(form)
        });
        setIsComplete(true);
      } catch (error) {
        setSubmitError(error.message || '회원가입 처리에 실패했습니다.');
      } finally {
        signupInFlightRef.current = false;
        setSubmitting(false);
      }
      return;
    }

    setCurrentStep((step) => Math.min(STEPS.length, step + 1));
  };

  return {
    currentStep,
    form,
    formatValidationForm,
    formatValidationVisible,
    goNext,
    goPrevious,
    isComplete,
    shouldRedirectAuthenticated: wasAuthenticatedAtMountRef.current,
    localizePath,
    navigate,
    progressWidth,
    retryLoadOptions,
    showFormatValidation,
    signupOptions,
    submitError,
    submitting,
    toggleArrayValue,
    updateField
  };
}
