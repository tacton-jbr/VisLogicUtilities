
/**
 * Plays multiple keyframe animations across multiple scene objects simultaneously
 * and fires a single callback when all of them have finished.
 *
 * Each animation entry defines a property to animate, a set of keyframes, and the
 * list of parts it should be applied to. All players are started together via `start()`.
 *
 * @example
 * import { SyncAnimationsPlayer } from "./VisLogicUtilities/src/syncanimationsplayer/SyncAnimationsPlayer.js";
 * const player = new SyncAnimationsPlayer(animations, parts);
 * player.start(() => console.log("all done"));
 */
export class SyncAnimationsPlayer {

	/**
	 * @param {Object} animations - Map of animation name to animation descriptor.
	 *   Each value is an object with:
	 *   - `property` {string} — the property or component to animate (e.g. `"position.x"`)
	 *   - `frames` {Array<{time: number, value: number|array}>} — the keyframe data
	 *   - `parts` {string[]} — names of parts (keys in `parts`) to apply this animation to
	 * @param {Object} parts - Map of part name to `core.SceneObject`.
	 */
	constructor(animations, parts) {
		core.log.debug("[SyncAnimationsPlayer] constructor")
		this._players = []
		for (const animName of Object.keys(animations)) {
			const entry = animations[animName]
			const name = `SyncAnimationsPlayer_${animName}_${entry.property}_${new Date().getTime()}`
			const track = new core.KeyframeTrack(name, entry.property, {})
			track.setKeys([...entry.frames])
			const anim = new core.Animation(name, [track])
			for (const partName of entry.parts) {
				this._players.push(new core.AnimationPlayer(parts[partName], [anim]))
			}
		}
	}

	/**
	 * Starts all animation players. The optional callback is invoked once when the
	 * last player finishes.
	 * @param {Function} [onAllFinished] - Called once all animations have completed.
	 */
	start(onAllFinished) {
		let playersRunning = this._players.length
		for (const player of this._players) {
			player.onFinished = () => {
				playersRunning--
				if (playersRunning <= 0 && typeof onAllFinished === "function") {
					onAllFinished()
				}
			}
			player.start()
		}
	}

}

/**
 * Convenience function — creates a `SyncAnimationsPlayer`, starts it immediately,
 * and discards the instance. Use this for fire-and-forget playback.
 *
 * @param {Object} animations - Map of animation name to animation descriptor.
 *   Each value is an object with:
 *   - `property` {string} — the property or component to animate (e.g. `"position.x"`)
 *   - `frames` {Array<{time: number, value: number|array}>} — the keyframe data
 *   - `parts` {string[]} — names of parts (keys in `parts`) to apply this animation to
 * @param {Object} parts - Map of part name to `core.SceneObject`.
 * @param {Function} [onAllFinished] - Called once all animations have completed.
 *
 * @example
 * import { runAnimationsSync } from "./VisLogicUtilities/src/syncanimationsplayer/SyncAnimationsPlayer.js";
 * runAnimationsSync(animations, parts, () => console.log("all done"));
 */
export function runAnimationsSync(animations, parts, onAllFinished) {
	core.log.debug("[runAnimationsSync]")
	const player = new SyncAnimationsPlayer(animations, parts)
	player.start(onAllFinished)
}
