import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DistanceConnector } from "../DistanceConnector";
import { LanguageProvider } from "../../contexts/LanguageContext";
import { geocodeCity, getCurrentLocation } from "../../utils/location";

vi.mock("../../utils/location", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/location")>()),
  geocodeCity: vi.fn(),
  getCurrentLocation: vi.fn(),
}));

afterEach(cleanup);

describe("embedded distance connector", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps each location with its profile and shows the distance in kilometers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          userLocation: {
            userId: "one",
            locationType: "manual",
            location: {
              latitude: 24.4539,
              longitude: 54.3773,
              city: "Abu Dhabi",
            },
          },
          partnerLocation: {
            userId: "two",
            locationType: "manual",
            location: { latitude: 9.03, longitude: 38.74, city: "Addis Ababa" },
          },
        }),
      }),
    );

    render(
      <LanguageProvider>
        <DistanceConnector
          embedded
          userId="one"
          userName="Partner One"
          userAvatar="one.jpg"
          partnerId="two"
          partnerName="Partner Two"
          partnerAvatar="two.jpg"
          accessToken="token"
          userOnline
          partnerOnline
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText("Abu Dhabi")).toBeInTheDocument();
    expect(await screen.findByText("Addis Ababa")).toBeInTheDocument();
    expect(await screen.findByText(/km$/i)).toBeInTheDocument();
    expect(screen.getByText("Partner One")).toBeInTheDocument();
    expect(screen.getByText("Partner Two")).toBeInTheDocument();
    expect(screen.getByLabelText("Partner Two: online")).toBeInTheDocument();
    expect(screen.getByTestId("love-flow")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Location settings" }),
    ).toBeInTheDocument();
  });
});

const journeyProps = {
  embedded: true,
  variant: "journey" as const,
  userId: "one",
  userName: "Partner One",
  partnerId: "two",
  partnerName: "Partner Two",
  accessToken: "token",
  userOnline: true,
  partnerOnline: false,
};

const dubaiLocation = {
  userId: "one",
  locationType: "manual",
  updatedAt: "2026-09-12T08:15:00Z",
  location: {
    latitude: 25.2048,
    longitude: 55.2708,
    city: "Dubai",
    country: "United Arab Emirates",
  },
};
const addisLocation = {
  userId: "two",
  locationType: "manual",
  updatedAt: "2026-09-12T08:15:00Z",
  location: {
    latitude: 9.03,
    longitude: 38.74,
    city: "Addis Ababa",
    country: "Ethiopia",
  },
};

const response = (body: unknown) =>
  ({ ok: true, json: async () => body }) as Response;
function journey(
  overrides: Partial<ComponentProps<typeof DistanceConnector>> = {},
) {
  return (
    <LanguageProvider>
      <DistanceConnector {...journeyProps} {...overrides} />
    </LanguageProvider>
  );
}

