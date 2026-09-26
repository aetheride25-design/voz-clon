import type { ReactNode } from "react";

interface Props {
  title: string;
  step?: number;
  aside?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, step, aside, children }: Props) {
  return (
    <section className="panel">
      <header className="panel__head">
        <h2 className="panel__title">
          {step !== undefined && <span className="panel__step">{step}</span>}
          {title}
        </h2>
        {aside && <div className="panel__aside">{aside}</div>}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
