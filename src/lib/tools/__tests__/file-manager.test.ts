import { test, expect, vi } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";

// Mock the ai module so tool() is transparent
vi.mock("ai", () => ({
  tool: (config: any) => config,
}));

// Import after mock is set up
const { buildFileManagerTool } = await import("@/lib/tools/file-manager");

function makeTool() {
  const fs = new VirtualFileSystem();
  return { fs, tool: buildFileManagerTool(fs) };
}

// rename command
test("rename moves a file to a new path", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/old.js", "content");

  const result = await tool.execute({ command: "rename", path: "/old.js", new_path: "/new.js" });

  expect(result).toEqual({
    success: true,
    message: "Successfully renamed /old.js to /new.js",
  });
  expect(fs.exists("/old.js")).toBe(false);
  expect(fs.readFile("/new.js")).toBe("content");
});

test("rename moves a file into a different directory", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "code");

  await tool.execute({ command: "rename", path: "/test.js", new_path: "/src/test.js" });

  expect(fs.exists("/test.js")).toBe(false);
  expect(fs.exists("/src/test.js")).toBe(true);
});

test("rename creates parent directories as needed", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "code");

  await tool.execute({ command: "rename", path: "/test.js", new_path: "/a/b/c/test.js" });

  expect(fs.exists("/a/b/c/test.js")).toBe(true);
});

test("rename renames a directory and all its children", async () => {
  const { fs, tool } = makeTool();
  fs.createDirectory("/src");
  fs.createFile("/src/index.js", "code");

  await tool.execute({ command: "rename", path: "/src", new_path: "/app" });

  expect(fs.exists("/src")).toBe(false);
  expect(fs.exists("/app")).toBe(true);
  expect(fs.exists("/app/index.js")).toBe(true);
});

test("rename returns error when new_path is missing", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "code");

  const result = await tool.execute({ command: "rename", path: "/test.js" });

  expect(result).toEqual({
    success: false,
    error: "new_path is required for rename command",
  });
  expect(fs.exists("/test.js")).toBe(true);
});

test("rename returns error when source does not exist", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({
    command: "rename",
    path: "/nonexistent.js",
    new_path: "/new.js",
  });

  expect(result).toEqual({
    success: false,
    error: "Failed to rename /nonexistent.js to /new.js",
  });
});

test("rename returns error when destination already exists", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/source.js", "source");
  fs.createFile("/dest.js", "dest");

  const result = await tool.execute({
    command: "rename",
    path: "/source.js",
    new_path: "/dest.js",
  });

  expect(result.success).toBe(false);
  expect(fs.readFile("/source.js")).toBe("source");
  expect(fs.readFile("/dest.js")).toBe("dest");
});

// delete command
test("delete removes a file", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "code");

  const result = await tool.execute({ command: "delete", path: "/test.js" });

  expect(result).toEqual({
    success: true,
    message: "Successfully deleted /test.js",
  });
  expect(fs.exists("/test.js")).toBe(false);
});

test("delete removes a directory and all its children", async () => {
  const { fs, tool } = makeTool();
  fs.createDirectory("/src");
  fs.createFile("/src/index.js", "code");
  fs.createFile("/src/utils.js", "helpers");

  const result = await tool.execute({ command: "delete", path: "/src" });

  expect(result.success).toBe(true);
  expect(fs.exists("/src")).toBe(false);
  expect(fs.exists("/src/index.js")).toBe(false);
});

test("delete returns error when file does not exist", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({ command: "delete", path: "/nonexistent.js" });

  expect(result).toEqual({
    success: false,
    error: "Failed to delete /nonexistent.js",
  });
});

test("delete returns error when trying to delete root", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({ command: "delete", path: "/" });

  expect(result.success).toBe(false);
});
