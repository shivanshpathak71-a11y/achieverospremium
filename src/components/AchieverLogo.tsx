export function AchieverLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="14" fill="url(#logo_grad)" />
      <path d="M24 8L14 40h6.75l1.35-6.75h3.8L27.25 40H34L24 8zm-3.45 21l3.45-9 3.45 9H20.55z" fill="white" fillOpacity="0.97" />
      <circle cx="24" cy="12" r="2.5" fill="#FBBF24" />
      <defs>
        <linearGradient id="logo_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="0.5" stopColor="#0891B2" />
          <stop offset="1" stopColor="#0E7490" />
        </linearGradient>
      </defs>
    </svg>
  );
}
