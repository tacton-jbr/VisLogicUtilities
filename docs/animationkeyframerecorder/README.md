# AnimationKeyFrameRecorder

**Development tool** — not intended for use at runtime in a production VisLogic.

A utility for recording property values of scene objects over time and producing keyframe datasets compatible with `SyncAnimationsPlayer`. Drive your scene through its animation states step by step, call `record()` at each frame, and once all keyframes have been recorded export the result as a `.json` file — VisLogic supports JSON imports, so you can import it directly and pass it to `SyncAnimationsPlayer` at runtime.

For a detailed documentation of the public functions, see the [Public Functions](#public-functions) section below or the JSDoc comments in [src/animationkeyframerecorder/AnimationKeyFrameRecorder.js](src/animationkeyframerecorder/AnimationKeyFrameRecorder.js).

## Using AnimationKeyFrameRecorder in VisLogic

Use this recorder when parts of your assembly move non-linearly — for example because their position is resolved by geometry or kinematics rather than driven directly. Step through the motion manually, compute the values at each frame, and record the results.

### Sync variant — step through frames instantly with a `for`-loop

The following example shows how to record all animation keyframes directly in a `for`-loop — without rendering each step live.
```javascript
// in a vislogic script that is for development only

import { AnimationKeyFrameRecorder } from "./VisLogicUtilities/src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";

const parts = build_and_dock_all_parts_of_the_scene()

// Arm is driven directly; cylinder extension and angle are derived from geometry each step

const recorder = new AnimationKeyFrameRecorder();
recorder.init({
    name: "arm_lift_cycle",
    parts,
    records: [
        // define all sceneObjects that should be animated, see the `parameters` table below for more details 
        { partName: "arm",      dpName: "arm",        parameters: "dockingRotation[1]"    },
        { partName: "piston",   dpName: "piston",     parameters: "dockingTranslation[2]" },
        { partName: "cylinder", dpName: "cylinder",   parameters: "dockingRotation[0]"    },
    ],
});

// Mounting distances (base-to-pivot and arm-to-piston, in scene units)
const A = 0.8;
const B = 1.2;

function updateCylinderGeometry(armDeg) {
    const armRad    = armDeg * (Math.PI / 180);
    const extension = Math.sqrt(A * A + B * B - 2 * A * B * Math.cos(armRad));
    parts.piston.dockingTranslation = [0, 0, extension];

    const cylinderAngle = Math.atan2(B * Math.sin(armRad), A - B * Math.cos(armRad));
    parts.cylinder.dockingRotation  = [cylinderAngle, 0, 0];
}

// Step from t = 0 to t = 3000 ms in 500 ms increments.
// At each step: set the scene to the correct state, then record.
for (let t = 0; t <= 3000; t += 500) {
    const armDeg = (t / 3000) * 90;   // arm rotates linearly from 0° to 90°
    parts.arm.dockingRotation = [0, armDeg, 0];

    updateCylinderGeometry(armDeg);    // piston + cylinder angle are non-linear

    recorder.record(t);   // sample all configured properties at this timestamp
}

recorder.printKeyFramesJson();
// → Copy the logged JSON into a new file (.json)
// → Import it in your production VisLogic and pass it to a SyncAnimationsPlayer
```

### Async variant — see each frame animate live as you record

Use `runAnimation` from `DirectAnimationPlayer` if you want to see each step play out visually. Instead of a `for`-loop, a recursive function chains the frames: record the current state, animate to the next position, update the dependent geometry in the callback, then repeat.

```javascript
// in a vislogic script that is for development only

import { AnimationKeyFrameRecorder } from "./VisLogicUtilities/src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";
import { runAnimation } from "./VisLogicUtilities/src/directanimationplayer/DirectAnimationPlayer.js";

// Same parts and recorder setup as in the synchronous example above
const parts = { /* ... */ };
const recorder = new AnimationKeyFrameRecorder();
recorder.init({ /* ... */ });

const A = 0.8;
const B = 1.2;
const FRAME_MS  = 500;
const DURATION_MS = 3000;
const DEG_PER_FRAME = 90 * (FRAME_MS / DURATION_MS);  // constant angle step per frame

// same as in the sync example above
function updateCylinderGeometry(armDeg) { /* ... */ }



let time_ms    = 0;
let currentDeg = 0;

function recordFrame() {
    if (time_ms > DURATION_MS) {
        recorder.printKeyFramesJson();
        return;
    }

    recorder.record(time_ms);   // capture current state (arm + cylinder are already in position)

    runAnimation(parts.arm, "rotation.y", currentDeg, currentDeg + DEG_PER_FRAME, FRAME_MS / 1000, () => {
        currentDeg += DEG_PER_FRAME;
        updateCylinderGeometry(currentDeg);  // arm has arrived — resolve dependent geometry
        recordFrame();                        // record the new state, then animate to the next frame
    });

    time_ms += FRAME_MS;
}

recordFrame();  // direct kick off the process or put it in button click event
```

## The `parameters` Format

The `parameters` string in each record entry controls which property is read from the scene object and what name it gets in the output keyframe data.

Docking property names are always remapped to their KeyframeTrack equivalent. The `[n]` index is optional — without it the base property name is returned; with it the corresponding axis component (`.x`, `.y`, `.z`) is appended:

| `parameters` value        | resulting keyframe property |
| ------------------------- | --------------------------- |
| `"dockingRotation"`       | `"rotation"`                |
| `"dockingRotation[0]"`    | `"rotation.x"`              |
| `"dockingRotation[1]"`    | `"rotation.y"`              |
| `"dockingRotation[2]"`    | `"rotation.z"`              |
| `"dockingTranslation"`    | `"position"`                |
| `"dockingTranslation[0]"` | `"position.x"`              |
| `"dockingTranslation[1]"` | `"position.y"`              |
| `"dockingTranslation[2]"` | `"position.z"`              |
| `"position"` *(plain)*    | `"position"` *(unchanged)*  |
| `"position[0]"` *(plain)* | `"position.x"` *(unchanged)* |

## Public Functions

These are the supported public functions you can use in your code.

### `new AnimationKeyFrameRecorder()`

Creates a new recorder instance. Call `init()` before recording.

---

### `init(settings)`

Configures the recorder. Must be called before `record()`.

**Parameters**

`settings` is a plain object with the following properties:

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `settings.parts` | `Object` | yes | Map of part name to `core.SceneObject`. The same `parts` object you will later pass to `SyncAnimationsPlayer`. | |
| `settings.records` | `Array<Object>` | yes | List of property descriptors to record. See table below. | |
| `settings.name` | `string` | no | Optional name for the recording (used in debug output). | `null` |

Each entry in `settings.records`:

| Name | Type | Required | Description |
| ---- | ---- | ---- | ---- |
| `partName` | `string` | yes | Key in `settings.parts` identifying the scene object to sample. |
| `dpName` | `string` | yes | Key used for this track in the `getKeyFrames()` output. |
| `parameters` | `string` | yes | Property to read. See [The `parameters` Format](#the-parameters-format) above. |

---

### `record(time_ms)`

Samples the current values of all configured properties and stores them as a keyframe.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `time_ms` | `number` | yes | Timestamp of the frame in milliseconds. | |

---

### `getKeyFrames()`

Returns the recorded keyframe data as an `animations` object ready to pass directly to `new SyncAnimationsPlayer(animations, parts)`.

**Returns** `Object`

---

### `printKeyFramesJson()`

Logs the current keyframe data via `core.log.debug`. Copy the output into a `.json` file to use in production.

---

### `reset()`

Clears all recorded keyframes and resets to an uninitialized state. Call `init()` again before recording.