describe("compact journey locations", () => {
  beforeEach(() => {
    localStorage.setItem("twobeone_language", "en");
    vi.mocked(geocodeCity).mockReset();
    vi.mocked(getCurrentLocation).mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem("twobeone_language");
  });

  it("shows both city/country pairs and approximate distance while presence stays independent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          userLocation: dubaiLocation,
          partnerLocation: addisLocation,
        }),
      ),
    );
    render(journey());

    expect(await screen.findByText("Dubai")).toBeVisible();
    expect(screen.getByText("United Arab Emirates")).toBeVisible();
    expect(screen.getByText("Addis Ababa")).toBeVisible();
    expect(screen.getByText("Ethiopia")).toBeVisible();
    expect(screen.getByText(/^≈ [\d,]+$/).closest("p")).toHaveTextContent(
      /^≈ [\d,]+ km apart$/,
    );
    expect(
      screen.getByText("Approximate straight-line distance"),
    ).toBeVisible();
    expect(screen.getByText("Both cities set manually")).toBeVisible();
    expect(screen.getByLabelText("Partner One: online")).toBeInTheDocument();
    expect(screen.getByLabelText("Partner Two: offline")).toBeInTheDocument();
    expect(getCurrentLocation).not.toHaveBeenCalled();
    expect(screen.queryByText(/GPS LIVE|Sync Live/)).not.toBeInTheDocument();
  });

  it("describes matching manual city selections without implying the couple is physically together", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          userLocation: dubaiLocation,
          partnerLocation: { ...dubaiLocation, userId: "two" },
        }),
      ),
    );
    render(journey());

    expect(await screen.findByText("Same city")).toBeVisible();
    expect(screen.getByText("Based on your selected city")).toBeVisible();
    expect(screen.queryByText("0.0 km")).not.toBeInTheDocument();
    expect(screen.queryByText(/Together now/)).not.toBeInTheDocument();
  });

  it.each([
    { userLocation: null, partnerLocation: addisLocation, missing: "own" },
    { userLocation: dubaiLocation, partnerLocation: null, missing: "partner" },
  ])(
    "keeps missing $missing location unknown instead of displaying zero distance",
    async ({ userLocation, partnerLocation, missing }) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(response({ userLocation, partnerLocation })),
      );
      render(journey());

      await screen.findByText(missing === "own" ? "Addis Ababa" : "Dubai");
      expect(screen.getByText("—")).toBeVisible();
      expect(screen.getByText("Not shared")).toBeVisible();
      expect(screen.getByText("Distance unavailable")).toBeVisible();
      expect(screen.queryByText(/0(?:\.0)? km/)).not.toBeInTheDocument();
      if (missing === "own")
        expect(
          screen.getByRole("button", { name: "Share your location" }),
        ).toBeVisible();
      else
        expect(
          screen.getByText("Waiting for your partner's location"),
        ).toBeVisible();
    },
  );

  it("ignores invalid coordinates rather than rendering a misleading distance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          userLocation: dubaiLocation,
          partnerLocation: {
            ...addisLocation,
            location: { ...addisLocation.location, latitude: 105 },
          },
        }),
      ),
    );
    render(journey());
    await screen.findByText("Dubai");
    expect(screen.getByText("Distance unavailable")).toBeVisible();
    expect(screen.queryByText("Addis Ababa")).not.toBeInTheDocument();
  });

  it("clears the previous partner location immediately and hides locations when unlinked", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          response({
            userLocation: dubaiLocation,
            partnerLocation: addisLocation,
          }),
        )
        .mockImplementationOnce(() => new Promise(() => {})),
    );
    const view = render(journey());
    await screen.findByText("Addis Ababa");

    view.rerender(journey({ partnerId: "three", partnerName: "New Partner" }));
    expect(screen.queryByText("Addis Ababa")).not.toBeInTheDocument();
    expect(screen.queryByText("Dubai")).not.toBeInTheDocument();
    expect(screen.getByText("Distance unavailable")).toBeVisible();

    view.rerender(journey({ partnerId: undefined }));
    expect(
      screen.queryByRole("region", { name: "Your shared locations" }),
    ).not.toBeInTheDocument();
  });

  it("ignores an earlier partner response that arrives after the new pair has loaded", async () => {
    let resolvePrevious!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              resolvePrevious = resolve;
            }),
        )
        .mockResolvedValueOnce(
          response({
            userLocation: dubaiLocation,
            partnerLocation: {
              ...addisLocation,
              userId: "three",
              location: { ...addisLocation.location, city: "New city" },
            },
          }),
        ),
    );
    const view = render(journey());
    view.rerender(journey({ partnerId: "three", partnerName: "New Partner" }));
    await screen.findByText("New city");

    await act(async () =>
      resolvePrevious(
        response({
          userLocation: dubaiLocation,
          partnerLocation: addisLocation,
        }),
      ),
    );
    expect(screen.getByText("New city")).toBeVisible();
    expect(screen.queryByText("Addis Ababa")).not.toBeInTheDocument();
  });

  it("saves a manual city and removes the shared location through the existing API", async () => {
    const user = userEvent.setup();
    let saved: typeof dubaiLocation | null = null;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === "POST") {
        const payload = JSON.parse(String(init.body));
        saved = { ...dubaiLocation, ...payload };
        return response({ success: true });
      }
      if (init?.method === "DELETE") {
        saved = null;
        return response({ success: true });
      }
      return response({ userLocation: saved, partnerLocation: addisLocation });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(geocodeCity).mockResolvedValue(dubaiLocation.location);
    render(journey());
    await screen.findByText("Addis Ababa");
    await user.click(
      screen.getByRole("button", { name: "Share your location" }),
    );
    await user.type(screen.getByLabelText("Set your city"), "Dubai, UAE");
    await user.click(screen.getByRole("button", { name: "Set city" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Dubai")).toBeVisible();
    expect(geocodeCity).toHaveBeenCalledWith("Dubai, UAE");
    const post = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(String(post?.[0])).toContain("/update-location");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      location: dubaiLocation.location,
      locationType: "manual",
    });
    expect(post?.[1]?.headers).toMatchObject({ Authorization: "Bearer token" });

    await user.click(screen.getByRole("button", { name: "Location settings" }));
    await user.click(
      screen.getByRole("button", { name: "Remove shared location" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Dubai")).not.toBeInTheDocument();
    expect(screen.getByText("Addis Ababa")).toBeVisible();
    expect(screen.getByText("Distance unavailable")).toBeVisible();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).endsWith("/update-location") && init?.method === "DELETE",
      ),
    ).toBe(true);
  });

  it("requests device location only on an explicit update and describes it as a saved reading", async () => {
    const user = userEvent.setup();
    let saved = false;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === "POST") {
        saved = true;
        return response({ success: true });
      }
      return response({
        userLocation: saved ? { ...dubaiLocation, locationType: "live" } : null,
        partnerLocation: addisLocation,
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(getCurrentLocation).mockResolvedValue(dubaiLocation.location);
    render(journey());
    await screen.findByText("Addis Ababa");
    expect(getCurrentLocation).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Location settings" }));
    expect(
      screen.getByText(
        "Saves your current location once. It does not track your movements.",
      ),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Update current location" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(getCurrentLocation).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Shared city and device locations")).toBeVisible();
    const post = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(JSON.parse(String(post?.[1]?.body)).locationType).toBe("live");
  });

  it("uses Amharic for the compact location labels and settings", async () => {
    localStorage.setItem("twobeone_language", "am");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ userLocation: dubaiLocation, partnerLocation: null }),
        ),
    );
    const user = userEvent.setup();
    render(journey());
    await screen.findByText("Dubai");

    expect(screen.getByText("ርቀት አይገኝም")).toBeVisible();
    expect(screen.getByText("አልተጋራም")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "የአካባቢ ቅንብሮች" }));
    expect(
      screen.getByRole("button", { name: "የአሁኑን አካባቢ ያድሱ" }),
    ).toBeVisible();
    expect(screen.getByLabelText("ከተማዎን ይምረጡ")).toBeVisible();
  });

  it("uses Oromo for the compact location labels and settings", async () => {
    localStorage.setItem("twobeone_language", "om");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ userLocation: dubaiLocation, partnerLocation: null }),
        ),
    );
    const user = userEvent.setup();
    render(journey());
    await screen.findByText("Dubai");

    expect(screen.getByText("Fageenyi hin argamne")).toBeVisible();
    expect(screen.getByText("Hin qoodamne")).toBeVisible();
    expect(
      screen.getByText("Magaalaan keessan harkaan filatame"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Qindaa'ina bakka" }));
    expect(
      screen.getByRole("button", { name: "Bakka ammaa haaromsaa" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Magaalaa keessan filadhaa")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Bakka qoodame haqi" }),
    ).toBeVisible();
  });

  it("opens location settings from the keyboard-accessible love journey row without duplicating identity", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response({
          userLocation: dubaiLocation,
          partnerLocation: addisLocation,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(journey({ variant: "love-journey" }));
    await screen.findByText("Dubai");

    const row = screen.getByRole("button", { name: "Location settings" });
    expect(row).toHaveTextContent("Dubai");
    expect(row).toHaveTextContent("Addis Ababa");
    expect(row).toHaveTextContent(/≈ [\d,]+ km/);
    expect(row).toHaveAccessibleDescription(
      /Partner One: Dubai, United Arab Emirates.*Partner Two: Addis Ababa, Ethiopia.*Approximate straight-line distance.*Both cities set manually/,
    );
    expect(
      screen.queryByText("Partner One", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Partner Two", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(row).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Location settings" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Update current location" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Set your city")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove shared location" }),
    ).toBeVisible();
    expect(getCurrentLocation).not.toHaveBeenCalled();
  });

  it.each([
    {
      state: "same city",
      partnerLocation: { ...dubaiLocation, userId: "two" },
      value: "Same city",
      description: /Based on your selected city/,
    },
    {
      state: "not shared",
      partnerLocation: null,
      value: "—",
      description: /Not shared.*Distance unavailable/,
    },
  ])(
    "keeps the love journey $state distance truthful",
    async ({ partnerLocation, value, description }) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            response({ userLocation: dubaiLocation, partnerLocation }),
          ),
      );
      render(journey({ variant: "love-journey" }));
      await screen.findByText(value);
      const row = screen.getByRole("button", { name: "Location settings" });
      await waitFor(() => expect(row).toHaveAttribute("aria-busy", "false"));
      expect(row).toHaveAccessibleDescription(description);
      expect(row).not.toHaveTextContent("0.0 km");
      expect(screen.getAllByRole("button")).toHaveLength(1);
    },
  );

  it("distinguishes loading and a failed lookup from unshared locations in the love journey row", async () => {
    let finishLookup!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            finishLookup = resolve;
          }),
      ),
    );
    render(journey({ variant: "love-journey" }));
    const row = screen.getByRole("button", { name: "Location settings" });
    expect(row).toHaveAttribute("aria-busy", "true");
    expect(row).toHaveAccessibleDescription(/Loading locations/);
    expect(row).not.toHaveTextContent("Not shared");

    await act(async () => finishLookup({ ok: false, status: 503 } as Response));
    expect(row).toHaveAttribute("aria-busy", "false");
    expect(row).toHaveAccessibleDescription(/Locations unavailable/);
    expect(row).not.toHaveTextContent("Not shared");
    expect(row).toHaveTextContent("—");
  });
});
