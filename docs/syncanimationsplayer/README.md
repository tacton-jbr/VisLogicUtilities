# SyncAnimationsPlayer

A module for playing multiple keyframe animations across multiple scene objects simultaneously and being notified once all of them have finished.

This module wraps the VisLogic animation API (`core.KeyframeTrack`, `core.Animation`, `core.AnimationPlayer`) to drive any number of scene objects across any number of animation tracks in parallel. It is intended for pre-baked keyframe data (e.g. recorded with `AnimationKeyFrameRecorder`). For simple two-point tweens, use [DirectAnimationPlayer](../directanimationplayer) instead.

For a detailed documentation of the public functions, see the [Public Functions](#public-functions) section below or the JSDoc comments in [src/syncanimationsplayer/SyncAnimationsPlayer.js](src/syncanimationsplayer/SyncAnimationsPlayer.js).

## Using SyncAnimationsPlayer in VisLogic

```javascript
// any file in vislogic

// import
import { SyncAnimationsPlayer, runAnimationsSync } from "./VisLogicUtilities/src/syncanimationsplayer/SyncAnimationsPlayer.js";

const parts = {
    arm_1: core.scene.create(core.assets("robot/arm_1")),
    arm_2: core.scene.create(core.assets("robot/arm_2")),
}

const animations = {
    arm_rotation: {
        property: "rotation.x",
        frames: [
            { time: 0, value: 0 },
            { time: 1, value: 30 },
        ],
        parts: ["arm_1", "arm_2"],  // both parts get this animation
    },
}

// fire-and-forget: play all animations and log when done
runAnimationsSync(animations, parts, () => console.log("all done"));

// or use the class directly to keep a reference
const player = new SyncAnimationsPlayer(animations, parts);
player.start(() => console.log("all done"));
```

## The `animations` Parameter

The `animations` parameter is a plain object where each key is a freely chosen animation name and each value is an animation descriptor. Multiple animation entries can be combined freely — each runs independently in parallel.

```javascript
const animations = {
    // key: freely chosen animation name
    base_movement: {
        property: "position",       // property/component to animate
        frames: [                      // keyframe data
            { time: 0,   value: [0, 0, 0] }, // value at t=0s
            { time: 0.5, value: [1, 0, 0] }, // value at t=0.5s
            { time: 1,   value: [1, 0, 2] }, // value at t=1s
        ],
        parts: ["base"],       // which parts get this animation (list of key names)
    },
    arm_rotation: {
        property: "rotation.y",
        frames: [
            { time: 0, value: 1 },
            { time: 1, value: 0 },
        ],
        parts: ["arm_1", "arm_2"],
    },
}
```

Each animation descriptor has these properties:

| Name | Type | Required | Description |
| ---- | ---- | ---- | ---- |
| `property` | `string` | yes | The property or component to animate on each part (e.g. `"position.x"`, `"rotation"`). |
| `frames` | `Array<{time: number, value: number\|array}>` | yes | Keyframe data. Each entry has a `time` (seconds) and a `value`. More than two frames are supported. |
| `parts` | `string[]` | yes | Names of parts to apply this animation to. Each name must be a key in the `parts` parameter. |

## Public Functions

These are the supported public functions you can use in your code.

### `new SyncAnimationsPlayer(animations, parts)`

Creates a new player for the given animations. The animations are **not started automatically** — call `start()` to play them.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `animations` | `Object` | yes | Map of animation name to animation descriptor. See [The `animations` Parameter](#the-animations-parameter) above. | |
| `parts` | `Object` | yes | Map of part name to `core.SceneObject`. | |

---

### `start(onAllFinished?)`

Starts all animation players simultaneously. The optional callback is invoked once when the last player finishes.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `onAllFinished` | `Function` | no | Called once all animations have completed. | `undefined` |

---

### `runAnimationsSync(animations, parts, onAllFinished?)`

Convenience function that creates a `SyncAnimationsPlayer`, starts it immediately, and discards the instance. Use this for fire-and-forget playback where no further control over the players is needed.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `animations` | `Object` | yes | Same shape as the constructor parameter. | |
| `parts` | `Object` | yes | Map of part name to `core.SceneObject`. | |
| `onAllFinished` | `Function` | no | Called once all animations have completed. | `undefined` |
