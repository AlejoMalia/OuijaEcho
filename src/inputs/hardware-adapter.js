import { BaseAdapter } from './base-adapter.js';

/**
 * HardwareAdapter: Ingests serial, Bluetooth, WebSocket, or MQTT sensor streams
 * from external IoT microcontrollers (ESP32, Arduino, Raspberry Pi Pico, MPU6050, load cells).
 */
export class HardwareAdapter extends BaseAdapter {
  constructor(name = 'HardwareAdapter') {
    super(name);
  }

  /**
   * Parses an incoming raw telemetry line (e.g. JSON or CSV line from microcontrollers).
   * 
   * Expected format:
   * JSON: {"x": 12.0, "y": 6.0, "vibration": 0.02, "noise": 42.0, "forceA": 1.2, "forceB": 0.8}
   * CSV: x,y,vibration,noise
   * 
   * @param {string|Object} rawPayload
   * @param {number} [timestamp]
   */
  ingest(rawPayload, timestamp = Date.now()) {
    let data = rawPayload;
    if (typeof rawPayload === 'string') {
      try {
        data = JSON.parse(rawPayload);
      } catch {
        const parts = rawPayload.trim().split(',').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          data = {
            x: parts[0],
            y: parts[1],
            vibration: parts[2] !== undefined ? parts[2] : 0.01,
            noise: parts[3] !== undefined ? parts[3] : 35
          };
        } else {
          return null;
        }
      }
    }

    if (data.x !== undefined && data.y !== undefined) {
      this.emitCoords({ x: Number(data.x), y: Number(data.y) }, timestamp);
    }

    const ambientReadings = {};
    if (data.vibration !== undefined) ambientReadings.vibrationG = Number(data.vibration);
    if (data.noise !== undefined) ambientReadings.noiseDb = Number(data.noise);
    if (data.light !== undefined) ambientReadings.lightLux = Number(data.light);
    if (data.motion !== undefined) ambientReadings.motionPct = Number(data.motion);

    if (Object.keys(ambientReadings).length > 0) {
      this.emitAmbient(ambientReadings, timestamp);
    }

    this.emit('hardware_frame', { data, timestamp });
    return data;
  }
}
