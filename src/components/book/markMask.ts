/**
 * The A Story mark as a CSS mask image, for the endpapers (the mark
 * repeated in the cover colour), the title page, the lesson's watermark and
 * the last page. Drawn from the same paths as the app's icon, so it cannot
 * drift from the brand.
 */
import { LOGO, MARK_PATH, BARS_PATH } from "../../app-core/theme/logoPaths.js";

const { size, translate, scale } = LOGO as { size: number; translate: number[]; scale: number };

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><g transform="translate(${translate[0]} ${translate[1]}) scale(${scale})"><path d="${MARK_PATH}" fill="#000" fill-rule="evenodd"/><path d="${BARS_PATH}" fill="#000" fill-rule="evenodd"/></g></svg>`;

export const MARK_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}")`;
