
type Props = {
  size?: number;
  className?: string;
};

export const OrnatePlum = ({
  size = 24,
  className = "",
}: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path
      d="M15 25 L35 45 L85 75 M35 45 L55 60 M55 60 L65 50 M55 60 L50 80"
      strokeWidth="4"
    />

    <g transform="translate(25, 25) scale(0.6)">
      <circle cx="0" cy="-10" r="10" fill="white" stroke="currentColor" />
      <circle cx="10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="10" r="10" fill="white" stroke="currentColor" />
      <circle cx="-10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="0" r="4" fill="currentColor" />
    </g>

    <g transform="translate(55, 55) scale(0.7)">
      <circle cx="0" cy="-10" r="10" fill="white" stroke="currentColor" />
      <circle cx="10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="10" r="10" fill="white" stroke="currentColor" />
      <circle cx="-10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="0" r="4" fill="currentColor" />
    </g>

    <circle cx="45" cy="48" r="3" fill="currentColor" />
  </svg>
);
