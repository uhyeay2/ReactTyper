import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

interface ReactActEnvironmentGlobal {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}

// React 19 requires the act() environment to be flagged so callbacks queued by
// user events and async effects are tracked correctly under Vitest. Kept on
// for the whole suite so React never degrades to non-act rendering.
(globalThis as ReactActEnvironmentGlobal).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
