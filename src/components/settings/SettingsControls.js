export function SettingsToggle({ id, label, description, checked, onChange }) {
  return (
    <label className={`settings-toggle${checked ? ' is-active' : ''}`} htmlFor={id}>
      <span className="settings-toggle__copy">
        <span className="settings-toggle__label">{label}</span>
        {description ? <span className="settings-toggle__description">{description}</span> : null}
      </span>
      <span className="settings-toggle__switch">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}

export function SettingsRadioGroup({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="settings-radio-group">
      <legend>{legend}</legend>
      <div className="settings-radio-group__options">
        {options.map((option) => (
          <label
            key={option.value}
            className={`settings-radio-option${value === option.value ? ' is-active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsStatusBadge({ tone = 'neutral', children }) {
  return <span className={`settings-status-badge settings-status-badge--${tone}`}>{children}</span>;
}

export function SettingsSection({ id, title, description, children, tone = 'default', actions = null }) {
  return (
    <section id={id} className={`settings-section settings-section--${tone}`} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <div className="settings-section__header">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="settings-section__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
