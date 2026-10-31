export function PhotoPlaceholder({
  label = "Photo to come",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex items-center justify-center overflow-hidden bg-cream ${className}`}
    >
      <svg
        viewBox="0 0 120 160"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-taupe"
      >
        <path d="M30 134V68a30 30 0 0 1 60 0v66" stroke="currentColor" strokeWidth="0.6" />
        <path d="M22 134h76" stroke="currentColor" strokeWidth="0.6" />
      </svg>
      <span className="relative bg-cream px-2 text-xs text-muted">{label}</span>
    </div>
  );
}
