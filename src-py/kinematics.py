import math

class KinematicTrackerPy:
    """
    Python kinematic tracker for Ouija planchette movements.
    Computes velocity, acceleration, jerk, and dwell times.
    """
    def __init__(self, min_dwell_time_sec=0.2, smoothing_alpha=0.2):
        self.min_dwell_time_sec = min_dwell_time_sec
        self.smoothing_alpha = smoothing_alpha
        self.reset()

    def reset(self):
        self.history = []
        self.dwell_events = []
        self.active_dwell = None
        self.cumulative_distance = 0.0
        self.last_frame = None

    def update(self, pos, timestamp_sec):
        x, y = pos["x"], pos["y"]
        prev = self.last_frame

        vx, vy, speed = 0.0, 0.0, 0.0
        ax, ay, acceleration = 0.0, 0.0, 0.0
        jerk = 0.0
        dt = 0.0

        if prev:
            dt = timestamp_sec - prev["timestamp"]
            if dt > 0.0001:
                raw_vx = (x - prev["x"]) / dt
                raw_vy = (y - prev["y"]) / dt
                vx = prev["vx"] + (1 - self.smoothing_alpha) * (raw_vx - prev["vx"])
                vy = prev["vy"] + (1 - self.smoothing_alpha) * (raw_vy - prev["vy"])
                speed = math.sqrt(vx**2 + vy**2)

                raw_ax = (vx - prev["vx"]) / dt
                raw_ay = (vy - prev["vy"]) / dt
                ax = prev["ax"] + (1 - self.smoothing_alpha) * (raw_ax - prev["ax"])
                ay = prev["ay"] + (1 - self.smoothing_alpha) * (raw_ay - prev["ay"])
                acceleration = math.sqrt(ax**2 + ay**2)

                d_ax = ax - prev["ax"]
                d_ay = ay - prev["ay"]
                raw_jerk = math.sqrt(d_ax**2 + d_ay**2) / dt
                jerk = prev["jerk"] + (1 - self.smoothing_alpha) * (raw_jerk - prev["jerk"])

                step_dist = math.sqrt((x - prev["x"])**2 + (y - prev["y"])**2)
                self.cumulative_distance += step_dist

        frame = {
            "timestamp": timestamp_sec,
            "dt": dt,
            "x": x,
            "y": y,
            "vx": vx,
            "vy": vy,
            "speed": speed,
            "ax": ax,
            "ay": ay,
            "acceleration": acceleration,
            "jerk": jerk,
            "cumulative_distance": self.cumulative_distance
        }

        self.last_frame = frame
        self.history.append(frame)
        return frame

    def get_summary(self):
        if not self.history:
            return {"sample_count": 0}
        speeds = [f["speed"] for f in self.history]
        jerks = [f["jerk"] for f in self.history]
        duration = self.history[-1]["timestamp"] - self.history[0]["timestamp"]
        return {
            "sample_count": len(self.history),
            "duration_sec": round(duration, 2),
            "cumulative_distance_cm": round(self.cumulative_distance, 2),
            "mean_speed_cms": round(sum(speeds) / len(speeds), 2),
            "max_speed_cms": round(max(speeds), 2),
            "mean_jerk_cms3": round(sum(jerks) / len(jerks), 2),
            "max_jerk_cms3": round(max(jerks), 2)
        }
