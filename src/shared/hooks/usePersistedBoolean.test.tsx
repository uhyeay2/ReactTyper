import { act, renderHook } from "@testing-library/react";
import { usePersistedBoolean } from "./usePersistedBoolean";

describe("usePersistedBoolean", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the default value when nothing is stored", () => {
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", true),
    );
    expect(result.current[0]).toBe(true);
  });

  it("returns false when the default is false and nothing is stored", () => {
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", false),
    );
    expect(result.current[0]).toBe(false);
  });

  it("reads a stored true value over the default", () => {
    window.localStorage.setItem("test-key", "true");
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", false),
    );
    expect(result.current[0]).toBe(true);
  });

  it("reads a stored false value over the default", () => {
    window.localStorage.setItem("test-key", "false");
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", true),
    );
    expect(result.current[0]).toBe(false);
  });

  it("falls back to false for an unrecognized stored value", () => {
    window.localStorage.setItem("test-key", "yes");
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", true),
    );
    expect(result.current[0]).toBe(false);
  });

  it("writes updates to localStorage", () => {
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key", false),
    );

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem("test-key")).toBe("true");
  });

  it("uses the same storage key for read and write", () => {
    const { result } = renderHook(() =>
      usePersistedBoolean("test-key-a", false),
    );
    window.localStorage.setItem("test-key-b", "true");

    act(() => {
      result.current[1](true);
    });

    expect(window.localStorage.getItem("test-key-a")).toBe("true");
    expect(window.localStorage.getItem("test-key-b")).toBe("true");
  });
});