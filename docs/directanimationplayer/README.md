# DirectAnimationPlayer

A module for quickly animating a single property of a scene object from one value to another using **linear interpolation**.

This module wraps the VisLogic animation API (`core.KeyframeTrack`, `core.Animation`, `core.AnimationPlayer`) into a minimal interface. It creates a two-keyframe animation that linearly interpolates the given property from `startValue` to `endValue` over the specified `duration`.

For a detailed documentation of the public functions, see the [Public Functions](#public-functions) section below or the JSDoc comments in [src/directanimationplayer/DirectAnimationPlayer.js](src/directanimationplayer/DirectAnimationPlayer.js).

## Using DirectAnimationPlayer in VisLogic

```javascript
// any file in vislogic

// import
import { DirectAnimationPlayer, runAnimation } from "./VisLogicUtilities/src/directanimationplayer/DirectAnimationPlayer.js";

const myPart = core.scene.create(core.assets("my_example_part_asset"))

// fire-and-forget: animate position.x from 0 to 1 over 2 seconds
runAnimation(myPart, "position.x", 0, 1, 2);

// fire-and-forget with a callback when the animation finishes
runAnimation(myPart, "position.x", 0, 1, 2, () => console.log("animation done"));

// or use the class directly to keep a reference to the player
let player = new DirectAnimationPlayer(myPart, "position.x", 0, 1, 2);
player.start(() => console.log("animation done"));

// access the underlying core.AnimationPlayer for advanced control (e.g. stop mid-way)
player.getPlayer().stop();
```

## Public Functions

These are the supported public functions you can use in your code.

### `new DirectAnimationPlayer(part, property, startValue, endValue, duration)`

Creates a new animation player that linearly interpolates a single property from `startValue` to `endValue` over `duration` seconds. The animation is **not started automatically** — call `start()` to play it.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `part` | `core.SceneObject` | yes | The scene object whose property will be animated. | |
| `property` | `string` | yes | The property or property component to animate (e.g. `"position"`, `"rotation.x"`). | |
| `startValue` | `number \| array` | yes | Value of the property at the start of the animation. | |
| `endValue` | `number \| array` | yes | Value of the property at the end of the animation. | |
| `duration` | `number` | yes | Duration of the animation in seconds. | |

---

### `start(onFinished?)`

Starts the animation.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `onFinished` | `Function` | no | Callback invoked when the animation completes. | `undefined` |

---

### `getPlayer()`

Returns the underlying `core.AnimationPlayer`. Use this for advanced control such as pausing or stopping the animation before it finishes.

**Returns** `core.AnimationPlayer`

---

### `runAnimation(part, property, startValue, endValue, duration, onFinished?)`

Convenience function that linearly interpolates a property from `startValue` to `endValue` over `duration` seconds, then fires the optional callback. Creates a `DirectAnimationPlayer` internally, starts it immediately, and discards the instance. Use this for fire-and-forget animations where no further control over the player is needed.

**Parameters**

| Name | Type | Required | Description | Default |
| ---- | ---- | ---- | ---- | ---- |
| `part` | `core.SceneObject` | yes | The scene object whose property will be animated. | |
| `property` | `string` | yes | The property or property component to animate (e.g. `"position"`, `"rotation.x"`). | |
| `startValue` | `number \| array` | yes | Value of the property at the start of the animation. | |
| `endValue` | `number \| array` | yes | Value of the property at the end of the animation. | |
| `duration` | `number` | yes | Duration of the animation in seconds. | |
| `onFinished` | `Function` | no | Callback invoked when the animation completes. | `undefined` |
