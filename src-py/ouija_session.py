import math
import time
from ouijaBoardMapping import ouija_board_mapping
from kinematics import KinematicTrackerPy
from ambient_monitor import EnvironmentalMonitorPy

def get_distance(pos1, pos2):
    dx = pos1["x"] - pos2["x"]
    dy = pos1["y"] - pos2["y"]
    return math.sqrt(dx**2 + dy**2)

def start_ouija_session(get_current_coords_func, run_time=60, scientific=False, get_ambient_func=None):
    """
    Runs an Ouija session, detecting and logging the position of a pointer
    based on a continuous stream of coordinates.
    
    Preserves legacy logging while optionally recording kinematic & ambient metrics.

    Args:
        get_current_coords_func: A function that returns the current (x, y) coordinates.
        run_time: The duration of the session in seconds.
        scientific: Boolean indicating whether to enable kinematic and ambient analysis.
        get_ambient_func: Optional function returning ambient readings dict.

    Returns:
        A list of dictionaries representing detected elements during the session.
    """
    session_log = []
    last_detected_element = None
    start_time = time.time()

    tracker = KinematicTrackerPy() if scientific else None
    env_monitor = EnvironmentalMonitorPy() if (scientific and get_ambient_func) else None

    print("--- Ouija Session Started ---")

    while time.time() - start_time < run_time:
        coords = get_current_coords_func()
        current_x, current_y = coords[0], coords[1]
        current_pos = {"x": current_x, "y": current_y}
        now = time.time()

        if tracker:
            tracker.update(current_pos, now)

        if env_monitor and get_ambient_func:
            amb = get_ambient_func()
            env_monitor.record(amb, now)

        detected_element = "Mute Zone"

        # Check Affirmation/Negation/Farewell areas first
        if get_distance(current_pos, ouija_board_mapping["affirmation"]["position"]) <= ouija_board_mapping["affirmation"]["radius"]:
            detected_element = ouija_board_mapping["affirmation"]["element"]
        elif get_distance(current_pos, ouija_board_mapping["negation"]["position"]) <= ouija_board_mapping["negation"]["radius"]:
            detected_element = ouija_board_mapping["negation"]["element"]
        elif get_distance(current_pos, ouija_board_mapping["farewell"]["position"]) <= ouija_board_mapping["farewell"]["radius"]:
            detected_element = ouija_board_mapping["farewell"]["element"]
        # Check Letters
        else:
            for letter_data in ouija_board_mapping["letters"]:
                if get_distance(current_pos, letter_data["position"]) <= letter_data["radius"]:
                    detected_element = letter_data["letter"]
                    break
            # Check Numbers if no letter was found
            if detected_element == "Mute Zone":
                for number_data in ouija_board_mapping["numbers"]:
                    if get_distance(current_pos, number_data["position"]) <= number_data["radius"]:
                        detected_element = number_data["number"]
                        break

        # Only log a new element if it's different from the last one
        if detected_element != last_detected_element:
            timestamp = time.strftime("%H:%M:%S", time.localtime(now))
            session_log.append({
                "element": detected_element,
                "timestamp": timestamp,
                "position": {"x": current_x, "y": current_y}
            })
            print(f"[{timestamp}] New element detected: {detected_element}")
            last_detected_element = detected_element

        time.sleep(0.1)  # Check every 100ms

    print("--- Ouija Session Ended ---")

    if tracker:
        print("\nKinematic Summary (Python):", tracker.get_summary())
    if env_monitor:
        print("Ambient Summary (Python):", env_monitor.get_summary())

    return session_log

if __name__ == "__main__":
    # --- Example of a function that provides coordinates ---
    coordinates_simulation_data = [
        (8.0, 3.5), (8.1, 3.6), (8.2, 3.7), # Stay on YES
        (12.0, 6.0), (12.1, 6.1), # Move to D
        (15.0, 16.5), # Move to 4
        (29.0, 3.5), # Move to NO
        (1.0, 1.0) # Move to Mute Zone
    ]
    simulation_index = 0
    def get_simulated_coords():
        global simulation_index
        if simulation_index < len(coordinates_simulation_data):
            coords = coordinates_simulation_data[simulation_index]
            simulation_index += 1
            return coords
        return (1, 1)

    # Run the session with scientific mode enabled
    session_results = start_ouija_session(get_simulated_coords, run_time=2, scientific=True)
    print("\nFinal Session Log:")
    for entry in session_results:
        print(entry)