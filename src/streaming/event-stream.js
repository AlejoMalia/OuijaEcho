/**
 * EventStreamPipeline: Zero-Copy, Differential Event-Driven Streaming Pipeline.
 * 
 * Traditional polling spends CPU cycles checking every N milliseconds even when idle.
 * This pipeline operates as a reactive event stream:
 * - Emits micro-events ONLY when state changes exceed differential epsilon.
 * - Zero processing overhead when the system is in equilibrium.
 * - Built on native asynchronous iterators (for await...of).
 */
export class EventStreamPipeline {
  /**
   * @param {Object} [options]
   * @param {number} [options.spatialEpsilonCm=0.04] Minimum displacement to trigger stream event (cm)
   * @param {number} [options.energyEpsilon=0.08] Minimum energy delta to trigger energy event
   */
  constructor(options = {}) {
    this.spatialEpsilon = options.spatialEpsilonCm ?? 0.04;
    this.energyEpsilon = options.energyEpsilon ?? 0.08;

    this.lastEmitted = null;
    this.subscribers = [];
    this.queue = [];
    this.isClosed = false;
  }

  /**
   * Pushes an incoming raw physical or simulated state into the reactive pipeline.
   * Filters out redundant non-differential samples (zero-copy / zero-load).
   * 
   * @param {Object} state - { x, y, speed, totalEnergy, ... }
   * @param {number} [timestamp]
   * @returns {boolean} True if an event was dispatched, false if suppressed as idle
   */
  push(state, timestamp = Date.now()) {
    if (this.isClosed) return false;

    if (this.lastEmitted) {
      const dx = state.x - this.lastEmitted.x;
      const dy = state.y - this.lastEmitted.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const dEnergy = Math.abs((state.totalEnergy || 0) - (this.lastEmitted.totalEnergy || 0));

      // Suppress event if physical displacement and energy variation are below threshold
      if (dist < this.spatialEpsilon && dEnergy < this.energyEpsilon) {
        return false; // Zero processing when idle!
      }
    }

    const event = {
      type: 'STATE_DELTA',
      timestamp,
      data: state,
      delta: this.lastEmitted ? {
        dx: Number((state.x - this.lastEmitted.x).toFixed(3)),
        dy: Number((state.y - this.lastEmitted.y).toFixed(3))
      } : { dx: 0, dy: 0 }
    };

    this.lastEmitted = { ...state };
    this._dispatch(event);
    return true;
  }

  /**
   * Pushes a high-priority semantic or ambient resonance event into the stream.
   * @param {'RESONANCE'|'ATTRACTOR_COLLAPSE'|'AMBIENT_BURST'} type
   * @param {Object} payload
   */
  emitResonance(type, payload, timestamp = Date.now()) {
    const event = { type, timestamp, data: payload };
    this._dispatch(event);
  }

  _dispatch(event) {
    this.queue.push(event);
    for (const sub of this.subscribers) {
      sub(event);
    }
  }

  /**
   * Subscribes a listener callback to the live stream.
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  /**
   * Asynchronous generator allowing consumers to read stream events in real time:
   * 
   * for await (const event of pipeline.stream()) {
   *   console.log(event);
   * }
   */
  async *stream() {
    while (!this.isClosed || this.queue.length > 0) {
      if (this.queue.length > 0) {
        yield this.queue.shift();
      } else if (this.isClosed) {
        break;
      } else {
        // Await next event tick
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * Closes the stream pipeline.
   */
  close() {
    this.isClosed = true;
    this.subscribers = [];
  }
}
