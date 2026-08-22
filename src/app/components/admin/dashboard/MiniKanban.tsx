import { memo, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type KanbanColumnId = "needed" | "in-progress" | "completed";

export interface KanbanCard {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
}

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanStatePayload {
  columns: KanbanColumn[];
}

export interface MiniKanbanProps {
  columns: KanbanColumn[];
  onPersist: (payload: KanbanStatePayload) => Promise<void>;
}

function findColumn(columns: KanbanColumn[], id: string) {
  return columns.find((column) => column.id === id || column.cards.some((card) => card.id === id));
}

export function moveKanbanCard(columns: KanbanColumn[], activeId: string, overId: string): KanbanColumn[] {
  const from = findColumn(columns, activeId);
  const to = findColumn(columns, overId);
  if (!from || !to) return columns;
  const fromIndex = from.cards.findIndex((card) => card.id === activeId);
  if (fromIndex < 0) return columns;

  if (from.id === to.id) {
    const toIndex = to.cards.findIndex((card) => card.id === overId);
    if (toIndex < 0 || toIndex === fromIndex) return columns;
    return columns.map((column) => column.id === from.id ? { ...column, cards: arrayMove(column.cards, fromIndex, toIndex) } : column);
  }

  const card = from.cards[fromIndex];
  const overIndex = to.cards.findIndex((item) => item.id === overId);
  const insertAt = overIndex < 0 ? to.cards.length : overIndex;
  return columns.map((column) => {
    if (column.id === from.id) return { ...column, cards: column.cards.filter((item) => item.id !== activeId) };
    if (column.id === to.id) {
      const cards = [...column.cards];
      cards.splice(insertAt, 0, card);
      return { ...column, cards };
    }
    return column;
  });
}

function CardBody({ card }: { card: KanbanCard }) {
  return (
    <>
      <div className="admin-kanban__card-top">
        <strong>{card.title}</strong>
        <span className={`admin-priority admin-priority--${card.priority.toLowerCase()}`}>{card.priority}</span>
      </div>
      <p>{card.category}</p>
      <time dateTime={card.dueDate}>Due {new Date(`${card.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
    </>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="admin-kanban__card"
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-label={`${card.title}, ${card.priority} priority. Drag to reorder or move between columns.`}
    >
      <CardBody card={card} />
    </article>
  );
}

function Column({ column }: { column: KanbanColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section className="admin-kanban__column" aria-labelledby={`column-${column.id}`}>
      <header>
        <h3 id={`column-${column.id}`}>{column.title}</h3>
        <span aria-label={`${column.cards.length} cards`}>{column.cards.length}</span>
      </header>
      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="admin-kanban__cards" data-over={isOver || undefined}>
          {column.cards.map((card) => <SortableCard key={card.id} card={card} />)}
          {!column.cards.length && <p className="admin-kanban__empty">Drop content here</p>}
        </div>
      </SortableContext>
    </section>
  );
}

export const MiniKanban = memo(function MiniKanban({ columns, onPersist }: MiniKanbanProps) {
  const [state, setState] = useState(columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useEffect(() => setState(columns), [columns]);
  const activeCard = useMemo(() => state.flatMap((column) => column.cards).find((card) => card.id === activeId), [activeId, state]);

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const previous = state;
    const next = moveKanbanCard(state, String(active.id), String(over.id));
    if (next === state) return;
    setState(next);
    setSaveState("saving");
    try {
      await onPersist({ columns: next });
      setSaveState("saved");
    } catch {
      setState(previous);
      setSaveState("error");
    }
  };

  return (
    <div>
      <div className="admin-kanban__status" role="status" aria-live="polite">
        {saveState === "saving" && "Saving order…"}
        {saveState === "saved" && "Order saved"}
        {saveState === "error" && "Could not save. Previous order restored."}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="admin-kanban" aria-label="Content workflow board">
          {state.map((column) => <Column key={column.id} column={column} />)}
        </div>
        <DragOverlay>{activeCard ? <article className="admin-kanban__card admin-kanban__card--overlay"><CardBody card={activeCard} /></article> : null}</DragOverlay>
      </DndContext>
    </div>
  );
});
