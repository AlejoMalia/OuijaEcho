# OuijaEcho

![BANNER](/docs/banner.png)

[![Tests: 45 passed / 45 total](https://img.shields.io/badge/tests-45%20passed%20%2F%2045%20total-brightgreen.svg)](#-test-suite--verification)
[![License: Non-Commercial Scientific](https://img.shields.io/badge/license-Non--Commercial%20Scientific-red.svg)](LICENSE.txt)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](package.json)
[![Python](https://img.shields.io/badge/python-3.9%2B-blue.svg)](src-py/)
[![Data Standard](https://img.shields.io/badge/data--standard-JSON--LD%20%2F%20Schema.org-orange.svg)](#scientific-data-exporters--visualization)

> **Tests Status:** **45 / 45 Tests Passed (100% Success)**  
> All 13 core subsystems verified: Spatial Geometry, Continuous Kinematics ($v, a, \text{jerk}$), Inter-Symbol Latency & Void Analysis ($T_{\text{dwell}}$ vs $T_{\text{void}}$, ISI), Environmental Monitor, Cross-Correlation Analyzer, Vision & Homography Calibration, Pluggable Input Adapters, Multi-User Dynamics, Linguistic Priors, Local Lab Server & Web UI, Langevin Potential Landscape & Stochastic Resonance, Zero-Copy Event Stream Pipeline, Emergent Self-Organizing Topology, Exporters (CSV, JSON-LD, Markdown).

This repository provides a digital framework for **precise coordinate mapping of a classic Ouija board**. The primary goal is to standardize the board layout for use with *computer vision systems* and other *digital analysis tools*. This project details a `Cartesian coordinate system` with an origin at the top-left corner, assigning a center point `(Position X/Y)` and a radius `(Radius)` to each alphanumeric and command element. This open-source mapping can serve as a foundation for a wide range of applications, including data collection and objective analysis of planchette movements, making the study of the Ouija board more structured and replicable.

---

## 🌐 Universal Multimodal Architecture: Flexible & Unbundled

OuijaEcho does **not force you to use all sensors or hardware**. It is built on a pluggable, decoupled adapter pattern (`.use(adapter)`) allowing researchers and creators to activate only the modalities required for their experiment:

| Modality | Required Hardware | Description |
|---|---|---|
| **1. Pure Virtual / Pointer** | None (Mouse / Touch) | Track planchette movements via screen clicks, touchscreen, or graphics tablet. |
| **2. Optical / Camera Vision** | Webcam / Mobile Camera | 3x3 Projective Homography corrects any camera angle to metric board coordinates ($37 \times 24\text{ cm}$) and extracts peripheral room movement. |
| **3. Ambient Acoustic Sensing** | Laptop / Mobile Mic | Real-time decibel (dB) tracking to correlate acoustic spikes with motor startle responses. |
| **4. Hardware IoT / Serial** | ESP32, Arduino, IMUs | Streams table vibrations ($g$), force/pressure load cells ($F_z$), or atmospheric data over WebSerial/WebSockets. |
| **5. Multi-User Dynamics** | Dual Touch / Force Sensors | Measures force vectors between Participant A and B to compute the **Motor Dominance Index** (*Leader-Follower dynamics*). |
| **6. Linguistic Prior** | Software Only | Markov $N$-gram bigram models predict upcoming letters and detect the subconscious trajectory pre-commitment threshold. |
| **7. Integrated Web Lab** | Any Web Browser | Runs a local browser dashboard (`ouijaecho serve`) combining all active streams with zero setup. |

---

## Session Logging & Pointer Position Detection

This script `ouija_session.py/js` serves as a comprehensive engine for interpreting and recording an entire Ouija board session. Its purpose is to continuously translate real-time `Cartesian coordinates (X, Y)` into a chronological log of symbolic board elements (such as letters, numbers, or keywords). This moves beyond simple detection to capture the complete story of an interaction.

### How It Works

The code functions as a **session-based detection and logging engine**:

1. **Imports Coordinate Mapping**: It uses the `ouijaBoardMapping` data structure to access the precise position and radius of each board element.
2. **Session Management**: The script initiates a session with a defined start and end time. It runs a continuous loop to monitor the pointer's location throughout the session duration.
3. **Continuous Detection & Debouncing**: In each cycle of the loop, the script detects the current element. It then applies a crucial **state-based logic** (debouncing) to ensure that a new element is only logged when it is different from the previous one. This prevents redundant entries and creates a clean, meaningful sequence of selections.
4. **Event Logging**: Instead of just returning a single value, the script records a timestamped event to a `session_log`. Each entry in this log contains the selected element, the time of detection, and the raw coordinates.
5. **Returns the Full Log**: Upon the session's completion, the script outputs the entire structured log, providing a complete history of the interaction for further analysis.

This script is a powerful foundation for any application that needs to study behavioral patterns and interactions. It's ideal for a computer vision system tracking a physical pointer, or a virtual simulator logging user movements.

---

## 🔬 Scientific Integration: Ideomotor Effect & Biomechanics

Beyond symbolic logging, OuijaEcho embeds a computational framework for cognitive neuroscience and motor control:

1. **The Ideomotor Phenomenon & Non-Conscious Retrieval:**  
   Discovered by William B. Carpenter (1852) and verified experimentally with physical dynamometers by Michael Faraday (1853), the ideomotor effect is the unconscious, involuntary contraction of muscles guided by expectation or suggestion. Modern studies (e.g., University of British Columbia Visual Cognition Lab) demonstrate that the Ouija board can tap into **implicit semantic memory** that conscious verbal responses fail to access.

2. **Continuous Kinematics & Jerk Analysis:**  
   Voluntary human actions exhibit bell-shaped velocity curves and minimal *jerk* (3rd derivative: $j = d^3x/dt^3$). Conversely, involuntary or conflicting multi-user forces produce micro-tremors, hesitation pauses, and elevated normalized jerk. OuijaEcho tracks real-time velocity ($v_x, v_y, \text{speed}$), acceleration ($a_x, a_y$), jerk ($j$), cumulative path distance ($L_{\text{real}}$), and path tortuosity ($\tau = L_{\text{real}} / D_e$).

3. **Continuous Spatial Attraction (Softmax & Gaussian RBF):**  
   Instead of binary in/out checks, each coordinate point generates a continuous probability distribution across all 39 board targets:
   $$P(\text{target}_i \mid x, y) = \frac{\exp\left(-\frac{d(pos, pos_i)^2}{2\sigma_i^2}\right)}{\sum_j \exp\left(-\frac{d(pos, pos_j)^2}{2\sigma_j^2}\right)}$$

---

## 🌿 Environmental Compilation & Ambient Conditions System

A central scientific challenge in studying the Ouija board is distinguishing endogenous ideomotor activity from exogenous environmental stimuli. OuijaEcho incorporates an **Environmental Compilation Engine** (`EnvironmentalMonitor` and `CorrelationAnalyzer`):

- **Multimodal External Channels:**
  - **Acoustic Pressure (`noiseDb`):** Ambient decibel levels; flags transient spikes (`NOISE_SPIKE`).
  - **Ambient Illuminance (`lightLux`):** Ambient room light; flags sudden shadow or flicker events (`LIGHT_FLICKER`).
  - **Table Mechanical Tremor (`vibrationG`):** Surface accelerometer vibration in $g$; flags structural shocks (`TABLE_VIBRATION`).
  - **Peripheral Room Motion (`motionPct`):** Optical flow / movement detected outside the board perimeter (`PERIPHERAL_MOTION`).
- **Cross-Correlation & Startle Reflex Latency:**  
  Evaluates whether an abrupt planchette jump or jerk spike coincided with an ambient perturbation within a $30\text{--}450\text{ ms}$ biological latency window. It classifies movements as `ENVIRONMENTAL_ARTIFACT` (exogenous reaction) vs `ENDOGENOUS_IDEOMOTOR` (unconscious volition), calculating an objective **Isolation Score** ($0.0\text{--}1.0$).

---

## Ouija Board Coordinate Mapping

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
| **Numbers Area** | | | | |
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

## Features

- **Spatial Coordinate Standardization:** Exact Cartesian mapping for physical boards ($37.0 \times 24.0\text{ cm}$).
- **Autonomous Langevin Potential Field Engine:** Continuous energy landscape $U(\mathbf{x})$, stochastic resonance, and analytical gradient forces $-\nabla U$.
- **Zero-Copy Differential Event Stream:** Reactive micro-event pipeline (`push`, `emitResonance`, `stream`) eliminating idle CPU processing.
- **Emergent Self-Organizing Topology:** Hebbian dynamic attractor network enabling boardless, projected symbol generation without fixed boards.
- **Real-Time Autonomous Emulator:** Simulates spontaneous planchette dynamics and streams decoded tokens in real time (`ouijaecho emulate`).
- **Continuous Kinematic Analysis:** Real-time velocity, acceleration, and jerk computation with exponential smoothing.
- **Projective Homography & Vision:** 3x3 DLT camera homography matrix maps any perspective angle to metric cm.
- **Multimodal Environmental Monitoring:** Synchronized tracking of ambient sound, illumination, table tremor, and room motion.
- **Multi-User Dominance Analyzer:** Lagged cross-correlation of forces to compute Motor Dominance Index ($MDI$).
- **Linguistic Prior Engine:** Markov bigram models calculate surprisal and detect the subconscious commitment threshold.
- **Open Science Data Exporters:** High-frequency Time-Series CSV, Dwells CSV, Schema.org compliant JSON-LD, and Markdown summary.
- **Interactive Visualizer & Local Lab Server:** Native browser research lab (`ouijaecho serve`) with live SVG board and telemetry.
- **Cross-Environment & Multi-Language:** Supported environments include Browser, Node.js, Deno, Bun, and Python (`src-py/`).

---

## Usage

### 1. Launch the Web Research Lab (`ouijaecho serve`)

Start a local interactive laboratory server with zero external dependencies:

```bash
# Launch server on http://localhost:3000
npx ouijaecho serve --port 3000
```
Open your browser to control the experiment, toggle webcam/microphone streams, monitor live speed/jerk, and download datasets.

### 2. Run the Autonomous Resonance Emulator (`ouijaecho emulate`)

Run spontaneous Langevin dynamics and stream decoded tokens in real time:

```bash
# Run 10s autonomous resonance emulation with streaming symbol reader
node src/bin.js emulate --duration 10

# Run with emergent boardless topology (self-organizing projection)
node src/bin.js emulate --duration 10 --topology emergent
```

### 3. CLI Usage

```bash
# Standard session simulation
node src/bin.js session

# Scientific session with continuous kinematics and ambient environmental tracking
node src/bin.js session --scientific --ambient --duration 5

# Multimodal session with multi-user dynamics and linguistic predictions
node src/bin.js session --scientific --ambient --multi-user --linguistic --duration 4

# Export session directly to an interactive HTML visual report
node src/bin.js session --scientific --ambient --export html --out docs/session_report.html

# Export to Time-Series CSV for analysis in Python / Pandas / R
node src/bin.js session --scientific --ambient --export csv --out docs/telemetry.csv

# Run the phrase-to-coordinate generator
node src/bin.js generator
```

### 3. Use as a Library (JavaScript / TypeScript)

```bash
npm i ouijaecho
```

```javascript
import {
  OuijaSessionEngine,
  PointerAdapter,
  CameraAdapter,
  computeHomography,
  exportToCsv,
  generateHtmlReport
} from 'ouijaecho';

// 1. Initialize Reactive Session Engine
const engine = new OuijaSessionEngine({
  sampleRateHz: 60,
  minDwellTimeMs: 200,
  enableMultiUser: true,
  enableLinguisticPrior: true
});

// 2. Connect only the adapters you need (Pluggable Architecture)
const pointer = new PointerAdapter({ viewportWidth: 1200, viewportHeight: 778 });
engine.use(pointer);

// Handle screen touch / click
pointer.handlePointer(600, 389);

// 3. Stop session and obtain compiled research dataset
const dataset = engine.stop();
console.log('Isolation Score:', dataset.scientificSummary.environmentalCoupling.isolationScore);
console.log('Tortuosity Index:', dataset.scientificSummary.movementProfile.tortuosityIndex);
```

### 4. Python Usage (`src-py/`)

```python
from kinematics import KinematicTrackerPy
from ambient_monitor import EnvironmentalMonitorPy
from ouija_session import start_ouija_session

def get_coords():
    return (12.0, 6.0) # Planchette position (x, y)

session_log = start_ouija_session(get_coords, run_time=3, scientific=True)
```

---

## 🧪 Test Suite & Verification

The repository includes an extensive automated test suite testing all 13 core subsystems:

```bash
npm test
```

### Verified Test Breakdown (45 / 45 Passed):
- `tests/geometry.test.js` (5 tests): Euclidean distance, 39 board target aggregation, boundary bounds validation, nearest element classification, Gaussian Softmax spatial probabilities with temperature scaling.
- `tests/homography.test.js` (2 tests): 3x3 Projective homography solving via DLT, perspective transformation to $(37 \times 24\text{ cm})$, matrix inversion.
- `tests/adapters.test.js` (3 tests): PointerAdapter viewport normalization, HardwareAdapter JSON/CSV parsing, CameraAdapter frame pipeline.
- `tests/kinematics.test.js` (4 tests): 1st/2nd/3rd order time derivatives ($v, a, \text{jerk}$), dwell time hysteresis, trajectory straightness, inter-symbol flight latency (ISI), transitions, and void epochs.
- `tests/environmental.test.js` (2 tests): Baseline tracking, acoustic spike detection, mechanical table vibration, startle reflex latency window matching ($30\text{--}450\text{ ms}$), Isolation Score computation.
- `tests/multi-user.test.js` (2 tests): Multi-User lagged cross-correlation, Motor Dominance Index classification (User A dominant, balanced swarm).
- `tests/linguistic.test.js` (2 tests): Markov bigram transition priors, surprisal calculation, directional velocity pre-commitment detection.
- `tests/potential-landscape.test.js` (4 tests): Deepest energy at attractor wells, analytical gradient force pulling particle toward center, Langevin dynamics integration with velocity damping and boundary conditions, 2D vector field grid generation.
- `tests/event-stream.test.js` (2 tests): Zero-copy differential event suppression on idle frames, high-priority semantic resonance events and asynchronous streaming iterator.
- `tests/emergent-topology.test.js` (2 tests): Boardless projection node generation at stabilization points, Hebbian topological attractor merging.
- `tests/emulator.test.js` (1 test): Real-time autonomous resonance emulator with streaming token decoder.
- `tests/metrics.test.js` (5 tests): Tortuosity index, Log Dimensionless Jerk, Fitts's Law throughput and index of difficulty, Shannon Entropy calculation, scientific session synthesis.
- `tests/exporters.test.js` (4 tests): Time-series CSV, Dwell CSV, Correlation CSV, Schema.org JSON-LD Dataset compliance, Markdown executive summary, Standalone HTML/SVG visualizer.
- `tests/server.test.js` (4 tests): Local Lab Server instantiation, `/api/status`, `/api/feed`, `/api/export` endpoints.
- `tests/session.test.js` (3 tests): Event-driven `OuijaSessionEngine` lifecycle, legacy `startOuijaSession` backward compatibility, phrase generator theoretical kinematics.

---

## Contribute

- [Report issues](https://github.com/alejomalia/ouijaecho/issues) - Share bugs or suggestions to refine the codebase.
- [Submit pull requests](https://github.com/alejomalia/ouijaecho/pulls) - Propose enhancements or new features for the community.
- [Star the repository](https://github.com/alejomalia/ouijaecho) - Show your support and help increase visibility.
- [Support the project](https://github.com/sponsors/alejomalia) - Contribute financially to sustain development.
- [Explore the code](https://github.com/alejomalia/ouijaecho/tree/main/src) - Dive into the source and collaborate on innovations.

---

## License
This software and its associated coordinate datasets are licensed under the **[OuijaEcho Non-Commercial Scientific & Academic Research License (v1.0)](/LICENSE.txt)**.

[![License: Non-Commercial Scientific](https://img.shields.io/badge/license-Non--Commercial%20Scientific-red.svg)](LICENSE.txt)

- **Permitted Uses:** Non-commercial scientific research, cognitive neuroscience, experimental psychology, academic education, and personal experimentation.
- **Prohibited Uses:** Commercial use, sale, monetized digital services, or proprietary integration without prior explicit written permission from the author.
- **Citation Requirement:** Any academic paper, thesis, preprint, or conference presentation using OuijaEcho must include the standard academic citation specified in [LICENSE.txt](/LICENSE.txt).