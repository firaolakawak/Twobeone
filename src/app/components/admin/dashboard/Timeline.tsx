import { memo, useRef, useState, type KeyboardEvent } from "react";

export interface TimelineEvent {
  id: string;
  type: "content" | "user" | "group" | "system" | string;
  title: string;
  time: string;
  details: string;
}

function formatActivityTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(elapsedSeconds) < 60) return formatter.format(elapsedSeconds, "second");
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, "minute");
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return formatter.format(elapsedHours, "hour");
  const elapsedDays = Math.round(elapsedHours / 24);
  if (Math.abs(elapsedDays) < 30) return formatter.format(elapsedDays, "day");
  return new Date(timestamp).toLocaleDateString();
}

export const Timeline = memo(function Timeline({ events = [] }: { events?: TimelineEvent[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowDown") next = Math.min(events.length - 1, index + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = events.length - 1;
    else return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  };

  if (!events.length) return <p className="admin-empty">No recent activity yet.</p>;

  return (
    <ol className="admin-timeline" aria-label="Recent activity" role="list">
      {events.map((item, index) => {
        const isExpanded = expanded.has(item.id) || hovered === item.id;
        const detailsId = `timeline-details-${item.id}`;
        return (
          <li className="admin-timeline__item" key={item.id} role="listitem">
            <span className={`admin-timeline__node admin-timeline__node--${item.type}`} aria-hidden="true" />
            <button
              ref={(node) => { itemRefs.current[index] = node; }}
              className="admin-timeline__trigger"
              type="button"
              onClick={() => toggle(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onKeyDown={(event) => navigate(event, index)}
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              aria-label={`${item.title}, ${item.time}. ${isExpanded ? "Collapse" : "Expand"} details`}
            >
              <span className="admin-timeline__copy">
                <strong>{item.title}</strong>
                <time dateTime={item.time}>{formatActivityTime(item.time)}</time>
              </span>
              <span className="admin-timeline__chevron" aria-hidden="true">⌄</span>
            </button>
            <div id={detailsId} className="admin-timeline__details" hidden={!isExpanded}>{item.details}</div>
          </li>
        );
      })}
    </ol>
  );
});
