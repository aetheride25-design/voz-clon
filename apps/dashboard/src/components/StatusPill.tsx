type Tone = "ok" | "warn" | "err" | "muted";

interface Props {
  tone: Tone;
  children: string;
}

export function StatusPill({ tone, children }: Props) {
  return (
    <span className={`pill pill--${tone}`}>
      <span className="pill__dot" />
      {children}
    </span>
  );
}
