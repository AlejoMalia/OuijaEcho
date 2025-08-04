import math
import time
from ouijaBoardMapping import ouija_board_mapping

def start_ouija_session(get_current_coords_func, run_time=60):
    """
    Runs an Ouija session, detecting and logging the position of a pointer
    based on a continuous stream of coordinates.

    Args:
        get_current_coords_func: A function that returns the current (x, y) coordinates.
        run_time: The duration of the session in seconds.

    Returns:
        A list of dictionaries, where each dictionary represents a detected element
        during the session.
    """
    session_log = []
    last_detected_element = None
    start_time = time.time()
    
    print("--- Ouija Session Started ---")
    
    while time.time() - start_time < run_time:
        # Get current coordinates from the external function
        current_x, current_y = get_current_coords_func()
        current_pos = {"x": current_x, "y": current_y}
        
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
            timestamp = time.strftime("%H:%M:%S", time.localtime())
            session_log.append({
                "element": detected_element,
                "timestamp": timestamp,
                "position": {"x": current_x, "y": current_y}
            })
            print(f"[{timestamp}] New element detected: {detected_element}")
            last_detected_element = detected_element
        
        time.sleep(0.1) # Check every 100ms
        
    print("--- Ouija Session Ended ---")
    return session_log

def get_distance(pos1, pos2):
    dx = pos1["x"] - pos2["x"]
    dy = pos1["y"] - pos2["y"]
    return math.sqrt(dx**2 + dy**2)

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

# --- Run the session ---
session_results = start_ouija_session(get_simulated_coords, run_time=2)
print("\nFinal Session Log:")
for entry in session_results:
    print(entry)