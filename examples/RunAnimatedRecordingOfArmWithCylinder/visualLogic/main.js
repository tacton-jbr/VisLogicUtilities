core.scene.camera.lookAt([0.2, 0.6, -0.3], [0.6, 0.9, 1.2]);

import {AnimationKeyFrameRecorder} from "./VisLogicUtilities/src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";
import {runAnimation} from "./VisLogicUtilities/src/directanimationplayer/DirectAnimationPlayer.js"
import Parts from "./VisLogicUtilities/src/parts/Parts.js"



// A `configChanged` event is not needed here.
// The use of `AnimationKeyFrameRecorder` is for development purposes only.
// This VisLogic code should only run locally in the VIZstudio Preview. 

/**
 * defines all assets that can be used in the scene, and assigns them a alia names.
 */
Parts.setAliasMap({
	"base": core.assets("base"),
	"arm": core.assets("arm"),
	"cylinder_bottom": core.assets("cylinder_bottom"),
	"cylinder_top": core.assets("cylinder_top")
})

// create new recorder instance
const recorder = new AnimationKeyFrameRecorder();


/**
 * Adds all parts to the scene, docks them together, and kicks off the keyframe recording loop.
 * Must be called once on startup after the asset alias map has been configured.
 */
function buildSceneAndStartRecording() {
	let base = Parts.add("base")
	let arm = Parts.add("arm")
	let cylinder_bottom = Parts.add("cylinder_bottom")
	let cylinder_top = Parts.add("cylinder_top")	
	arm.dockTo(base, "arm", "arm");
	cylinder_top.dockTo(arm, "cylinder", "cylinder");
	cylinder_bottom.dockTo(base, "cylinder", "cylinder");
	
	retargetCylinderParts(0)
	
	var settings = {
	  name:  "arm_animation",
	  parts: Parts.getAll(), // or specify an array of parts to only record those
	  records: [
	    { partName: "arm",             dpName: "arm",             parameters: "dockingRotation[1]" },
	    { partName: "cylinder_bottom", dpName: "cylinder_bottom", parameters: "dockingRotation[1]" },
	    { partName: "cylinder_top",    dpName: "cylinder_top",    parameters: "dockingRotation[1]" },
	  ],
	};
	
	recorder.init(settings);
		
	// START animated recording proceess, after loading the scene and setting up the parts
	recordFrame()
}


/**
 * Recomputes and applies the docking rotation of both cylinder parts so that they
 * continue to meet correctly after the arm has rotated by `arm_angle` degrees.
 * @param {number} arm_angle - Current rotation of the arm around the Y axis (degrees).
 */
function retargetCylinderParts(arm_angle) {
	let bot_pos= Parts.get("cylinder_bottom").dockingPoints["cylinder"].position
	let top_pos= Parts.get("cylinder_top").dockingPoints["cylinder"].position
	let dx = top_pos[0] - bot_pos[0]
	let dy = top_pos[1] - bot_pos[1]
	let angle = Math.atan2(dx, dy) * 180 / Math.PI
	
	updateProperty(Parts.get("cylinder_top"),    "dockingRotation", 1, angle - arm_angle)
	updateProperty(Parts.get("cylinder_bottom"), "dockingRotation", 1, angle)
}

/**
 * Updates a single axis of an array-valued property on a part.
 * @param {object} part - The part whose property should be updated.
 * @param {string} propertyName - Name of the array property (e.g. `"dockingRotation"`).
 * @param {number} axisIndex - Zero-based index of the axis to change.
 * @param {number} newValue - New value for that axis.
 */
function updateProperty(part, propertyName, axisIndex, newValue) {
	part[propertyName] = part[propertyName].map((v, i, p) => (i === axisIndex ? newValue : v))
}


const ANIMATION_FRAME_TIME_MS = 100;
const ANIMATION_DURATION_MS = 2000;

const ANIMATION_START_ANGLE = 0;
const ANIMATION_END_ANGLE = 40;

var current_time_ms = 0;
var current_arm_angle = 0
const ANIMATION_VALUE_CHANGE_PER_FRAME = (ANIMATION_END_ANGLE - ANIMATION_START_ANGLE) * ANIMATION_FRAME_TIME_MS  / ANIMATION_DURATION_MS;

/**
 * Records the current part state at `current_time_ms`, then schedules the next frame
 * by animating the arm a small step and retargeting the cylinder parts.
 * Terminates and prints the JSON result when `ANIMATION_DURATION_MS` is reached.
 */
function recordFrame() {
	// record the current values of the specified parameters for all parts, and save them under the current time (in ms)
	recorder.record(current_time_ms);

	if (current_time_ms >= ANIMATION_DURATION_MS) {
		// print the recorded keyframes result as JSON to the console, which can then be used for the DirectAnimationPlayer.
		recorder.printKeyFramesJson()
		return
	}

	// prepare next frame by playing a small linear animation 'frame' of the 'arm'
	// and retargeting the 'cylinder' parts accordingly, so that they are correctly fitting back together when recording the next frame.
	const target_arm_angle  = current_arm_angle + ANIMATION_VALUE_CHANGE_PER_FRAME		    
    runAnimation(Parts.get("arm"), "rotation.y", current_arm_angle, target_arm_angle, ANIMATION_FRAME_TIME_MS / 1000, () => {
		retargetCylinderParts(target_arm_angle)
		recordFrame()
	})
	// update frametime and current angle for the next frame
    current_time_ms += ANIMATION_FRAME_TIME_MS;
	current_arm_angle = target_arm_angle
}


// RUN - setup the scene and start recording
buildSceneAndStartRecording()