import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const authState = {
  user: { id: "user-1" } as { id: string } | null,
  isLoading: false,
};

const onboardingState = {
  completed: true,
  isLoading: false,
};

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/features/onboarding", () => ({
  useOnboarding: () => onboardingState,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState.user = { id: "user-1" };
    authState.isLoading = false;
    onboardingState.completed = true;
    onboardingState.isLoading = false;
  });

  it("renders a spinner while auth or onboarding is loading", () => {
    authState.isLoading = true;

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>private content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects unauthenticated users to login", () => {
    authState.user = null;

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>private content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects unfinished users to onboarding", () => {
    onboardingState.completed = false;

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>private content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding/welcome" element={<div>onboarding page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("onboarding page")).toBeInTheDocument();
  });

  it("renders children for authenticated users with completed onboarding", () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>private content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("private content")).toBeInTheDocument();
  });
});
