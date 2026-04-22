export default function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <circle cx="10" cy="10" r="8" />
      <line x1="10" y1="6" x2="10" y2="6" />
      <line x1="10" y1="9" x2="10" y2="14" />
    </svg>
  );
}
