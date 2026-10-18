/**
 * The house easings (DESIGN.md "The craft rules"; Bao's Standard rule 23),
 * registered once for GSAP and shared by every page:
 * - OUT, for anything arriving or answering a press: cubic-bezier(0.23, 1, 0.32, 1)
 * - MOVE, for something travelling across the screen: cubic-bezier(0.77, 0, 0.175, 1)
 * Use these instead of GSAP's built-in power/sine/back/elastic curves.
 */
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

export const OUT = CustomEase.get("house-out") || CustomEase.create("house-out", "0.23,1,0.32,1");
export const MOVE = CustomEase.get("house-move") || CustomEase.create("house-move", "0.77,0,0.175,1");
