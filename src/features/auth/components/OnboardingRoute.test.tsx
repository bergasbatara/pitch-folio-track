import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingRoute } from "./OnboardingRoute";

const authState = {
  user: { id: "user-1" } as { id: string } | null,
  isLoading: false,
};

const onboardingState = {
  completed: false,
  isLoading: false,
};

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/features/onboarding", () => ({
  useOnboarding: () => onboardingState,
}));

describe("OnboardingRoute", () => {
  beforeEach(() => {
    authState.user = { id: "user-1" };
    authState.isLoading = false;
    onboardingState.completed = false;
    onboardingState.isLoading = false;
  });

  it("renders a spinner while route state is loading", () => {
    onboardingState.isLoading = true;

    const { container } = render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <OnboardingRoute>
          <div>onboarding content</div>
        </OnboardingRoute>
      </MemoryRouter>,
    );

    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects unauthenticated users to login", () => {
    authState.user = null;

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <div>onboarding content</div>
              </OnboardingRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects completed users back to the dashboard", () => {
    onboardingState.completed = true;

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <div>onboarding content</div>
              </OnboardingRoute>
            }
          />
          <Route path="/" element={<div>dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("renders children for users still onboarding", () => {
    render(
      <MemoryRouter>
        <OnboardingRoute>
          <div>onboarding content</div>
        </OnboardingRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("onboarding content")).toBeInTheDocument();
  });
});
