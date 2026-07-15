import { cloneElement, isValidElement, useId, useState } from 'react';
import { fallbackText } from '../../constants/profileOptions';

const text = (value) => String(value ?? '').trim();

export function RepeatSectionHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="profile-repeat-section__header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <button type="button" className="profile-repeat-section__add-button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

export function RepeatCard({ title, subtitle, onRemove, children }) {
  return (
    <section className="profile-repeat-card">
      {title || subtitle ? (
        <div className="profile-repeat-card__head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="profile-repeat-card__body">{children}</div>
      <div className="profile-repeat-card__footer">
        <button type="button" className="profile-repeat-card__remove-button" onClick={onRemove}>
          삭제
        </button>
      </div>
    </section>
  );
}

export function RepeatEmptyState({ message }) {
  return <div className="profile-repeat-empty">{message}</div>;
}

export function Field({ label, required = false, hint, error, children, width }) {
  const generatedId = useId();
  const fieldId = `profile-field-${generatedId}`;
  const isSingleControl = isValidElement(children);
  const labeledChildren = isSingleControl
    ? cloneElement(children, {
      id: children.props.id || fieldId,
      'aria-label': children.props['aria-label'] || label
    })
    : children;

  return (
    <div className={`profile-field${width ? ` profile-field--${width}` : ''}`}>
      <label className="profile-label" htmlFor={isSingleControl ? fieldId : undefined}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {labeledChildren}
      {error ? (
        <span className="profile-field-error" role="alert">
          {error}
        </span>
      ) : null}
      {hint ? <span className="profile-help">{hint}</span> : null}
    </div>
  );
}

export function RequiredMark() {
  return <em aria-label="필수">*</em>;
}

export function Input({ icon, suffix, onChange, value, ...props }) {
  return (
    <span className="profile-input-wrap">
      <input className="profile-input" {...props} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      {suffix ? <span className="profile-input-suffix">{suffix}</span> : null}
      {icon ? <img src={icon} alt="입력 항목 아이콘" /> : null}
    </span>
  );
}

export function SelectBox({ value, onChange, options, placeholder = '선택해주세요.', ...props }) {
  return (
    <select className="profile-select" value={value || ''} onChange={(event) => onChange(event.target.value)} {...props}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function TextArea({ rows, value, onChange, ...props }) {
  const textValue = value || '';

  return (
    <span className="profile-textarea-wrap">
      <textarea
        className="profile-textarea"
        rows={rows}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      <span className="profile-textarea-count" aria-live="polite">
        {String(textValue).length.toLocaleString('ko-KR')}자
      </span>
    </span>
  );
}

export function RadioGroup({ options, selected, onChange }) {
  return (
    <div className="profile-radio-row">
      {options.map((option) => (
        <label key={String(option.value)} className="profile-radio">
          <input
            type="radio"
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
          />
          <span aria-hidden="true" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function CheckboxRow({ options, selectedOptions = [], onChange }) {
  const toggle = (value) => {
    const nextValues = selectedOptions.includes(value)
      ? selectedOptions.filter((item) => item !== value)
      : [...selectedOptions, value];

    onChange(nextValues);
  };

  return (
    <div className="profile-checkbox-row">
      {options.map((option) => (
        <label key={option.value} className="profile-checkbox">
          <input type="checkbox" checked={selectedOptions.includes(option.value)} onChange={() => toggle(option.value)} />
          <span aria-hidden="true" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function PillGroup({ options, selected, onChange }) {
  return (
    <div className="profile-pill-row">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`profile-pill${selected === option.value ? ' is-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ChipEditor({ value = [], onChange, placeholder, id, 'aria-label': ariaLabel }) {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const addValue = (rawValue) => {
    const nextValue = text(rawValue);

    if (!nextValue || value.includes(nextValue)) {
      return;
    }

    onChange([...value, nextValue]);
  };

  const removeValue = (item) => {
    onChange(value.filter((valueItem) => valueItem !== item));
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }
    if (isComposing || event.nativeEvent?.isComposing) {
      return;
    }

    event.preventDefault();
    addValue(inputValue);
    setInputValue('');
  };

  const handleAddClick = () => {
    addValue(inputValue);
    setInputValue('');
  };

  return (
    <div className="profile-chip-editor">
      <div className="profile-chip-list" aria-live="polite">
        {value.length ? (
          value.map((item) => (
            <button key={item} type="button" onClick={() => removeValue(item)} aria-label={`${item} 삭제`}>
              {item}
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <span>{fallbackText}</span>
        )}
      </div>
      <div className="profile-chip-input-row">
        <input
          id={id}
          className="profile-input"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
        <button type="button" onClick={handleAddClick}>
          추가
        </button>
      </div>
    </div>
  );
}

export function Divider() {
  return <hr className="profile-divider" />;
}
