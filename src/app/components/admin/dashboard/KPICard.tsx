import { lazy, memo, Suspense, type ReactNode } from "react";

const Sparkline = lazy(() => import("./Sparkline"));

export interface KPITrend {
  direction: "up" | "down" | "neutral";
  value: string;
}

export interface KPICardProps {
  label: string;
  value: string | number;
  trend: KPITrend;
  sparklineData: number[];
  icon: ReactNode;
}

export const KPICard = memo(function KPICard({
  label,
  value,
  trend,
  sparklineData,
  icon,
}: KPICardProps) {
  const safeTrend = trend ?? { direction: "neutral" as const, value: "No change" };
  const safeSparklineData = Array.isArray(sparklineData) ? sparklineData : [];
  const trendGlyph = safeTrend.direction === "up" ? "↑" : safeTrend.direction === "down" ? "↓" : "–";

  return (
    <article
      className="admin-kpi"
      tabIndex={0}
      aria-label={`${label}: ${value}. Trend ${safeTrend.direction}, ${safeTrend.value}`}
    >
      <span className="admin-kpi__watermark" aria-hidden="true">{icon}</span>
      <div className="admin-kpi__heading">
        <span className="admin-kpi__icon" aria-hidden="true">{icon}</span>
        <span className={`admin-trend admin-trend--${safeTrend.direction}`}>
          <span aria-hidden="true">{trendGlyph}</span> {safeTrend.value}
        </span>
      </div>
      <p className="admin-kpi__value">{value}</p>
      <p className="admin-kpi__label">{label}</p>
      <Suspense fallback={<div className="admin-sparkline admin-sparkline--loading" aria-hidden="true" />}>
        <Sparkline data={safeSparklineData} label={`${label} trend`} direction={safeTrend.direction} />
      </Suspense>
    </article>
  );
});
