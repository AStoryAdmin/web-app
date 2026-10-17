/**
 * The loading mark: the heart of the A draws itself in one stroke while a
 * page is on its way, then the gold bars inside it appear. Under a second,
 * and it still draws under reduced motion (a line being drawn is quieter
 * than a spinner). The paths are the mark's own (brandArt.ts), on a
 * viewBox that holds just the heart.
 */
export default function LoadingMark() {
  return (
    <div className="loading-mark" aria-hidden="true">
      <svg viewBox="130 246 160 128" focusable="false">
        <path
          className="heart"
          d="M 161.8 258.3 C 146.5 264.8, 138.8 278.5, 140.4 296.2 C 142.1 315, 152.1 326, 177.5 337 C 192.4 343.4, 196.7 345.7, 201.1 349.7 C 205.2 353.4, 209 359.6, 210 362.5 C 211 359.6, 214.8 353.4, 218.9 349.7 C 223.4 345.6, 228 343.1, 242.4 337 C 269.9 325.4, 279.6 313.4, 279.4 291.5 C 279.3 275.9, 273.5 266, 260.8 259.3 C 255.9 256.7, 254.7 256.5, 244 256.5 C 229.8 256.5, 228.5 257.1, 220.5 267.9 C 211.5 280, 208.5 280, 199.5 267.9 C 191.9 257.6, 190.1 256.7, 177.5 256.3 C 168.7 256, 166.8 256.2, 161.8 258.3 Z"
        />
        <g className="bars">
          <rect x="174.3" y="272" width="8.3" height="53" rx="4.1" />
          <rect x="190" y="280.5" width="8.2" height="54" rx="4.1" />
          <rect x="205.9" y="283.4" width="8.2" height="61" rx="4.1" />
          <rect x="221.8" y="278.2" width="8.2" height="55" rx="4.1" />
          <rect x="237.7" y="272.5" width="8.1" height="51" rx="4" />
          <rect x="158.3" y="283.1" width="8.5" height="26" rx="4.2" />
          <rect x="253.5" y="283.3" width="8.2" height="26" rx="4.1" />
        </g>
      </svg>
    </div>
  );
}
