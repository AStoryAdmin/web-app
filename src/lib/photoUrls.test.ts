import { describe, expect, it } from "vitest";
import { renditionTransform, renditionWidth } from "./photoUrls";

describe("the rendition a frame asks for", () => {
  it("is the frame in device pixels, in two steps, else the original", () => {
    expect(renditionWidth(130, 1, 1, 130)).toBe(400); // a small square thumbnail: 195 needed
    expect(renditionWidth(244, 1, 1.5, 0)).toBe(400); // width only: 366
    expect(renditionWidth(363, 1.3, 1.5, 363)).toBeUndefined(); // 2560 at zoom 1.3, density 1.5: the original
    expect(renditionWidth(0, 1, 1, 0)).toBeUndefined(); // not laid out: the original, never a guess
  });
  it("covers a 3:2 photograph in the 3:4 phone frame by its height, never upscaling it", () => {
    // the Archive's phone print, 158×211 CSS px at density 2: a 3:2 landscape fills it by height, 211 × 1.5 × 2 = 633
    // device px wide, more than the 600 step, so the original is used
    expect(renditionWidth(158, 1, 2, 211)).toBeUndefined();
    // the same frame at density 1: 317 px needed, so 400
    expect(renditionWidth(158, 1, 1, 211)).toBe(400);
    // a square print at 1366, density 1.5: 232 × 1.5 × 1.5 = 522, so 600 (a width-only rule asked 400, upscaling 1.3×)
    expect(renditionWidth(232, 1, 1.5, 232)).toBe(600);
  });
  it("keeps the photograph's own ratio: a width with contain, never a height that would re-crop it", () => {
    expect(renditionTransform(600)).toEqual({ width: 600, resize: "contain" });
    expect(renditionTransform(600)).not.toHaveProperty("height");
  });
});
