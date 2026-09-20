import time
import random

class EnvironmentalMonitorPy:
    """
    Environmental conditions monitor in Python.
    Records acoustic, light, vibration, and peripheral motion readings.
    """
    def __init__(self, noise_thresh_db=65, vibration_thresh_g=0.08):
        self.noise_thresh_db = noise_thresh_db
        self.vibration_thresh_g = vibration_thresh_g
        self.samples = []
        self.events = []

    def record(self, readings, timestamp=None):
        ts = timestamp if timestamp is not None else time.time()
        noise_db = readings.get("noise_db", 35.0)
        light_lux = readings.get("light_lux", 300.0)
        vibration_g = readings.get("vibration_g", 0.01)
        motion_pct = readings.get("motion_pct", 0.0)

        anomalies = []
        if noise_db >= self.noise_thresh_db:
            anomalies.append({"type": "NOISE_SPIKE", "value": noise_db, "unit": "dB"})
        if vibration_g >= self.vibration_thresh_g:
            anomalies.append({"type": "TABLE_VIBRATION", "value": vibration_g, "unit": "g"})

        sample = {
            "timestamp": ts,
            "noise_db": noise_db,
            "light_lux": light_lux,
            "vibration_g": vibration_g,
            "motion_pct": motion_pct,
            "has_anomaly": len(anomalies) > 0,
            "anomalies": anomalies
        }
        self.samples.append(sample)

        for anom in anomalies:
            self.events.append({"timestamp": ts, **anom})

        return sample

    def get_summary(self):
        return {
            "sample_count": len(self.samples),
            "total_anomalies": len(self.events),
            "events": self.events
        }
