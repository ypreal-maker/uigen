import { test, expect } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

function makeTool() {
  const fs = new VirtualFileSystem();
  return { fs, tool: buildStrReplaceTool(fs) };
}

test("tool has correct id", () => {
  const { tool } = makeTool();
  expect(tool.id).toBe("str_replace_editor");
});

// view command
test("view returns file content with line numbers", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.txt", "line1\nline2\nline3");

  const result = await tool.execute({ command: "view", path: "/test.txt" });

  expect(result).toBe("1\tline1\n2\tline2\n3\tline3");
});

test("view with view_range returns subset of lines", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.txt", "line1\nline2\nline3\nline4");

  const result = await tool.execute({ command: "view", path: "/test.txt", view_range: [2, 3] });

  expect(result).toBe("2\tline2\n3\tline3");
});

test("view for directory lists its contents", async () => {
  const { fs, tool } = makeTool();
  fs.createDirectory("/src");
  fs.createFile("/src/index.ts", "");

  const result = await tool.execute({ command: "view", path: "/src" });

  expect(result).toContain("[FILE] index.ts");
});

test("view for non-existent path returns error message", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({ command: "view", path: "/nonexistent.txt" });

  expect(result).toBe("File not found: /nonexistent.txt");
});

// create command
test("create creates a new file with content", async () => {
  const { fs, tool } = makeTool();

  const result = await tool.execute({
    command: "create",
    path: "/App.jsx",
    file_text: "export default function App() {}",
  });

  expect(result).toBe("File created: /App.jsx");
  expect(fs.readFile("/App.jsx")).toBe("export default function App() {}");
});

test("create with no file_text creates empty file", async () => {
  const { fs, tool } = makeTool();

  await tool.execute({ command: "create", path: "/empty.js" });

  expect(fs.readFile("/empty.js")).toBe("");
});

test("create automatically creates parent directories", async () => {
  const { fs, tool } = makeTool();

  await tool.execute({
    command: "create",
    path: "/src/components/Button.jsx",
    file_text: "export default function Button() {}",
  });

  expect(fs.exists("/src")).toBe(true);
  expect(fs.exists("/src/components")).toBe(true);
  expect(fs.readFile("/src/components/Button.jsx")).toBe(
    "export default function Button() {}"
  );
});

test("create returns error when file already exists", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/existing.js", "original");

  const result = await tool.execute({
    command: "create",
    path: "/existing.js",
    file_text: "new content",
  });

  expect(result).toBe("Error: File already exists: /existing.js");
  expect(fs.readFile("/existing.js")).toBe("original");
});

// str_replace command
test("str_replace replaces a substring in a file", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "const x = 1;");

  await tool.execute({
    command: "str_replace",
    path: "/test.js",
    old_str: "x = 1",
    new_str: "x = 42",
  });

  expect(fs.readFile("/test.js")).toBe("const x = 42;");
});

test("str_replace replaces all occurrences and returns count", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "foo bar foo baz foo");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.js",
    old_str: "foo",
    new_str: "hello",
  });

  expect(result).toBe("Replaced 3 occurrence(s) of the string in /test.js");
  expect(fs.readFile("/test.js")).toBe("hello bar hello baz hello");
});

test("str_replace returns error when old_str not found", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "hello world");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.js",
    old_str: "notfound",
    new_str: "replaced",
  });

  expect(result).toBe('Error: String not found in file: "notfound"');
});

test("str_replace returns error for non-existent file", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({
    command: "str_replace",
    path: "/missing.js",
    old_str: "old",
    new_str: "new",
  });

  expect(result).toBe("Error: File not found: /missing.js");
});

test("str_replace with empty old_str returns error", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "some content");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.js",
    old_str: "",
    new_str: "new",
  });

  expect(result).toContain("Error:");
});

// insert command
test("insert inserts text at the specified line", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "line1\nline2\nline3");

  await tool.execute({
    command: "insert",
    path: "/test.js",
    insert_line: 1,
    new_str: "inserted",
  });

  expect(fs.readFile("/test.js")).toBe("line1\ninserted\nline2\nline3");
});

test("insert at line 0 prepends content", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "line1\nline2");

  await tool.execute({
    command: "insert",
    path: "/test.js",
    insert_line: 0,
    new_str: "first",
  });

  expect(fs.readFile("/test.js")).toBe("first\nline1\nline2");
});

test("insert defaults to line 0 when insert_line not provided", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "line1\nline2");

  await tool.execute({
    command: "insert",
    path: "/test.js",
    new_str: "prepended",
  });

  expect(fs.readFile("/test.js")).toBe("prepended\nline1\nline2");
});

test("insert returns error for invalid line number", async () => {
  const { fs, tool } = makeTool();
  fs.createFile("/test.js", "line1\nline2");

  const result = await tool.execute({
    command: "insert",
    path: "/test.js",
    insert_line: 999,
    new_str: "text",
  });

  expect(result).toContain("Error: Invalid line number");
});

test("insert returns error for non-existent file", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({
    command: "insert",
    path: "/missing.js",
    insert_line: 0,
    new_str: "text",
  });

  expect(result).toBe("Error: File not found: /missing.js");
});

// undo_edit command
test("undo_edit returns not supported error", async () => {
  const { tool } = makeTool();

  const result = await tool.execute({ command: "undo_edit", path: "/test.js" });

  expect(result).toContain("undo_edit");
  expect(result).toContain("not supported");
});
