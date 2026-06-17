
export class DirectAnimationPlayer {
  constructor(part, property, duration, startValue, endValue) {
  	core.log.debug("[AnimationKeyFrameRecorder] constructor")
  	let name = `DirectAnimationPlayer_${part.name}_${property}_${new Date().getTime()}`
  	this._track = new core.KeyframeTrack(name, property, {})
	this._track.setKeys([{"time": 0, "value": startValue },{"time": duration, "value": endValue}])
  	this._anim = new core.Animation(name, [this._track]);
  	this._player = new core.AnimationPlayer(part, [this._anim])  	
  }
  
  start(onFinished) {
  	this._player.onFinished = onFinished  	
  	this._player.start()
  }
  
  getPlayer() {
  	return this._player
  }
  
}

export function runAnimation(part, property, duration, startValue, endValue, onFinished) {
	core.log.debug("[runAnimation]", part.asset.name, property, duration, startValue, endValue)
	let player = new DirectAnimationPlayer(part, property, duration, startValue, endValue)
	player.start(onFinished)
}