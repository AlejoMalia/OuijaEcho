import { BaseAdapter } from './base-adapter.js';
import { ouijaBoardMapping } from '../ouija-board-mapping.js';

/**
 * PointerAdapter: Transforms mouse, touch, or stylus events from screen/canvas pixels
 * to physical Ouija board coordinates (37.0 x 24.0 cm).
 */
export class PointerAdapter extends BaseAdapter {
  /**
   * @param {Object} [options]
   * @param {number} [options.viewportWidth=800] Canvas / screen viewport width in pixels
   * @param {number} [options.viewportHeight=518] Canvas / screen viewport height in pixels
   */
  constructor(options = {}) {
    super('PointerAdapter');
    this.viewportWidth = options.viewportWidth || 800;
    this.viewportHeight = options.viewportHeight || 518;
    this.boardWidth = ouijaBoardMapping.boardSize.width;   // 37.0 cm
    this.boardHeight = ouijaBoardMapping.boardSize.height; // 24.0 cm
  }

  /**
   * Updates current viewport dimensions.
   */
  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Ingests a raw pixel coordinate from DOM PointerEvent/MouseEvent/TouchEvent
   * and translates it to metric cm.
   * 
   * @param {number} pixelX
   * @param {number} pixelY
   * @param {number} [timestamp]
   * @returns {{ x: number, y: number }}
   */
  handlePointer(pixelX, pixelY, timestamp = Date.now()) {
    const clampedX = Math.max(0, Math.min(this.viewportWidth, pixelX));
    const clampedY = Math.max(0, Math.min(this.viewportHeight, pixelY));

    const cmX = Number(((clampedX / this.viewportWidth) * this.boardWidth).toFixed(2));
    const cmY = Number(((clampedY / this.viewportHeight) * this.boardHeight).toFixed(2));

    const coords = { x: cmX, y: cmY };
    this.emitCoords(coords, timestamp);
    return coords;
  }
}
