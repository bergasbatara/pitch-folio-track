import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOnboarding } from "./useOnboarding";

vi.mock("./useCompanyProfile", () => ({
  useCompanyProfile: vi.fn(),
}));

import { useCompanyProfile } from "./useCompanyProfile";

describe("useOnboarding", () => {
  it("marks onboarding complete when profile is complete", () => {
    vi.mocked(useCompanyProfile).mockReturnValue({
      company: { id: "company-1", updatedAt: new Date() },
      isProfileComplete: () => true,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.completed).toBe(true);
    expect(result.current.completedSteps).toEqual(["company-setup"]);
    expect(result.current.isStepCompleted("company-setup")).toBe(true);
  });
});
