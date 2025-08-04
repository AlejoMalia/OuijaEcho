# OuijaEcho
![BANNER](/docs/banner.png)

This repository provides a digital framework for **precise coordinate mapping of a classic Ouija board**. The primary goal is to standardize the board layout for use with *computer vision systems* and other *digital analysis tools*. This project details a `Cartesian coordinate system` with an origin at the top-left corner, assigning a center point `(Position X/Y)` and a radius `(Radius)` to each alphanumeric and command element. This open-source mapping can serve as a foundation for a wide range of applications, including data collection and objective analysis of planchette movements, making the study of the Ouija board more structured and replicable.

### Session Logging & Pointer Position Detection

This script `ouija_session.py/js` serves as a comprehensive engine for interpreting and recording an entire Ouija board session. Its purpose is to continuously translate real-time `Cartesian coordinates (X, Y)` into a chronological log of symbolic board elements (such as letters, numbers, or keywords). This moves beyond simple detection to capture the complete story of an interaction.

#### How It Works

The code functions as a **session-based detection and logging engine**:

1.  **Imports Coordinate Mapping**: It uses the `ouijaBoardMapping` data structure to access the precise position and radius of each board element.
2.  **Session Management**: The script initiates a session with a defined start and end time. It runs a continuous loop to monitor the pointer's location throughout the session duration.
3.  **Continuous Detection & Debouncing**: In each cycle of the loop, the script detects the current element. It then applies a crucial **state-based logic** (debouncing) to ensure that a new element is only logged when it is different from the previous one. This prevents redundant entries and creates a clean, meaningful sequence of selections.
4.  **Event Logging**: Instead of just returning a single value, the script records a timestamped event to a `session_log`. Each entry in this log contains the selected element, the time of detection, and the raw coordinates.
5.  **Returns the Full Log**: Upon the session's completion, the script outputs the entire structured log, providing a complete history of the interaction for further analysis.

This script is a powerful foundation for any application that needs to study behavioral patterns and interactions. It's ideal for a computer vision system tracking a physical pointer, or a virtual simulator logging user movements.

### Ouija Board Coordinate Mapping

![BANNER](/docs/board.png)
*Visual representation of the board's coordinate mapping. The circles indicate the position and detection radius for each letter, number, and command. The gray areas represent blocked or mute zones to prevent the system from recognizing them as significant.*

This section details the **Ouija Board Coordinate Mapping**, an essential component for the **OuijaEcho** project's visual recognition system. Using a Cartesian coordinate system with its origin at the top-left corner, a center point (`Position X/Y`) and a radius (`Radius`) have been assigned to each alphanumeric and command element. This configuration allows the planchette-camera system to precisely determine the position of the pointer and validate the interaction during a high-confidence event (`$I_c$`). The data in this table is fundamental for communication with the robotic hand and the predictive AI.

| Area | Element | Dimensions | `Position X/Y (cm)` | `Radius (cm)` |
|---|---|---|---|---|
| **Confirmation Area** | | | | |
| Affirmation Area | `YES` | `5.0 x 5.0` | `(8.0, 3.5)` | `2.5` |
| Negation Area | `NO` | `5.0 x 5.0` | `(29.0, 3.5)` | `2.5` |
| **Letters Area** | | | | |
| Top Row (A-M) | `A` | `3.0 x 3.0` | `(4.5, 7.5)` | `1.5` |
| | `B` | `3.0 x 3.0` | `(7.0, 7.0)` | `1.5` |
| | `C` | `3.0 x 3.0` | `(9.5, 6.5)` | `1.5` |
| | `D` | `3.0 x 3.0` | `(12.0, 6.0)` | `1.5` |
| | `E` | `3.0 x 3.0` | `(14.5, 5.5)` | `1.5` |
| | `F` | `3.0 x 3.0` | `(17.5, 5.0)` | `1.5` |
| | `G` | `3.0 x 3.0` | `(20.0, 5.0)` | `1.5` |
| | `H` | `3.0 x 3.0` | `(22.5, 5.5)` | `1.5` |
| | `I` | `3.0 x 3.0` | `(25.0, 6.0)` | `1.5` |
| | `J` | `3.0 x 3.0` | `(27.5, 6.5)` | `1.5` |
| | `K` | `3.0 x 3.0` | `(30.0, 7.0)` | `1.5` |
| | `L` | `3.0 x 3.0` | `(32.5, 7.5)` | `1.5` |
| | `M` | `3.0 x 3.0` | `(35.0, 8.0)` | `1.5` |
| Bottom Row (N-Z) | `N` | `3.0 x 3.0` | `(5.0, 11.5)` | `1.5` |
| | `O` | `3.0 x 3.0` | `(7.5, 11.0)` | `1.5` |
| | `P` | `3.0 x 3.0` | `(10.0, 10.5)` | `1.5` |
| | `Q` | `3.0 x 3.0` | `(12.5, 10.0)` | `1.5` |
| | `R` | `3.0 x 3.0` | `(15.5, 9.5)` | `1.5` |
| | `S` | `3.0 x 3.0` | `(18.0, 9.5)` | `1.5` |
| | `T` | `3.0 x 3.0` | `(20.5, 9.5)` | `1.5` |
| | `U` | `3.0 x 3.0` | `(23.0, 9.5)` | `1.5` |
| | `V` | `3.0 x 3.0` | `(25.5, 10.0)` | `1.5` |
| | `W` | `3.0 x 3.0` | `(28.0, 10.5)` | `1.5` |
| | `X` | `3.0 x 3.0` | `(30.5, 11.0)` | `1.5` |
| | `Y` | `3.0 x 3.0` | `(33.0, 11.5)` | `1.5` |
| | `Z` | `3.0 x 3.0` | `(35.5, 12.0)` | `1.5` |
| **Numbers Area** 
| | `1` | `3.0 x 3.0` | `(6.0, 16.5)` | `1.5` |
| | `2` | `3.0 x 3.0` | `(9.0, 16.5)` | `1.5` |
| | `3` | `3.0 x 3.0` | `(12.0, 16.5)` | `1.5` |
| | `4` | `3.0 x 3.0` | `(15.0, 16.5)` | `1.5` |
| | `5` | `3.0 x 3.0` | `(18.0, 16.5)` | `1.5` |
| | `6` | `3.0 x 3.0` | `(21.0, 16.5)` | `1.5` |
| | `7` | `3.0 x 3.0` | `(24.0, 16.5)` | `1.5` |
| | `8` | `3.0 x 3.0` | `(27.0, 16.5)` | `1.5` |
| | `9` | `3.0 x 3.0` | `(30.0, 16.5)` | `1.5` |
| | `0` | `3.0 x 3.0` | `(33.0, 16.5)` | `1.5` |
| **Farewell Area** | `GOOD BYE` | `6.0 x 6.0` | `(18.5, 21.0)` | `3.0` |

---
#### Contribute


- [Report issues](https://github.com/your-username/CTHmodules/issues) - Share bugs or suggestions to refine the codebase.
- [Submit pull requests](https://github.com/your-username/CTHmodules/pulls) - Propose enhancements or new features for the community.
- [Star the repository](https://github.com/your-username/CTHmodules) - Show your support and help increase visibility.
- [Support the project](https://github.com/sponsors/your-username) - Contribute financially to sustain development.
- [Explore the code](https://github.com/your-username/CTHmodules/tree/main/src) - Dive into the source and collaborate on innovations.

#### License
This software is licensed with **[GPL-3.0](/LICENSE)**.
![License MIT](https://img.shields.io/badge/license-MIT-green.svg)