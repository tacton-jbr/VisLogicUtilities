const AXIS = ["x", "y", "z"];

const PROPERTY_MAP = {
  dockingRotation:    "rotation",
  dockingTranslation: "position",
};

function toKeyFrameProperty(parameters) {
  const { key, index } = parseParam(parameters);
  const mapped = PROPERTY_MAP[key];
  if (mapped && index !== null) return `${mapped}.${AXIS[index]}`;
  return parameters;
}

function parseParam(param) {
  const m = param.match(/^(\w+)\[(\d+)\]$/);
  return m
    ? { key: m[1], index: Number(m[2]) }
    : { key: param, index: null };
}

function getValue(obj, { key, index }) {
  let val = obj[key];
  if (index !== null) val = Math.round(val[index] * 10000) / 10000
  return val;
}

export class AnimationKeyFrameRecorder {
  constructor() {
  	core.log.debug("[AnimationKeyFrameRecorder] constructor")
    this._name = null;
    this._parts = null;
    this._records = [];
    this._keyframes = {};
    this.onBeforeFrameRecord = null;
  }

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
        parameters: p.parameters,
        param:      parseParam(p.parameters),
      };
    });

    this._keyframes = Object.fromEntries(this._records.map(r => [r.dpName, []]));
  }

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
        value: getValue(partRef, rec.param),
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

  getKeyFrames() {
    const result = {};
    for (const rec of this._records) {
      result[rec.dpName] = {
        parts:    [rec.partName],
        property: toKeyFrameProperty(rec.parameters),
        frames:   this._keyframes[rec.dpName],
      };
    }
    return result;
  }

  printKeyFramesJson() {
  	core.log.debug("[AnimationKeyFrameRecorder] printKeyFramesJson", this._name)
    core.log.debug(this.getKeyFrames());
  }

  reset() {
    this._records = [];
    this._keyframes = {};
    this.onBeforeFrameRecord = null;
    core.log.debug("[AnimationKeyFrameRecorder] Reset.");
  }


  //-------------------------------

  /*
  static startFrameRecorder() {
    let recorder = new AnimationKeyFrameRecorder();
    recorder.init(settings);
    recorder.onBeforeFrameRecord = (time_ms) => {};
    
    var time_ms = 0;
    function recordFrame() {
      if (time_ms > DURATION_MS) {
        recorder.printKeyFramesJson()
        return
      }
      recorder.record(time_ms);
    
      const startAngle  = VALUE_START + (time_ms / FRAME_TIME_MS) * VALUE_CHANGE
      const endAngle  = startAngle + VALUE_CHANGE		
        
        runAnimation(parts.backrest, "rotation.y", FRAME_TIME_MS / 1000, startAngle, endAngle, () => {
        retargetCylinderParts(endAngle)
        core.log.debug("Animation finished for time_ms =", time_ms, endAngle)
        recordFrame()
      })
      
        time_ms += FRAME_TIME_MS;
    }
    
  }*/

}
