type Props = {
  size?: number;
  className?: string;
};

export const OrnateChrysanthemum = ({
  size = 24,
  className = "",
}: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle
      cx="50"
      cy="50"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />

    {[...Array(16)].map((_, i) => {
      const deg = i * (360 / 16);

      return (
        <g key={i} transform={`rotate(${deg} 50 50)`}>
          <path
            d="M50 40 C55 35 58 10 50 5 C42 10 45 35 50 40"
            fill="currentColor"
            fillOpacity="0.1"
          />

          <path
            d="M50 40 L50 15"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        </g>
      );
    })}

    {[...Array(16)].map((_, i) => {
      const deg = (i * (360 / 16)) + (360 / 32);

      return (
        <g key={`inner-${i}`} transform={`rotate(${deg} 50 50)`}>
          <path
            d="M50 42 C54 38 56 25 50 20 C44 25 46 38 50 42"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </g>
      );
    })}
  </svg>
);
