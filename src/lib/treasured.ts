/** Treasured: rating 5, the column the phone app already reads. One star, on or off. */
import type { Memory } from "../data/stories";

export const TREASURED = 5;
export const isTreasured = (m: Memory) => (m.rating || 0) >= TREASURED;
