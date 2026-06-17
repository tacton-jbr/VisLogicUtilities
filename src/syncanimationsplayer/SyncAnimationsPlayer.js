

export class SyncAnimationsPlayer {
	
	constructor(animations, parts) {
		let animationNames = Object.keys(animations)
		let player_started = 0
		this._finishCallback = null
		for (let animName of animationNames) {
			let entry = animations[animName]
  			let name = `SyncAnimationsPlayer_${animName}_${entry.property}_${new Date().getTime()}`
			let trackKeys = []
			for (let frame of entry.frames) {
				trackKeys.push(frame)
			}	
			let track = new core.KeyframeTrack(name, entry.property, {})
			track.setKeys(trackKeys)
			let anim = new core.Animation(name, [track]);
			for (let partName of entry.parts) {
				let part = parts[partName]
				let player = new core.AnimationPlayer(part, [anim])
				player.start()
				player_started++
				player.onFinished = () => {
					player_started--
					if (player_started <= 0) {
						this._finishCallback()
					}
				}
			}
		}
		
	}
	
	onAllFinished(finishCallback) {
		this._finishCallback = finishCallback
	}
	
}

export function runAnimationsSync(animations, parts, onAllFinished) {
	core.log.debug("[runAnimationsSync]")
	let player = new SyncAnimationsPlayer(animations, parts)
	player.onAllFinished(onAllFinished)
}