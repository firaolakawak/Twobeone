import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../contexts/LanguageContext";
import { BottomNavigation } from "../BottomNavigation";

describe("BottomNavigation", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("keeps five destinations labeled and preserves the primary navigation routes", async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <LanguageProvider>
        <BottomNavigation
          activeTab="home"
          onTabChange={onTabChange}
          chatUnreadCount={3}
        />
      </LanguageProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(within(navigation).getAllByRole("button")).toHaveLength(5);
    for (const label of ["Home", "Devotions", "Prayer", "Chat", "More"]) {
      expect(within(navigation).getByText(label)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Chat, 3 unread messages" }),
    ).toHaveTextContent("3");
    expect(
      screen.queryByRole("button", { name: "Community" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profile" }),
    ).not.toBeInTheDocument();

    for (const [label, route] of [
      ["Home", "home"],
      ["Devotions", "devotions"],
      ["Prayer", "prayer"],
      ["Chat, 3 unread messages", "chat"],
    ]) {
      await user.click(screen.getByRole("button", { name: label }));
      expect(onTabChange).toHaveBeenLastCalledWith(route);
    }

    rerender(
      <LanguageProvider>
        <BottomNavigation
          activeTab="prayer"
          onTabChange={onTabChange}
          chatUnreadCount={3}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("Prayer")).toBeVisible();
    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByRole("button", { name: "Prayer" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it.each([
    ["Community", "community"],
    ["Profile", "profile"],
  ])(
    "opens %s through More and retains its route and active state",
    async (label, route) => {
      const onTabChange = vi.fn();
      const user = userEvent.setup();
      render(
        <LanguageProvider>
          <BottomNavigation activeTab={route} onTabChange={onTabChange} />
        </LanguageProvider>,
      );

      const more = screen.getByRole("button", { name: "More" });
      expect(more).toHaveAttribute("aria-current", "page");
      expect(more).toHaveAttribute("aria-haspopup", "dialog");
      expect(more).toHaveAttribute("aria-expanded", "false");
      await user.click(more);

      const dialog = screen.getByRole("dialog", { name: "More" });
      expect(more).toHaveAttribute("aria-expanded", "true");
      expect(
        within(dialog).getByRole("button", { name: "Community" }),
      ).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: "Profile" }),
      ).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: label }),
      ).toHaveAttribute("aria-current", "page");
      expect(onTabChange).not.toHaveBeenCalled();

      await user.click(within(dialog).getByRole("button", { name: label }));
      expect(onTabChange).toHaveBeenCalledExactlyOnceWith(route);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(more).toHaveFocus();
    },
  );

  it("closes More with Escape or its close button without navigating", async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </LanguageProvider>,
    );

    const more = screen.getByRole("button", { name: "More" });
    more.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "More" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(more).toHaveFocus();

    await user.click(more);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(more).toHaveFocus();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("caps the visual unread badge while preserving the full accessible count", () => {
    const { rerender } = render(
      <LanguageProvider>
        <BottomNavigation
          activeTab="home"
          onTabChange={vi.fn()}
          chatUnreadCount={120}
        />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Chat, 120 unread messages" }),
    ).toHaveTextContent("99+");

    rerender(
      <LanguageProvider>
        <BottomNavigation
          activeTab="chat"
          onTabChange={vi.fn()}
          chatUnreadCount={1}
        />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Chat, 1 unread message" }),
    ).toHaveTextContent("1");

    rerender(
      <LanguageProvider>
        <BottomNavigation activeTab="chat" onTabChange={vi.fn()} />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: "Chat" })).toHaveTextContent(
      /^Chat$/,
    );
  });

  it.each([
    ["am", "ተጨማሪ"],
    ["om", "Dabalata"],
  ])("localizes More in %s", async (language, label) => {
    localStorage.setItem("twobeone_language", language);
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <BottomNavigation activeTab="home" onTabChange={vi.fn()} />
      </LanguageProvider>,
    );
    const more = screen.getByRole("button", { name: label });
    expect(more).toHaveTextContent(label);
    await user.click(more);
    expect(screen.getByRole("dialog", { name: label })).toBeVisible();
  });
});
