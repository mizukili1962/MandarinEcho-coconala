type Props = {
  size?: number;
  className?: string;
};

export const OrnateOrchid = ({
  size = 24,
  className = "",
}: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M50 80 C50 60 40 40 25 25" />

    <path
      d="M25 25 Q15 15 25 5 Q35 15 25 25"
      fill="currentColor"
      fillOpacity="0.2"
    />

    <path
      d="M25 25 Q35 35 45 25 Q35 15 25 25"
      fill="currentColor"
      fillOpacity="0.2"
    />

    <path
      d="M50 80 C65 70 85 40 70 20"
      strokeWidth="2"
      opacity="0.6"
    />

    <path
      d="M50 80 C35 70 15 40 30 20"
      strokeWidth="2"
      opacity="0.6"
    />
  </svg>
);
