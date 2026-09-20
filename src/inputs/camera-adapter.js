import { BaseAdapter } from './base-adapter.js';
import { OpticalTracker } from '../vision/optical-tracker.js';
import { computeHomography, projectPoint } from '../vision/homography.js';

/**
 * CameraAdapter: Feeds planchette tracking and ambient peripheral motion
 * directly from video frames or webcams.
 */
export class CameraAdapter extends BaseAdapter {
  /**
   * @param {Object} [config]
   * @param {Array<{ x: number, y: number }>} [config.calibrationCorners] 4 camera corners for homography
   */
  constructor(config = {}) {
    super('CameraAdapter');
    this.tracker = new OpticalTracker();
    this.homographyMatrix = null;

    if (config.calibrationCorners) {
      this.calibrate(config.calibrationCorners);
    }
  }

  /**
   * Calibrates the perspective transform using 4 pixel corners of the board.
   * @param {Array<{ x: number, y: number }>} corners - Top-Left, Top-Right, Bottom-Right, Bottom-Left
   */
  calibrate(corners) {
    this.homographyMatrix = computeHomography(corners);
    this.tracker.setHomography(this.homographyMatrix);
    this.emit('calibrated', { matrix: this.homographyMatrix });
    return this.homographyMatrix;
  }

  /**
   * Processes a video frame / RGBA image buffer.
   * 
   * @param {Uint8ClampedArray|Array<number>} rgbaPixels
   * @param {number} width
   * @param {number} height
   * @param {number} [timestamp]
   * @returns {Object} Tracking result
   */
  processFrame(rgbaPixels, width, height, timestamp = Date.now()) {
    // 1. Track planchette
    const planchette = this.tracker.trackCentroid(rgbaPixels, width, height);
    if (planchette.detected) {
      this.emitCoords({ x: planchette.metricX, y: planchette.metricY }, timestamp);
    }

    // 2. Track peripheral room motion for ambient telemetry
    const motionPct = this.tracker.computePeripheralMotion(rgbaPixels, width, height);
    this.emitAmbient({ motionPct }, timestamp);

    return { planchette, motionPct };
  }
}
