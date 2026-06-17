
/**
 * A lightweight helper for animating a single property of a scene object from one value to another.
 *
 * Internally creates a `core.KeyframeTrack`, a `core.Animation`, and a `core.AnimationPlayer`
 * with two keyframes — one at time 0 and one at the given duration.
 *
 * @example
 * import { DirectAnimationPlayer } from "./VisLogicUtilities/src/directanimationplayer/DirectAnimationPlayer.js";
 * let player = new DirectAnimationPlayer(myPart, "position.x", 0, 1, 2);
 * player.start(() => console.log("done"));
 */
export class DirectAnimationPlayer {
  /**
   * @param {core.SceneObject} part - The scene object to animate.
   * @param {string} property - The property/component to animate (e.g. `"position"`, `"rotation.x"`).
   * @param {number | array} startValue - Value of the property/component at the start of the animation.
   * @param {number | array} endValue - Value of the property/component at the end of the animation.
   * @param {number} duration - Duration of the animation in seconds.
   */
  constructor(part, property, startValue, endValue, duration) {
  	let name = `DirectAnimationPlayer_${part.name}_${property}_${new Date().getTime()}`
  	this._track = new core.KeyframeTrack(name, property, {})
	this._track.setKeys([{"time": 0, "value": startValue },{"time": duration, "value": endValue}])
  	this._anim = new core.Animation(name, [this._track]);
  	this._player = new core.AnimationPlayer(part, [this._anim])  	
  }
  
  /**
   * Starts the animation.
   * @param {Function} [onFinished] - Optional callback invoked when the animation completes.
   */
  start(onFinished) {
  	this._player.onFinished = onFinished
  	this._player.start()
  }

  /**
   * Returns the underlying `core.AnimationPlayer` for advanced control (pause, stop, etc.).
   * @returns {core.AnimationPlayer}
   */
  getPlayer() {
  	return this._player
  }

}

/**
 * Convenience function — creates a `DirectAnimationPlayer`, starts it immediately, and discards
 * the instance. Use this for fire-and-forget animations where no further control is needed.
 *
 * @param {core.SceneObject} part - The scene object to animate.
 * @param {string} property - The property or property component to animate (e.g. `"position"`, `"rotation.x"`).
 * @param {number | array} startValue - Value of the property at the start of the animation.
 * @param {number | array} endValue - Value of the property at the end of the animation.
 * @param {number} duration - Duration of the animation in seconds.
 * @param {Function} [onFinished] - Optional callback invoked when the animation completes.
 *
 * @example
 * import { runAnimation } from "./VisLogicUtilities/src/directanimationplayer/DirectAnimationPlayer.js";
 * runAnimation(myPart, "position.x", 0, 1, 2, () => console.log("done"));
 */
export function runAnimation(part, property, startValue, endValue, duration, onFinished) {
	let player = new DirectAnimationPlayer(part, property, startValue, endValue, duration)
	player.start(onFinished)
}