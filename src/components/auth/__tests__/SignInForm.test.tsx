import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "@/components/auth/SignInForm";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockSignIn = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, signUp: vi.fn(), isLoading: false });
});

afterEach(() => {
  cleanup();
});

test("renders email and password fields", () => {
  render(<SignInForm />);

  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
});

test("renders Sign In submit button", () => {
  render(<SignInForm />);

  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
});

test("calls signIn with email and password on submit", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
  });
});

test("calls onSuccess after successful sign in", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  render(<SignInForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});

test("does not call onSuccess when sign in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const onSuccess = vi.fn();
  render(<SignInForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrongpass");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

test("displays error message from signIn failure", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  render(<SignInForm />);

  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Invalid credentials")).toBeDefined();
  });
});

test("displays generic error message when error is undefined", async () => {
  mockSignIn.mockResolvedValue({ success: false });
  render(<SignInForm />);

  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Failed to sign in")).toBeDefined();
  });
});

test("clears previous error on a new submit attempt", async () => {
  mockSignIn
    .mockResolvedValueOnce({ success: false, error: "Wrong password" })
    .mockResolvedValueOnce({ success: true });
  render(<SignInForm />);

  const form = screen.getByRole("button", { name: "Sign In" }).closest("form")!;

  fireEvent.submit(form);
  await waitFor(() => screen.getByText("Wrong password"));

  fireEvent.submit(form);
  await waitFor(() => {
    expect(screen.queryByText("Wrong password")).toBeNull();
  });
});

test("disables email and password fields while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, signUp: vi.fn(), isLoading: true });
  render(<SignInForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
});

test("disables submit button while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, signUp: vi.fn(), isLoading: true });
  render(<SignInForm />);

  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("shows 'Signing in...' text on button while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, signUp: vi.fn(), isLoading: true });
  render(<SignInForm />);

  expect(screen.getByRole("button").textContent).toBe("Signing in...");
});

test("does not show error initially", () => {
  render(<SignInForm />);

  expect(screen.queryByText("Failed to sign in")).toBeNull();
  expect(screen.queryByText("Invalid credentials")).toBeNull();
});
