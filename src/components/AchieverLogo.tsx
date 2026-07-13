export function AchieverLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="url(#logo_grad)" />
      <path d="M24 10L28.5 20L39 21L31 28L33.5 38.5L24 33L14.5 38.5L17 28L9 21L19.5 20L24 10Z" fill="white" fillOpacity="0.95" />
      <defs>
        <linearGradient id="logo_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ec4899" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
