import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
  mockPush.mockClear();
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "new-proj" });
});

// signIn
test("signIn calls signInAction with the provided credentials", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "bad" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
});

test("signIn returns the result from signInAction", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());
  let outcome: any;
  await act(async () => {
    outcome = await result.current.signIn("user@example.com", "wrong");
  });

  expect(outcome).toEqual({ success: false, error: "Invalid credentials" });
});

test("isLoading is true while signIn is in progress and false after", async () => {
  let resolve: (v: any) => void;
  (signInAction as any).mockReturnValue(new Promise((r) => (resolve = r)));

  const { result } = renderHook(() => useAuth());

  act(() => {
    result.current.signIn("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolve!({ success: false });
  });

  expect(result.current.isLoading).toBe(false);
});

test("after successful signIn with existing projects, navigates to most recent project", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getProjects as any).mockResolvedValue([
    { id: "proj-latest", name: "Latest" },
    { id: "proj-old", name: "Old" },
  ]);

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/proj-latest");
});

test("after successful signIn with no projects, creates a new project and navigates", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "brand-new" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/brand-new");
});

test("after successful signIn with anonymous work, saves it as a project and navigates", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  const anonMessages = [{ id: "1", role: "user", content: "hello" }];
  const anonFsData = { "/": {}, "/App.jsx": { content: "code" } };
  (getAnonWorkData as any).mockReturnValue({ messages: anonMessages, fileSystemData: anonFsData });
  (createProject as any).mockResolvedValue({ id: "anon-saved" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: anonMessages, data: anonFsData })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-saved");
});

test("failed signIn does not navigate or save projects", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "bad password" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "wrong");
  });

  expect(mockPush).not.toHaveBeenCalled();
  expect(createProject).not.toHaveBeenCalled();
});

// signUp
test("signUp calls signUpAction with the provided credentials", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "taken" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signUp("new@example.com", "newpass123");
  });

  expect(signUpAction).toHaveBeenCalledWith("new@example.com", "newpass123");
});

test("signUp returns the result from signUpAction", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "Email taken" });

  const { result } = renderHook(() => useAuth());
  let outcome: any;
  await act(async () => {
    outcome = await result.current.signUp("taken@example.com", "password");
  });

  expect(outcome).toEqual({ success: false, error: "Email taken" });
});

test("isLoading is true while signUp is in progress and false after", async () => {
  let resolve: (v: any) => void;
  (signUpAction as any).mockReturnValue(new Promise((r) => (resolve = r)));

  const { result } = renderHook(() => useAuth());

  act(() => {
    result.current.signUp("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolve!({ success: false });
  });

  expect(result.current.isLoading).toBe(false);
});

test("after successful signUp, runs same post-sign-in flow", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getProjects as any).mockResolvedValue([{ id: "user-proj", name: "First" }]);

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signUp("new@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/user-proj");
});

test("failed signUp does not navigate", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "server error" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signUp("new@example.com", "password");
  });

  expect(mockPush).not.toHaveBeenCalled();
});

// initial state
test("isLoading starts as false", () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);
});

test("exposes signIn, signUp, and isLoading", () => {
  const { result } = renderHook(() => useAuth());

  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
  expect(typeof result.current.isLoading).toBe("boolean");
});
