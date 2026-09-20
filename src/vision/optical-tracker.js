import { projectPoint } from './homography.js';

/**
 * Optical tracker for camera-based planchette and ambient motion tracking.
 */
export class OpticalTracker {
  /**
   * @param {Object} [config]
   * @param {Array<Array<number>>} [config.homographyMatrix] Calibrated 3x3 homography matrix
   */
  constructor(config = {}) {
    this.H = config.homographyMatrix || null;
    this.prevFrameData = null;
  }

  /**
   * Sets or updates the homography matrix.
   * @param {Array<Array<number>>} H
   */
  setHomography(H) {
    this.H = H;
  }

  /**
   * Extracts centroid from image buffer/pixels based on a color or luminance threshold.
   * @param {Uint8ClampedArray|Array<number>} rgbaPixels - RGBA pixel array
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {Function} [filterFn] - (r, g, b) => boolean
   * @returns {{ pixelX: number, pixelY: number, metricX: number, metricY: number, detected: boolean }}
   */
  trackCentroid(rgbaPixels, width, height, filterFn) {
    const isTarget = filterFn || ((r, g, b) => (r > 180 && g < 80 && b < 80)); // Default: Red marker

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = rgbaPixels[idx];
        const g = rgbaPixels[idx + 1];
        const b = rgbaPixels[idx + 2];

        if (isTarget(r, g, b)) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    if (count === 0) {
      return { pixelX: 0, pixelY: 0, metricX: 0, metricY: 0, detected: false };
    }

    const pixelX = sumX / count;
    const pixelY = sumY / count;

    let metricPos = { x: pixelX, y: pixelY };
    if (this.H) {
      metricPos = projectPoint({ x: pixelX, y: pixelY }, this.H);
    }

    return {
      pixelX: Number(pixelX.toFixed(1)),
      pixelY: Number(pixelY.toFixed(1)),
      metricX: metricPos.x,
      metricY: metricPos.y,
      detected: true,
      mass: count
    };
  }

  /**
   * Computes peripheral motion percentage outside the board area by frame differencing.
   * 
   * @param {Uint8ClampedArray} currentPixels
   * @param {number} width
   * @param {number} height
   * @param {Object} [boardBoundingBoxPx] - { minX, minY, maxX, maxY }
   * @returns {number} Motion percentage (0 - 100%)
   */
  computePeripheralMotion(currentPixels, width, height, boardBoundingBoxPx) {
    if (!this.prevFrameData || this.prevFrameData.length !== currentPixels.length) {
      this.prevFrameData = new Uint8ClampedArray(currentPixels);
      return 0;
    }

    const bbox = boardBoundingBoxPx || { minX: width * 0.2, minY: height * 0.2, maxX: width * 0.8, maxY: height * 0.8 };
    let changedPixels = 0;
    let totalPeripheralPixels = 0;

    for (let y = 0; y < height; y += 4) { // Step for performance
      for (let x = 0; x < width; x += 4) {
        // Only evaluate outside the board bounding box
        if (x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY) {
          continue;
        }

        totalPeripheralPixels++;
        const idx = (y * width + x) * 4;
        const diff = Math.abs(currentPixels[idx] - this.prevFrameData[idx]) +
                     Math.abs(currentPixels[idx + 1] - this.prevFrameData[idx + 1]) +
                     Math.abs(currentPixels[idx + 2] - this.prevFrameData[idx + 2]);

        if (diff > 45) { // Threshold for movement
          changedPixels++;
        }
      }
    }

    this.prevFrameData.set(currentPixels);

    if (totalPeripheralPixels === 0) return 0;
    return Number(((changedPixels / totalPeripheralPixels) * 100).toFixed(1));
  }
}
