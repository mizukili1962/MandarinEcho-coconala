type Props = {
  size?: number;
  className?: string;
};

export const OrnateBamboo = ({
  size = 24,
  className = "",
}: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="7"
    strokeLinecap="butt"
    className={className}
  >
    <path d="M40 90 L40 68 M40 62 L40 40 M40 34 L40 10" />

    <path
      d="M70 90 L70 72 M70 66 L70 48 M70 42 L70 25"
      strokeWidth="5"
      opacity="0.7"
    />

    <path
      d="M34 65 H46 M34 37 H46 M66 69 H74 M66 45 H74"
      strokeWidth="2"
    />

    <g fill="currentColor" stroke="none">
      <path d="M40 40 L25 55 L35 50 Z" />
      <path d="M70 48 L85 38 L75 42 Z" />
    </g>
  </svg>
);
