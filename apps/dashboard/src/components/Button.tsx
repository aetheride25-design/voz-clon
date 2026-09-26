import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "ghost", className = "", ...rest }: Props) {
  return <button className={`btn btn--${variant} ${className}`.trim()} {...rest} />;
}
