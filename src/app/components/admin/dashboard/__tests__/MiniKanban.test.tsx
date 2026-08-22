import { describe, expect, it } from "vitest";
import { moveKanbanCard, type KanbanColumn } from "../MiniKanban";

const board: KanbanColumn[] = [
  {
    id: "needed",
    title: "Needed",
    cards: [
      { id: "one", title: "One", category: "Devotional", dueDate: "2026-08-14", priority: "High" },
      { id: "two", title: "Two", category: "Question", dueDate: "2026-08-15", priority: "Medium" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [{ id: "three", title: "Three", category: "Module", dueDate: "2026-08-16", priority: "Low" }],
  },
  { id: "completed", title: "Completed", cards: [] },
];

describe("moveKanbanCard drag-and-drop state", () => {
  it("reorders a card inside its column without mutating the source", () => {
    const result = moveKanbanCard(board, "one", "two");
    expect(result[0].cards.map(({ id }) => id)).toEqual(["two", "one"]);
    expect(board[0].cards.map(({ id }) => id)).toEqual(["one", "two"]);
  });

  it("moves a card into another column at the drop position", () => {
    const result = moveKanbanCard(board, "two", "three");
    expect(result[0].cards.map(({ id }) => id)).toEqual(["one"]);
    expect(result[1].cards.map(({ id }) => id)).toEqual(["two", "three"]);
  });

  it("moves a card into an empty column", () => {
    const result = moveKanbanCard(board, "one", "completed");
    expect(result[2].cards.map(({ id }) => id)).toEqual(["one"]);
  });
});
