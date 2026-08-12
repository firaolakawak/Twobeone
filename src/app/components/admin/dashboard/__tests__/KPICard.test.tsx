import { render } from "@testing-library/react";
import { Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import { KPICard } from "../KPICard";

describe("KPICard", () => {
  it("matches the accessible KPI snapshot", async () => {
    const { container, findByRole } = render(
      <KPICard
        label="Active couples"
        value="1,248"
        trend={{ direction: "up", value: "8%" }}
        sparklineData={[10, 14, 13, 19, 24]}
        icon={<Users />}
      />,
    );

    await findByRole("img", { name: "Active couples trend" });
    expect(container.firstChild).toMatchSnapshot();
  });
});
