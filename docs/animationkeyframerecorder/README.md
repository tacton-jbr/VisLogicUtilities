# AnimationKeyFrameRecorder

**Development tool** — not intended for use at runtime in a production VisLogic.

A utility for recording property values of scene objects over time and producing keyframe datasets compatible with `SyncAnimationsPlayer`. Drive your scene through its animation states step by step, call `record()` at each frame, then export the result as a `.json` file — VisLogic supports JSON imports, so you can import it directly and pass it to `SyncAnimationsPlayer` at runtime.

For a detailed documentation of the public functions, please see the JSDoc comments
in [src/animationkeyframerecorder/AnimationKeyFrameRecorder.js](src/animationkeyframerecorder/AnimationKeyFrameRecorder.js).

## Using AnimationKeyFrameRecorder in VisLogic

```javascript
// any file in vislogic (development only)

// import
import { AnimationKeyFrameRecorder } from "./VisLogicUtilities/src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";

const parts = {
    arm_1: core.scene.create(core.assets("robot/arm_1")),
    arm_2: core.scene.create(core.assets("robot/arm_2")),
}

const recorder = new AnimationKeyFrameRecorder();
recorder.init({
    parts,
    records: [
        { partName: "arm_1", dpName: "arm_1_rot_y", parameters: "dockingRotation[1]" },
        { partName: "arm_2", dpName: "arm_2_rot_y", parameters: "dockingRotation[1]" },
    ],
});

// optionally: apply scene changes just before each frame is sampled
recorder.onBeforeFrameRecord = (time_ms) => {
    // e.g. update docking points or apply transforms
};

recorder.record(0);     // sample at t=0ms
recorder.record(500);   // sample at t=500ms
recorder.record(1000);  // sample at t=1000ms

recorder.printKeyFramesJson(); // log result → save as .json → import in production VisLogic
```

## The `parameters` Format

The `parameters` string in each record entry controls which property is read from the scene object and what name it gets in the output keyframe data.

Plain property names are passed through as-is. Indexed docking properties are automatically mapped to their axis component:

| `parameters` value       | resulting keyframe property |
| ------------------------ | --------------------------- |
| `"dockingRotation[0]"`   | `"rotation.x"`              |
| `"dockingRotation[1]"`   | `"rotation.y"`              |
| `"dockingRotation[2]"`   | `"rotation.z"`              |
| `"dockingTranslation[0]"` | `"position.x"`             |
| `"dockingTranslation[1]"` | `"position.y"`             |
| `"dockingTranslation[2]"` | `"position.z"`             |
| `"position"` *(plain)*   | `"position"` *(unchanged)*  |

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

Samples the current values of all configured properties and stores them as a keyframe. `onBeforeFrameRecord` is invoked first if set.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `time_ms` | `number` | yes | Timestamp of the frame in milliseconds. | |

---

### `onBeforeFrameRecord`

Optional hook, called at the start of each `record()` call before any values are sampled. Assign a function to apply scene changes that should be captured in the frame. Errors thrown inside the hook are caught and logged.

```javascript
recorder.onBeforeFrameRecord = (time_ms) => {
    // apply scene state for this frame
};
```

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
