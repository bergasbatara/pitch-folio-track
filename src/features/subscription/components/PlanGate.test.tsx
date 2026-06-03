import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanGate } from "./PlanGate";

const planAccessState = {
  hasAccess: vi.fn<(pathname: string) => boolean>(),
  isLoading: false,
};

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../hooks/usePlanAccess", () => ({
  usePlanAccess: () => planAccessState,
}));

describe("PlanGate", () => {
  beforeEach(() => {
    planAccessState.hasAccess.mockReset();
    planAccessState.hasAccess.mockReturnValue(true);
    planAccessState.isLoading = false;
  });

  it("renders children immediately for unprotected routes", () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <PlanGate>
          <div>open page</div>
        </PlanGate>
      </MemoryRouter>,
    );

    expect(screen.getByText("open page")).toBeInTheDocument();
  });

  it("renders a loading spinner while plan access is loading", () => {
    planAccessState.isLoading = true;

    const { container } = render(
      <MemoryRouter initialEntries={["/audit-draft"]}>
        <PlanGate>
          <div>protected page</div>
        </PlanGate>
      </MemoryRouter>,
    );

    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("renders the locked state when the user lacks access", () => {
    planAccessState.hasAccess.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/audit-draft"]}>
        <PlanGate featureName="Audit Draft">
          <div>protected page</div>
        </PlanGate>
      </MemoryRouter>,
    );

    expect(screen.getByText("Halaman Terkunci")).toBeInTheDocument();
    expect(screen.getByText(/Audit Draft/)).toBeInTheDocument();
  });

  it("renders children for protected routes when access is granted", () => {
    planAccessState.hasAccess.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/audit-draft"]}>
        <PlanGate>
          <div>protected page</div>
        </PlanGate>
      </MemoryRouter>,
    );

    expect(screen.getByText("protected page")).toBeInTheDocument();
  });
});
