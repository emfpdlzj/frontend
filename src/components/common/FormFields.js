import { useMemo, useState } from 'react';

export function FieldRow({ children }) {
  return <div className="field-row">{children}</div>;
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required ? <em>필수</em> : null}
      </span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text', name }) {
  return (
    <input
      className="text-input"
      name={name}
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function TextAreaInput({ value, onChange, placeholder, rows = 4, name }) {
  return (
    <textarea
      className="textarea-input"
      name={name}
      rows={rows}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function SelectInput({ value, onChange, options, placeholder = '선택하세요', name }) {
  return (
    <select
      className="select-input"
      name={name}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ChipInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');

  const chips = useMemo(
    () => value.map((item) => String(item).trim()).filter(Boolean),
    [value]
  );

  const addChip = () => {
    const normalized = input.trim();
    if (!normalized || chips.includes(normalized)) {
      setInput('');
      return;
    }

    onChange([...chips, normalized]);
    setInput('');
  };

  const removeChip = (target) => {
    onChange(chips.filter((chip) => chip !== target));
  };

  return (
    <div className="chip-input-wrap">
      <div className="chip-list">
        {chips.map((chip) => (
          <button
            type="button"
            key={chip}
            className="chip-item"
            onClick={() => removeChip(chip)}
            title="삭제"
          >
            {chip}
            <span>×</span>
          </button>
        ))}
      </div>
      <div className="chip-editor">
        <input
          className="text-input"
          type="text"
          value={input}
          placeholder={placeholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addChip();
            }
          }}
        />
        <button type="button" className="secondary-button" onClick={addChip}>
          추가
        </button>
      </div>
    </div>
  );
}
