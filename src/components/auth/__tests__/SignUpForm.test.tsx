import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockSignUp = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({ signIn: vi.fn(), signUp: mockSignUp, isLoading: false });
});

afterEach(() => {
  cleanup();
});

test("renders email, password, and confirm password fields", () => {
  render(<SignUpForm />);

  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByLabelText("Confirm Password")).toBeDefined();
});

test("renders Sign Up submit button", () => {
  render(<SignUpForm />);

  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("shows minimum password length hint", () => {
  render(<SignUpForm />);

  expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
});

test("shows error when passwords do not match", async () => {
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "different456");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  expect(screen.getByText("Passwords do not match")).toBeDefined();
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("calls signUp when passwords match", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignUp).toHaveBeenCalledWith("user@example.com", "password123");
  });
});

test("calls onSuccess after successful sign up", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  render(<SignUpForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});

test("does not call onSuccess when sign up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already in use" });
  const onSuccess = vi.fn();
  render(<SignUpForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

test("displays server error message on sign up failure", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already in use" });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Email already in use")).toBeDefined();
  });
});

test("displays generic error message when error is undefined", async () => {
  mockSignUp.mockResolvedValue({ success: false });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Failed to sign up")).toBeDefined();
  });
});

test("clears password mismatch error on next valid submit", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  render(<SignUpForm />);

  // Trigger mismatch error first
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "different");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);
  expect(screen.getByText("Passwords do not match")).toBeDefined();

  // Fix the confirm password and resubmit
  await userEvent.clear(screen.getByLabelText("Confirm Password"));
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.queryByText("Passwords do not match")).toBeNull();
  });
});

test("disables all inputs while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: vi.fn(), signUp: mockSignUp, isLoading: true });
  render(<SignUpForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Confirm Password")).toHaveProperty("disabled", true);
});

test("disables submit button while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: vi.fn(), signUp: mockSignUp, isLoading: true });
  render(<SignUpForm />);

  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("shows 'Creating account...' text on button while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: vi.fn(), signUp: mockSignUp, isLoading: true });
  render(<SignUpForm />);

  expect(screen.getByRole("button").textContent).toBe("Creating account...");
});

test("does not show error initially", () => {
  render(<SignUpForm />);

  expect(screen.queryByText("Passwords do not match")).toBeNull();
  expect(screen.queryByText("Failed to sign up")).toBeNull();
});
