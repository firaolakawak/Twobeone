import type { ComponentProps } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../contexts/LanguageContext";
import { LoveJourneyHeader } from "../LoveJourneyHeader";
import { DistanceConnector } from "../DistanceConnector";

vi.mock("../DistanceConnector", () => ({
  DistanceConnector: vi.fn(() => (
    <p role="status" aria-label="Shared locations">
      Your shared locations
    </p>
  )),
}));

type HeaderProps = ComponentProps<typeof LoveJourneyHeader>;
const userProfile = {
  id: "user-sarah",
  name: "Sarah Tesfaye",
  avatar: "https://example.com/sarah.jpg",
};
const partnerProfile = {
  id: "partner-abel",
  name: "Abel Bekele",
  avatar: "https://example.com/abel.jpg",
};

function renderHeader(overrides: Partial<HeaderProps> = {}) {
  const props: HeaderProps = {
    user: userProfile,
    partner: partnerProfile,
    start: "2025-09-14",
    accessToken: "test-session",
    milestones: [],
    onEdit: vi.fn(),
    onViewMemories: vi.fn(),
    ...overrides,
  };
  const result = render(
    <LanguageProvider>
      <LoveJourneyHeader {...props} />
    </LanguageProvider>,
  );
  return {
    ...result,
    props,
    interaction: { click: (element: Element) => fireEvent.click(element) },
  };
}

