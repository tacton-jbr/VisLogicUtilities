const AXIS = ["x", "y", "z"];

const ANIMATION_PROPERTY_MAP = {
  dockingRotation:    "rotation",
  dockingTranslation: "position",
};

function toAnimationProperty({ property, index }) {
  const mapped = ANIMATION_PROPERTY_MAP[property] ?? property;
  if (index !== null) return `${mapped}.${AXIS[index]}`;
  return mapped;
}

function parseParam(param) {
  const m = param.match(/^(\w+)\[(\d+)\]$/);
  return m
    ? { property: m[1], index: Number(m[2]) }
    : { property: param, index: null };
}

function getValue(obj, { property, index }) {
  let val = obj[property];
  if (index !== null) val = Math.round(val[index] * 10000) / 10000
  return val;
}

/**
 * **Development tool** — not intended for use at runtime in a production VisLogic.
 *
 * Use this class during development to sample property values of scene objects over time
 * and produce a keyframe dataset compatible with `SyncAnimationsPlayer`. Once you are happy
 * with the recorded output, save the result of `printKeyFramesJson()` as a `.json` file in your
 * project — VisLogic supports JSON imports, so you can import it directly and pass it to
 * `SyncAnimationsPlayer` at runtime.
 *
 * Typical workflow:
 * 1. `init(settings)` — configure which parts and properties to record
 * 2. Drive scene changesin small steps (e.g. via `DirectAnimationPlayer` or by direct property changes) and call `record(time_ms)` at each frame
 * 3. `printKeyFramesJson()` — log the result and save it as a `.json` file in your project
 *
 * @example
 * const recorder = new AnimationKeyFrameRecorder();
 * recorder.init({ parts, records: [{ partName: "arm", dpName: "arm_rot", parameters: "dockingRotation[1]" }] });
 * // initialize your scene here
 * recorder.record(0);
 * // update your scene here
 * recorder.record(500);
 * recorder.printKeyFramesJson(); // prints the keyframe data to the log, so you can copy it into your project
 */
export class AnimationKeyFrameRecorder {
  constructor() {
  	core.log.debug("[AnimationKeyFrameRecorder] constructor")
    this._name = null;
    this._parts = null;
    this._records = [];
    this._keyframes = {};
    /**
     * Optional hook called at the start of each `record()` call, before any values are sampled.
     * Use this to trigger scene updates (e.g. applying transforms) that should be captured in the frame.
     * Receives the current timestamp in milliseconds. Errors thrown here are caught and logged.
     * @type {((time_ms: number) => void) | null}
     */
    this.onBeforeFrameRecord = null;
  }

  /**
   * Configures the recorder. Must be called before `record()`.
   *
   * @propertyEntry {Object} settings
   * @param {Object} propertyEntry.parts - Map of part name to `core.SceneObject`. The same object passed to `SyncAnimationsPlayer`.
   * @param {Array<Object>} propertyEntry.records - List of property descriptors to record. Each entry:
   *   - `partName` {string} — key in `settings.parts` identifying the scene object to sample
   *   - `dpName` {string} — key used for this track in the `getKeyFrames()` output
   *   - `parameters` {string} — property to read (e.g. `"dockingRotation[1]"`, `"position"`).
   *     Docking properties with index are automatically mapped to their axis component — see the
   *     [parameters mapping table](docs/animationkeyframerecorder/README.md#the-parameters-format) in the docs.
   * @param {string} [propertyEntry.name] - Optional name for the recording (used in debug output).
   */
  init(settings) {
  	core.log.debug("[AnimationKeyFrameRecorder] init", settings)
    if (!settings?.records || !Array.isArray(settings.records)) {
      throw new Error("AnimationKeyFrameRecorder.init: settings.records must be an array");
    }
    if (!settings.parts) {
      throw new Error("AnimationKeyFrameRecorder.init: settings.parts is required");
    }

    this._name = settings.name ?? null;
    this._parts = settings.parts;

    this._records = settings.records.map((p, i) => {
      if (!p.partName)   throw new Error(`partName missing at index ${i}`);
      if (!p.dpName)     throw new Error(`dpName missing at index ${i}`);
      if (!p.parameters) throw new Error(`parameters missing at index ${i}`);
      return {
        partName:   p.partName,
        dpName:     p.dpName,
        partProperty: p.parameters,
        partPropertyEntry:      parseParam(p.parameters),
      };
    });

    this._keyframes = Object.fromEntries(this._records.map(r => [r.dpName, []]));
  }

  /**
   * Samples the current values of all configured properties and stores them as a keyframe at `time_ms`.
   * `onBeforeFrameRecord` is invoked first if set, allowing scene state to be updated before sampling.
   * @param {number} time_ms - Timestamp of the frame in milliseconds.
   */
  record(time_ms) {
  	core.log.debug("[AnimationKeyFrameRecorder] record", time_ms)
    if (!this._records.length) {
      core.log.warn("[AnimationKeyFrameRecorder] Not initialized. Call init() first.");
      return;
    }

    this._invokeBeforeFrameRecord(time_ms);

    for (const rec of this._records) {
      const partRef = this._parts[rec.partName];
      this._keyframes[rec.dpName].push({
        time:  time_ms / 1000,
        value: getValue(partRef, rec.partPropertyEntry),
      });
    }
  }

  _invokeBeforeFrameRecord(time_ms) {
    if (typeof this.onBeforeFrameRecord !== "function") return;
    try {
      this.onBeforeFrameRecord(time_ms);
    } catch (err) {
     core.log.error("[AnimationKeyFrameRecorder] onBeforeFrameRecord error:", err.message);
    }
  }

  /**
   * Returns the recorded keyframe data in the format expected by `SyncAnimationsPlayer`.
   * Each key in the result corresponds to the `dpName` of a record entry.
   * @returns {Object} An `animations` object ready to pass directly to `new SyncAnimationsPlayer(animations, parts)`.
   */
  getKeyFrames() {
    const result = {};
    for (const rec of this._records) {
      result[rec.dpName] = {
        parts:    [rec.partName],
        property: toAnimationProperty(rec.partPropertyEntry),
        frames:   this._keyframes[rec.dpName],
      };
    }
    return result;
  }

  /** Logs the current keyframe data via `core.log.debug`. Useful for inspecting recorded output during development. */
  printKeyFramesJson() {
  	core.log.debug("[AnimationKeyFrameRecorder] printKeyFramesJson", this._name)
    core.log.debug(this.getKeyFrames());
  }

  /** Clears all recorded keyframes and resets to an uninitialized state. Call `init()` again before recording. */
  reset() {
    this._records = [];
    this._keyframes = {};
    this.onBeforeFrameRecord = null;
    core.log.debug("[AnimationKeyFrameRecorder] Reset.");
  }

}
