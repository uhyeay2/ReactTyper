import { describe, it, expect } from "vitest";
import {
  Finger,
  FINGER_KEY_MAP,
  getNextKeyInfo,
  getFingerDisplacement,
  getShiftDisplacement,
  KEYBOARD_ROWS,
  SPACEBAR_ROW,
} from "./keyboardLayout";

describe("keyboardLayout", () => {
  describe("FINGER_KEY_MAP", () => {
    it("maps home row letters to their correct fingers", () => {
      expect(FINGER_KEY_MAP.a).toBe(Finger.LeftPinky);
      expect(FINGER_KEY_MAP.s).toBe(Finger.LeftRing);
      expect(FINGER_KEY_MAP.d).toBe(Finger.LeftMiddle);
      expect(FINGER_KEY_MAP.f).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.g).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.h).toBe(Finger.RightIndex);
      expect(FINGER_KEY_MAP.j).toBe(Finger.RightIndex);
      expect(FINGER_KEY_MAP.k).toBe(Finger.RightMiddle);
      expect(FINGER_KEY_MAP.l).toBe(Finger.RightRing);
      expect(FINGER_KEY_MAP[";"]).toBe(Finger.RightPinky);
    });

    it("maps qwerty row letters correctly", () => {
      expect(FINGER_KEY_MAP.q).toBe(Finger.LeftPinky);
      expect(FINGER_KEY_MAP.w).toBe(Finger.LeftRing);
      expect(FINGER_KEY_MAP.e).toBe(Finger.LeftMiddle);
      expect(FINGER_KEY_MAP.r).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.t).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.y).toBe(Finger.RightIndex);
      expect(FINGER_KEY_MAP.u).toBe(Finger.RightIndex);
      expect(FINGER_KEY_MAP.i).toBe(Finger.RightMiddle);
      expect(FINGER_KEY_MAP.o).toBe(Finger.RightRing);
      expect(FINGER_KEY_MAP.p).toBe(Finger.RightPinky);
    });

    it("maps bottom row letters correctly", () => {
      expect(FINGER_KEY_MAP.z).toBe(Finger.LeftPinky);
      expect(FINGER_KEY_MAP.x).toBe(Finger.LeftRing);
      expect(FINGER_KEY_MAP.c).toBe(Finger.LeftMiddle);
      expect(FINGER_KEY_MAP.v).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.b).toBe(Finger.LeftIndex);
      expect(FINGER_KEY_MAP.n).toBe(Finger.RightIndex);
      expect(FINGER_KEY_MAP.m).toBe(Finger.RightIndex);
    });

    it("maps the spacebar to the right thumb", () => {
      expect(FINGER_KEY_MAP[" "]).toBe(Finger.RightThumb);
    });
  });

  describe("getNextKeyInfo", () => {
    it("returns null when currentIndex is beyond the target text", () => {
      expect(getNextKeyInfo("abc", 3)).toBeNull();
      expect(getNextKeyInfo("abc", 5)).toBeNull();
    });

    it("returns null for empty target text", () => {
      expect(getNextKeyInfo("", 0)).toBeNull();
    });

    it("identifies a lowercase key and its finger", () => {
      const info = getNextKeyInfo("go", 0);
      expect(info).not.toBeNull();
      expect(info?.key).toBe("g");
      expect(info?.finger).toBe(Finger.LeftIndex);
      expect(info?.needsShift).toBe(false);
    });

    it("identifies a space with the right thumb", () => {
      const info = getNextKeyInfo("a b", 1);
      expect(info).not.toBeNull();
      expect(info?.key).toBe(" ");
      expect(info?.finger).toBe(Finger.RightThumb);
      expect(info?.needsShift).toBe(false);
    });

    it("flags uppercase letters as needing shift with Left Pinky", () => {
      const info = getNextKeyInfo("I", 0);
      expect(info).not.toBeNull();
      expect(info?.key).toBe("i");
      expect(info?.finger).toBe(Finger.RightMiddle);
      expect(info?.needsShift).toBe(true);
      expect(info?.shiftFinger).toBe(Finger.LeftPinky);
    });

    it("flags shifted symbol characters like ! as needing shift", () => {
      const info = getNextKeyInfo("a!b", 1);
      expect(info).not.toBeNull();
      expect(info?.key).toBe("1");
      expect(info?.needsShift).toBe(true);
    });

    it("handles unshifted symbols that do not require shift", () => {
      const info = getNextKeyInfo("a,b", 1);
      expect(info).not.toBeNull();
      expect(info?.key).toBe(",");
      expect(info?.needsShift).toBe(false);
    });

    it("maps numbers to their correct finger", () => {
      expect(getNextKeyInfo("1", 0)?.finger).toBe(Finger.LeftPinky);
      expect(getNextKeyInfo("5", 0)?.finger).toBe(Finger.LeftIndex);
      expect(getNextKeyInfo("6", 0)?.finger).toBe(Finger.RightIndex);
      expect(getNextKeyInfo("9", 0)?.finger).toBe(Finger.RightRing);
      expect(getNextKeyInfo("0", 0)?.finger).toBe(Finger.RightRing);
    });

    it("returns null for characters with no keyboard mapping", () => {
      expect(getNextKeyInfo("a\nb", 1)).toBeNull();
      expect(getNextKeyInfo("a\tb", 1)).toBeNull();
      expect(getNextKeyInfo("a\x00b", 1)).toBeNull();
    });

    it("returns the base key and shift for escaped uppercase symbols", () => {
      expect(getNextKeyInfo("A", 0)?.key).toBe("a");
      expect(getNextKeyInfo("Z", 0)?.key).toBe("z");
      expect(getNextKeyInfo("@", 0)?.key).toBe("2");
      expect(getNextKeyInfo("#", 0)?.key).toBe("3");
      expect(getNextKeyInfo("?", 0)?.key).toBe("/");
    });

    it("treats unshifted punctuation without a shift requirement", () => {
      expect(getNextKeyInfo(";", 0)).not.toBeNull();
      expect(getNextKeyInfo(".", 0)?.needsShift).toBe(false);
    });
  });

  describe("layout integrity", () => {
    it("has 4 main rows plus a spacebar row", () => {
      expect(KEYBOARD_ROWS).toHaveLength(4);
      expect(SPACEBAR_ROW.length).toBeGreaterThan(0);
    });

    it("contains a spacebar in the spacebar row", () => {
      const space = SPACEBAR_ROW.find((k) => k.key === " ");
      expect(space).toBeDefined();
      expect(space?.finger).toBe(Finger.RightThumb);
    });

    it("includes both left and right shift keys in the bottom row", () => {
      const bottomRow = KEYBOARD_ROWS[3];
      if (bottomRow === undefined) throw new Error("Missing bottom row");
      const shifts = bottomRow.filter((k) => k.label === "Shift");
      expect(shifts).toHaveLength(2);
    });
  });

  describe("getFingerDisplacement", () => {
    it("keeps a home-row key at rest with no movement", () => {
      expect(getFingerDisplacement(Finger.LeftPinky, "a")).toEqual({
        dx: 0,
        dy: 0,
      });
      expect(getFingerDisplacement(Finger.RightIndex, "j")).toEqual({
        dx: 0,
        dy: 0,
      });
    });

    it("reports the left index's downward rightward reach for the B key", () => {
      // 'b' is two keys right of 'f' and one row down; the finger must visibly
      // extend toward it (this reach can exceed the hand silhouette, so the SVG
      // must not clip the translated finger).
      expect(getFingerDisplacement(Finger.LeftIndex, "b")).toEqual({
        dx: 40,
        dy: 20,
      });
    });

    it("moves the left index finger up toward the R key (top row)", () => {
      const d = getFingerDisplacement(Finger.LeftIndex, "r");
      expect(d.dy).toBeLessThan(0); // extends up/away from home row
    });

    it("moves the finger down toward a bottom-row key", () => {
      const d = getFingerDisplacement(Finger.LeftIndex, "v");
      expect(d.dy).toBeGreaterThan(0);
    });

    it("keeps the thumb at rest for a space (already over the space bar)", () => {
      expect(getFingerDisplacement(Finger.RightThumb, " ")).toEqual({
        dx: 0,
        dy: 0,
      });
    });

    it("returns zero displacement for an unmapped key", () => {
      expect(getFingerDisplacement(Finger.LeftIndex, "\n")).toEqual({
        dx: 0,
        dy: 0,
      });
    });
  });

  describe("getShiftDisplacement", () => {
    it("moves the left pinky down to the left Shift key", () => {
      const d = getShiftDisplacement(Finger.LeftPinky);
      expect(d.dy).toBeGreaterThan(0);
    });

    it("moves the right pinky down to the right Shift key", () => {
      const d = getShiftDisplacement(Finger.RightPinky);
      expect(d.dy).toBeGreaterThan(0);
    });
  });
});
