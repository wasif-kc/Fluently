interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}

/** An on/off switch that works with mouse, touch and keyboard. */
export function Switch({ checked, onChange, label, id }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__knob" />
    </button>
  );
}
