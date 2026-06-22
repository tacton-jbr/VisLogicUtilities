# AnimationKeyFrameRecorder

**Development tool** — not intended for use at runtime in a production VisLogic.

A utility for recording property values of scene objects over time and producing keyframe datasets compatible with `SyncAnimationsPlayer`. Drive your scene through its animation states step by step, call `record()` at each frame, and once all keyframes have been recorded export the result as a `.json` file — VisLogic supports JSON imports, so you can import it directly and pass it to `SyncAnimationsPlayer` at runtime.

For a detailed documentation of the public functions, see the [Public Functions](#public-functions) section below or the JSDoc comments in [src/animationkeyframerecorder/AnimationKeyFrameRecorder.js](src/animationkeyframerecorder/AnimationKeyFrameRecorder.js).

## Using AnimationKeyFrameRecorder in VisLogic

Use this recorder when parts of your assembly move non-linearly — for example because their position is resolved by geometry or kinematics rather than driven directly. Step through the motion manually, compute the values at each frame, and record the results.

```javascript
// in a vislogic script that is for development only

import { AnimationKeyFrameRecorder } from "./VisLogicUtilities/src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";

const parts = /* build and dock all parts of the scene */

const recorder = new AnimationKeyFrameRecorder();
recorder.init({
    name: "my_animation",
    parts,
    records: [
        // see the `parameters` table below for all supported property formats
        { partName: "part_a", dpName: "part_a", parameters: "dockingRotation[1]"    },
        { partName: "part_b", dpName: "part_b", parameters: "dockingTranslation[2]" },
    ],
});

for (let t = 0; t <= 3000; t += 500) {
    /* set all parts to the correct state for this frame */

    recorder.record(t);
}

recorder.printKeyFramesJson();
// → Copy the logged JSON into a .json file
// → Import it in your production VisLogic and pass it to SyncAnimationsPlayer
```

For an async variant that plays each step live — useful for visually verifying the recorded motion — use `runAnimation` from `DirectAnimationPlayer` instead of a `for`-loop to chain frames through a recursive callback.

A full worked example using this async (animated) approach is available in [examples/RunAnimatedRecordingOfArmWithCylinder](../../examples/RunAnimatedRecordingOfArmWithCylinder/).


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
