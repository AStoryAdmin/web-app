import { describe, expect, it } from "vitest";
import { renditionWidth } from "./photoUrls";

describe("the rendition a frame asks for", () => {
  it("is the frame in device pixels, in two steps, else the original", () => {
    expect(renditionWidth(170, 1, 1)).toBe(400); // a phone print
    expect(renditionWidth(244, 1, 2)).toBe(600); // Home at 1366 on a 2x screen: 488
    expect(renditionWidth(363, 1.3, 1.5)).toBeUndefined(); // 2560 at zoom 1.3, density 1.5: 708, the original
    expect(renditionWidth(0, 1, 1)).toBeUndefined(); // not laid out: the original, never a guess
  });
});
