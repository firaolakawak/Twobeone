import type { LucideIcon } from "lucide-react";
import "./card-emblem.css";

interface CardEmblemProps {
  icon: LucideIcon;
  size?: "default" | "compact";
  className?: string;
}

/** Decorative artwork: the card's heading and controls carry its meaning. */
export function CardEmblem({
  icon: Icon,
  size = "default",
  className = "",
}: CardEmblemProps) {
  return (
    <span
      className={`card-emblem card-emblem--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="card-emblem__shape">
        <Icon strokeWidth={1.5} focusable="false" />
      </span>
    </span>
  );
}
