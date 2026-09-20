import EventEmitter from 'node:events';

/**
 * BaseAdapter: Foundation for all pluggable input modalities in OuijaEcho.
 * Allows decoupling sensors, cameras, pointers, and simulated feeds.
 */
export class BaseAdapter extends EventEmitter {
  constructor(name = 'GenericAdapter') {
    super();
    this.name = name;
    this.isConnected = false;
  }

  /**
   * Connects or initializes the input source.
   */
  async connect() {
    this.isConnected = true;
    this.emit('connected', { name: this.name });
    return true;
  }

  /**
   * Disconnects or tears down the input source.
   */
  async disconnect() {
    this.isConnected = false;
    this.emit('disconnected', { name: this.name });
    return true;
  }

  /**
   * Emits a normalized coordinate point to the session engine.
   * @param {{ x: number, y: number }} coords - Coordinates in cm
   * @param {number} [timestamp]
   */
  emitCoords(coords, timestamp = Date.now()) {
    this.emit('coords', { coords, timestamp, source: this.name });
  }

  /**
   * Emits ambient environmental telemetry to the session engine.
   * @param {Object} readings - { noiseDb, lightLux, vibrationG, motionPct }
   * @param {number} [timestamp]
   */
  emitAmbient(readings, timestamp = Date.now()) {
    this.emit('ambient', { readings, timestamp, source: this.name });
  }
}
