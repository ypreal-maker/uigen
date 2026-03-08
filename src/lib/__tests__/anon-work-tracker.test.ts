import { test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

beforeEach(() => {
  sessionStorage.clear();
});

// setHasAnonWork
test("setHasAnonWork stores flag and data when messages exist", () => {
  const messages = [{ id: "1", role: "user", content: "hello" }];
  const fsData = { "/": { type: "directory" } };

  setHasAnonWork(messages, fsData);

  expect(getHasAnonWork()).toBe(true);
});

test("setHasAnonWork stores data when file system has more than root", () => {
  setHasAnonWork([], {
    "/": { type: "directory" },
    "/App.jsx": { type: "file", content: "code" },
  });

  expect(getHasAnonWork()).toBe(true);
});

test("setHasAnonWork does not store when empty messages and only root in FS", () => {
  setHasAnonWork([], { "/": { type: "directory" } });

  expect(getHasAnonWork()).toBe(false);
});

test("setHasAnonWork does not store when both messages and FS are empty", () => {
  setHasAnonWork([], {});

  expect(getHasAnonWork()).toBe(false);
});

// getHasAnonWork
test("getHasAnonWork returns false when nothing has been stored", () => {
  expect(getHasAnonWork()).toBe(false);
});

test("getHasAnonWork returns true after setHasAnonWork is called with content", () => {
  setHasAnonWork([{ id: "1", role: "user", content: "test" }], {});
  expect(getHasAnonWork()).toBe(true);
});

// getAnonWorkData
test("getAnonWorkData returns stored messages and fileSystemData", () => {
  const messages = [{ id: "1", role: "user", content: "test" }];
  const fsData = { "/": { type: "directory" }, "/App.jsx": { content: "code" } };

  setHasAnonWork(messages, fsData);
  const data = getAnonWorkData();

  expect(data).not.toBeNull();
  expect(data?.messages).toEqual(messages);
  expect(data?.fileSystemData).toEqual(fsData);
});

test("getAnonWorkData returns null when nothing stored", () => {
  expect(getAnonWorkData()).toBeNull();
});

test("getAnonWorkData returns null when stored data is invalid JSON", () => {
  sessionStorage.setItem("uigen_anon_data", "{ invalid json {{");

  expect(getAnonWorkData()).toBeNull();
});

// clearAnonWork
test("clearAnonWork removes the stored flag and data", () => {
  setHasAnonWork([{ id: "1", role: "user", content: "hello" }], {
    "/": {},
    "/App.jsx": {},
  });

  clearAnonWork();

  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();
});

test("clearAnonWork is a no-op when nothing is stored", () => {
  expect(() => clearAnonWork()).not.toThrow();
  expect(getHasAnonWork()).toBe(false);
});

// round-trip
test("data survives a full set → get → clear cycle", () => {
  const messages = [
    { id: "1", role: "user", content: "Create a button" },
    { id: "2", role: "assistant", content: "Here you go!" },
  ];
  const fsData = {
    "/": { type: "directory" },
    "/App.jsx": { type: "file", content: "export default function App() {}" },
  };

  setHasAnonWork(messages, fsData);

  expect(getHasAnonWork()).toBe(true);
  const data = getAnonWorkData();
  expect(data?.messages).toEqual(messages);
  expect(data?.fileSystemData).toEqual(fsData);

  clearAnonWork();

  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();
});
