type Name = "wave" | "upload" | "mic" | "sparkle";

const PATHS: Record<Name, string> = {
  wave: "M3 12h2m2-4v8m2-11v14m2-9v4m2-7v10m2-6v2m2-4v6m2-3v0",
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2",
  mic: "M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm-7-3a7 7 0 0014 0M12 19v3",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
};

interface Props {
  name: Name;
  size?: number;
}

export function Icon({ name, size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
