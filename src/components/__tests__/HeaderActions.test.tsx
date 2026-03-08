import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HeaderActions } from "@/components/HeaderActions";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn().mockResolvedValue({ id: "new-proj-id" }),
}));

vi.mock("@/components/auth/AuthDialog", () => ({
  AuthDialog: ({ open, defaultMode }: { open: boolean; defaultMode: string }) =>
    open ? <div data-testid="auth-dialog" data-mode={defaultMode} /> : null,
}));

vi.mock("lucide-react", () => ({
  Plus: () => <span>Plus</span>,
  LogOut: () => <span>LogOut</span>,
  FolderOpen: () => <span>FolderOpen</span>,
  ChevronDown: () => <span>ChevronDown</span>,
}));

// Simplify Radix/Cmdk primitives to plain HTML so interactions work
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandInput: ({ placeholder, value, onValueChange }: any) => (
    <input
      data-testid="command-input"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, value }: any) => (
    <button data-testid="command-item" onClick={() => onSelect?.(value)}>
      {children}
    </button>
  ),
}));

// Import mocked modules for assertions
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "new-proj-id" });
  mockPush.mockClear();
});

afterEach(() => {
  cleanup();
});

// Unauthenticated state
test("shows Sign In and Sign Up buttons when user is not logged in", () => {
  render(<HeaderActions />);

  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("auth dialog is hidden by default", () => {
  render(<HeaderActions />);

  expect(screen.queryByTestId("auth-dialog")).toBeNull();
});

test("opens auth dialog in signin mode when Sign In is clicked", async () => {
  render(<HeaderActions />);

  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => {
    const dialog = screen.getByTestId("auth-dialog");
    expect(dialog.getAttribute("data-mode")).toBe("signin");
  });
});

test("opens auth dialog in signup mode when Sign Up is clicked", async () => {
  render(<HeaderActions />);

  fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() => {
    const dialog = screen.getByTestId("auth-dialog");
    expect(dialog.getAttribute("data-mode")).toBe("signup");
  });
});

// Authenticated state
test("shows New Design button for authenticated user", async () => {
  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} />);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /New Design/i })).toBeDefined();
  });
});

test("shows sign out button for authenticated user", async () => {
  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} />);

  await waitFor(() => {
    expect(screen.getByTitle("Sign out")).toBeDefined();
  });
});

test("calls signOut when sign out button is clicked", async () => {
  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} />);

  await waitFor(() => screen.getByTitle("Sign out"));
  fireEvent.click(screen.getByTitle("Sign out"));

  expect(signOut).toHaveBeenCalledOnce();
});

test("creates a project and navigates when New Design is clicked", async () => {
  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} />);

  await waitFor(() => screen.getByRole("button", { name: /New Design/i }));
  fireEvent.click(screen.getByRole("button", { name: /New Design/i }));

  await waitFor(() => {
    expect(createProject).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/new-proj-id");
  });
});

test("shows current project name in project switcher", async () => {
  (getProjects as any).mockResolvedValue([
    { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
    { id: "proj-2", name: "Other Project", createdAt: new Date(), updatedAt: new Date() },
  ]);

  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} projectId="proj-1" />);

  await waitFor(() => {
    // "My Project" appears in the combobox trigger button (as the current project label)
    const matches = screen.getAllByText("My Project");
    expect(matches.length).toBeGreaterThan(0);
  });
});

test("shows 'Select Project' when projectId does not match any project", async () => {
  (getProjects as any).mockResolvedValue([
    { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
  ]);

  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} projectId="unknown-id" />);

  await waitFor(() => {
    expect(screen.getByText("Select Project")).toBeDefined();
  });
});

test("filters projects based on search input", async () => {
  (getProjects as any).mockResolvedValue([
    { id: "1", name: "Alpha Project", createdAt: new Date(), updatedAt: new Date() },
    { id: "2", name: "Beta Project", createdAt: new Date(), updatedAt: new Date() },
    { id: "3", name: "Gamma Project", createdAt: new Date(), updatedAt: new Date() },
  ]);

  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} projectId="1" />);

  await waitFor(() => screen.getByTestId("command-input"));
  fireEvent.change(screen.getByTestId("command-input"), { target: { value: "Beta" } });

  await waitFor(() => {
    const items = screen.getAllByTestId("command-item");
    const texts = items.map((i) => i.textContent);
    expect(texts.some((t) => t?.includes("Beta Project"))).toBe(true);
    expect(texts.some((t) => t?.includes("Alpha Project"))).toBe(false);
  });
});

test("navigates to selected project when command item is clicked", async () => {
  (getProjects as any).mockResolvedValue([
    { id: "proj-abc", name: "Target Project", createdAt: new Date(), updatedAt: new Date() },
  ]);

  render(<HeaderActions user={{ id: "u1", email: "a@b.com" }} projectId="proj-abc" />);

  await waitFor(() => screen.getByTestId("command-item"));
  fireEvent.click(screen.getByTestId("command-item"));

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/proj-abc");
  });
});
