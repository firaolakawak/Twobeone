import { memo } from "react";

interface SparklineProps {
  data: number[];
  label: string;
  direction: "up" | "down" | "neutral";
}

function Sparkline({ data, label, direction }: SparklineProps) {
  const values = data.length > 1 ? data : [0, 0];
  const min = Math.min(...values);
  const range = Math.max(Math.max(...values) - min, 1);
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 120},${38 - ((value - min) / range) * 32}`)
    .join(" ");

  return (
    <svg className={`admin-sparkline admin-sparkline--${direction}`} viewBox="0 0 120 44" role="img" aria-label={label}>
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default memo(Sparkline);