describe("LoveJourneyHeader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 13, 12, 34, 56));
    localStorage.setItem("twobeone_language", "en");
    vi.clearAllMocks();
    // Exercise the real Radix Avatar with deterministic image load outcomes.
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(value: string) {
          if (value.includes("broken")) this.onerror?.();
          else this.onload?.();
        }
      },
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the couple names once and uses their saved photos and location identities", async () => {
    const { props, interaction } = renderHeader();
    expect(
      screen.getByRole("heading", { name: "Sarah & Abel" }),
    ).toHaveAttribute("title", "Sarah Tesfaye & Abel Bekele");
    expect(screen.getAllByText(/Sarah/)).toHaveLength(1);
    expect(screen.getAllByText(/Abel/)).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Sarah Tesfaye" })).toHaveAttribute(
      "src",
      userProfile.avatar,
    );
    expect(screen.getByRole("img", { name: "Abel Bekele" })).toHaveAttribute(
      "src",
      partnerProfile.avatar,
    );
    expect(vi.mocked(DistanceConnector).mock.calls[0][0]).toMatchObject({
      userId: "user-sarah",
      partnerId: "partner-abel",
      accessToken: "test-session",
    });
    await interaction.click(
      screen.getByRole("button", { name: "Edit your relationship details" }),
    );
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("falls back to the real initials for broken or missing avatars", () => {
    renderHeader({
      user: { ...userProfile, avatar: "https://example.com/broken.jpg" },
      partner: { ...partnerProfile, avatar: undefined },
    });
    const portraits = screen.getByRole("button", {
      name: "Edit your relationship details",
    });
    expect(within(portraits).queryByRole("img")).not.toBeInTheDocument();
    expect(within(portraits).getByText("S")).toBeVisible();
    expect(within(portraits).getByText("A")).toBeVisible();
  });

  it.each([
    [userProfile, partnerProfile, "Sarah & Abel", "Abel feels Good"],
    [partnerProfile, userProfile, "Abel & Sarah", "Sarah feels Good"],
  ] as const)("keeps viewer %s first and labels the emoji as the partner's mood", (user, partner, names, label) => {
    renderHeader({ user, partner, partnerMood: "good" });
    const heading = screen.getByRole("heading", {
      name: (name) => name.replace(/\s+/g, " ") === `${names} ${label}`,
    });
    expect(within(heading).getByRole("img", { name: label })).toHaveTextContent("🙂");
    expect(heading).toHaveTextContent(`${names} 🙂`);
  });

  it("omits the mood emoji when the partner has not shared a current mood", () => {
    renderHeader();
    const heading = screen.getByRole("heading", { name: "Sarah & Abel" });
    expect(within(heading).queryByRole("img")).not.toBeInTheDocument();
  });

  it("derives the live counter and next anniversary from the saved relationship date", () => {
    renderHeader();
    const timer = screen.getByRole("timer", { name: "Days Together" });
    expect(timer).toHaveAttribute("aria-live", "off");
    expect(timer).toHaveTextContent("364days together");
    expect(timer).toHaveTextContent("12 hours");
    expect(timer).toHaveTextContent("34 minutes");
    expect(timer).toHaveTextContent("56 seconds");
    expect(screen.getByText("Next anniversary")).toBeVisible();
    expect(screen.getByText("Tomorrow")).toBeVisible();

    act(() => vi.advanceTimersByTime(1000));
    expect(timer).toHaveTextContent("57 seconds");
  });

  it("refreshes the anniversary when its local calendar day arrives", () => {
    vi.setSystemTime(new Date(2026, 8, 13, 23, 59, 30));
    renderHeader({ start: "2020-09-14" });
    expect(screen.getByText("Tomorrow")).toBeVisible();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText("Today!")).toBeVisible();
    expect(screen.queryByText("Tomorrow")).not.toBeInTheDocument();
  });

  it("shows only the five newest saved moments at or before now in Our story", async () => {
    const { interaction } = renderHeader({
      milestones: [
        { id: "oldest", title: "Our first walk", date: "2024-01-02" },
        { id: "third", title: "A weekend away", date: "2026-09-11" },
        { id: "future", title: "Next month’s holiday", date: "2026-10-01" },
        {
          id: "first",
          title: "A moment just saved",
          date: new Date(2026, 8, 13, 12, 34, 56).toISOString(),
        },
        { id: "sixth", title: "Last spring together", date: "2026-03-01" },
        { id: "fourth", title: "A shared celebration", date: "2026-09-10" },
        { id: "invalid", title: "Invalid saved date", date: "2026-02-31" },
        { id: "fifth", title: "Summer memories", date: "2026-08-01" },
        { id: "second", title: "Yesterday’s coffee", date: "2026-09-12" },
        {
          id: "later-today",
          title: "Tonight’s dinner",
          date: new Date(2026, 8, 13, 19).toISOString(),
        },
      ],
    });
    await interaction.click(screen.getByRole("button", { name: "Our story" }));
    const dialog = screen.getByRole("dialog", {
      name: "Every chapter, together.",
    });
    const memories = within(dialog).getByRole("heading", {
      name: "Moments you’ve saved",
    }).parentElement!;
    const items = within(memories).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    [
      "A moment just saved",
      "Yesterday’s coffee",
      "A weekend away",
      "A shared celebration",
      "Summer memories",
    ].forEach((title, index) => expect(items[index]).toHaveTextContent(title));
    for (const title of [
      "Our first walk",
      "Last spring together",
      "Next month’s holiday",
      "Tonight’s dinner",
      "Invalid saved date",
    ]) {
      expect(within(dialog).queryByText(title)).not.toBeInTheDocument();
    }
    expect(
      within(dialog).getByRole("heading", { name: "Your beginning" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("heading", { name: "Next anniversary" }),
    ).toBeVisible();
  });

  it("shows an honest empty memories state without sample milestones", async () => {
    const { interaction } = renderHeader();
    await interaction.click(screen.getByRole("button", { name: "Our story" }));
    const dialog = screen.getByRole("dialog", {
      name: "Every chapter, together.",
    });
    expect(
      within(dialog).getByText(
        "Your shared milestones will appear here as you add them.",
      ),
    ).toBeVisible();
  });

  it.each([
    ["Edit your relationship details", "onEdit"],
    ["Milestones & memories", "onViewMemories"],
  ] as const)(
    "closes Our story and routes its %s action",
    async (label, callback) => {
      const { props, interaction } = renderHeader();
      await interaction.click(
        screen.getByRole("button", { name: "Our story" }),
      );
      const dialog = screen.getByRole("dialog", {
        name: "Every chapter, together.",
      });
      expect(props[callback]).not.toHaveBeenCalled();
      await interaction.click(
        within(dialog).getByRole("button", { name: label }),
      );
      expect(props[callback]).toHaveBeenCalledOnce();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it.each([undefined, "invalid"])(
    "invites a saved start date instead of inventing an elapsed zero: %s",
    async (start) => {
      const { props, interaction } = renderHeader({ start });
      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(screen.queryByText("Next anniversary")).not.toBeInTheDocument();
      const setDate = screen.getByRole("button", {
        name: "Set your relationship start date",
      });
      expect(setDate).toBeVisible();
      await interaction.click(setDate);
      expect(props.onEdit).toHaveBeenCalledOnce();
    },
  );

  it("announces a future start date without showing an elapsed counter", async () => {
    const { props, interaction } = renderHeader({ start: "2027-01-04" });
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByText("Next anniversary")).not.toBeInTheDocument();
    await interaction.click(
      screen.getByRole("button", { name: "Your journey starts 4 Jan 2027" }),
    );
    expect(props.onEdit).toHaveBeenCalledOnce();
    await interaction.click(screen.getByRole("button", { name: "Our story" }));
    expect(
      within(screen.getByRole("dialog")).queryByRole("heading", {
        name: /^Today/,
      }),
    ).not.toBeInTheDocument();
  });

  it("invites an unlinked partner without displaying shared elapsed time or distance", async () => {
    const { props, interaction } = renderHeader({ partner: undefined });
    expect(screen.getByRole("heading", { name: "Sarah" })).toBeVisible();
    expect(
      screen.getByText(
        "Connect with your partner to begin your journey together",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Shared locations" }),
    ).not.toBeInTheDocument();
    expect(DistanceConnector).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Our story" }),
    ).not.toBeInTheDocument();
    await interaction.click(
      screen.getByRole("button", { name: "Add Partner" }),
    );
    expect(props.onEdit).toHaveBeenCalledOnce();
  });
});
