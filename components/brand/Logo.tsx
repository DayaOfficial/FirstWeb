export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo DAYA MART"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#7A0019" />
          <stop offset="55%" stopColor="#C0003A" />
          <stop offset="100%" stopColor="#FF1A5E" />
        </linearGradient>
      </defs>

      {/* Kotak rounded — TANPA stroke/border hitam */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoGrad)" />

      {/* Huruf D bold */}
      <path
        d="M24 16h12c9.94 0 18 7.16 18 16s-8.06 16-18 16H24V16zm8 8v16h4c5.52 0 10-3.58 10-8s-4.48-8-10-8h-4z"
        fill="#FFFFFF"
      />

      {/* Handle tas belanja (negative space) */}
      <path
        d="M30 20c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
