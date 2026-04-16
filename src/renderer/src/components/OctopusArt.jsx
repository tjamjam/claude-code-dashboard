/**
 * SVG recreation of the block-character octopus:
 *
 *    ▗▀▀▀▖
 *    ▐█  █▌
 *    ▐    ▌
 *   ▗▜▄▄▄▛▖
 *  ▗▘▗▘ ▝▖▝▖
 * ▝▘ ▘    ▝ ▝▘
 *
 * Each character cell = 2×2 sub-pixels on the grid.
 * Y-axis doubled to match monospace character proportions (~2:1 height:width).
 */
export default function OctopusArt({ width = 96 }) {
  return (
    <svg
      width={width}
      viewBox="0 0 24 20"
      style={{ shapeRendering: 'crispEdges', display: 'block' }}
      aria-hidden="true"
    >
      {/* Head fill */}
      <rect x="8" y="2" width="6" height="8" fill="#ffffff"/>
      {/* Head top — ▀▀▀ */}
      <rect x="8" y="0" width="6" height="2" fill="#ffffff"/>
      {/* Head left wall — ▗ + ▐ + ▐ + ▜ continuous column */}
      <rect x="7" y="2" width="1" height="12" fill="#ffffff"/>
      {/* Head top-right — ▖ */}
      <rect x="14" y="2" width="1" height="2" fill="#ffffff"/>
      {/* Right wall — ▌ extended for extra row */}
      <rect x="14" y="4" width="1" height="6" fill="#ffffff"/>
      {/* Body transition — ▜ upper-left + ▛ upper */}
      <rect x="6" y="10" width="1" height="2" fill="#ffffff"/>
      <rect x="14" y="10" width="2" height="2" fill="#ffffff"/>
      {/* Body bottom — ▗ + ▄▄▄ + ▛ lower-left + ▖ */}
      <rect x="5" y="12" width="1" height="2" fill="#ffffff"/>
      <rect x="8" y="12" width="7" height="2" fill="#ffffff"/>
      <rect x="16" y="12" width="1" height="2" fill="#ffffff"/>
      {/* Tentacles row 1 — ▘ ▘ ▝ ▝ */}
      <rect x="4" y="14" width="1" height="2" fill="#ffffff"/>
      <rect x="8" y="14" width="1" height="2" fill="#ffffff"/>
      <rect x="13" y="14" width="1" height="2" fill="#ffffff"/>
      <rect x="17" y="14" width="1" height="2" fill="#ffffff"/>
      {/* Tentacles row 2 — ▗ ▗ ▖ ▖ */}
      <rect x="3" y="16" width="1" height="2" fill="#ffffff"/>
      <rect x="7" y="16" width="1" height="2" fill="#ffffff"/>
      <rect x="14" y="16" width="1" height="2" fill="#ffffff"/>
      <rect x="18" y="16" width="1" height="2" fill="#ffffff"/>
      {/* Tentacle tips */}
      <rect x="1" y="18" width="2" height="2" fill="#ffffff"/>
      <rect x="6" y="18" width="1" height="2" fill="#ffffff"/>
      <rect x="15" y="18" width="1" height="2" fill="#ffffff"/>
      <rect x="19" y="18" width="2" height="2" fill="#ffffff"/>
      {/* Eyes — █ █ */}
      <rect x="8" y="4" width="2" height="4" fill="#2DD2A9"/>
      <rect x="15" y="4" width="2" height="4" fill="#2DD2A9"/>
    </svg>
  );
}
