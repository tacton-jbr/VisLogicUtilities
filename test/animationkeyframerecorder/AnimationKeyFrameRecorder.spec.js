import { AnimationKeyFrameRecorder } from "../../src/animationkeyframerecorder/AnimationKeyFrameRecorder.js";
import { expect } from "chai";

function makePart(overrides = {}) {
    return {
        dockingRotation:    [0, 0, 0],
        dockingTranslation: [0, 0, 0],
        position:           [0, 0, 0],
        ...overrides,
    };
}

describe("AnimationKeyFrameRecorder", () => {
    let recorder;

    beforeEach(() => {
        recorder = new AnimationKeyFrameRecorder();
        globalThis.core = { log: { warn: () => {} } };
    });

    afterEach(() => {
        delete globalThis.core;
    });

    // ─── init() ──────────────────────────────────────────────────────────────

    describe("init()", () => {
        it("throws if parts is missing", () => {
            expect(() => recorder.init({ records: [] })).to.throw();
        });

        it("throws if records is missing", () => {
            expect(() => recorder.init({ parts: { arm: makePart() } })).to.throw();
        });

        it("throws if a record entry is missing partName", () => {
            expect(() => recorder.init({
                parts:   { arm: makePart() },
                records: [{ dpName: "arm_rot", parameters: "dockingRotation[1]" }],
            })).to.throw(/partName/);
        });

        it("throws if a record entry is missing dpName", () => {
            expect(() => recorder.init({
                parts:   { arm: makePart() },
                records: [{ partName: "arm", parameters: "dockingRotation[1]" }],
            })).to.throw(/dpName/);
        });

        it("throws if a record entry is missing parameters", () => {
            expect(() => recorder.init({
                parts:   { arm: makePart() },
                records: [{ partName: "arm", dpName: "arm_rot" }],
            })).to.throw(/parameters/);
        });
    });

    // ─── property mapping ────────────────────────────────────────────────────

    describe("getKeyFrames() — property name mapping", () => {
        function initAndRecord(partValues, parameters) {
            const parts = { obj: makePart(partValues) };
            recorder.init({ parts, records: [{ partName: "obj", dpName: "track", parameters }] });
            recorder.record(0);
            return recorder.getKeyFrames().track.property;
        }

        it("maps dockingRotation[0] → rotation.x", () => {
            expect(initAndRecord({}, "dockingRotation[0]")).to.equal("rotation.x");
        });

        it("maps dockingRotation[1] → rotation.y", () => {
            expect(initAndRecord({}, "dockingRotation[1]")).to.equal("rotation.y");
        });

        it("maps dockingRotation[2] → rotation.z", () => {
            expect(initAndRecord({}, "dockingRotation[2]")).to.equal("rotation.z");
        });

        it("maps dockingRotation (no index) → rotation", () => {
            expect(initAndRecord({}, "dockingRotation")).to.equal("rotation");
        });

        it("maps dockingTranslation[0] → position.x", () => {
            expect(initAndRecord({}, "dockingTranslation[0]")).to.equal("position.x");
        });

        it("maps dockingTranslation[2] → position.z", () => {
            expect(initAndRecord({}, "dockingTranslation[2]")).to.equal("position.z");
        });

        it("maps dockingTranslation (no index) → position", () => {
            expect(initAndRecord({}, "dockingTranslation")).to.equal("position");
        });

        it("leaves a plain property name unchanged", () => {
            expect(initAndRecord({}, "position")).to.equal("position");
        });

        it("maps plain position[0] → position.x", () => {
            expect(initAndRecord({}, "position[0]")).to.equal("position.x");
        });
    });

    // ─── value sampling ──────────────────────────────────────────────────────

    describe("record() — value and time sampling", () => {
        it("reads the correct axis value from an indexed property", () => {
            const parts = { arm: makePart({ dockingRotation: [10, 45, 90] }) };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });
            recorder.record(0);

            expect(recorder.getKeyFrames().track.frames[0].value).to.equal(45);
        });

        it("rounds indexed values to 4 decimal places", () => {
            const parts = { arm: makePart({ dockingRotation: [0, 1.23456789, 0] }) };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });
            recorder.record(0);

            expect(recorder.getKeyFrames().track.frames[0].value).to.equal(1.2346);
        });

        it("converts time_ms to seconds", () => {
            const parts = { arm: makePart({ dockingRotation: [0, 45, 0] }) };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });
            recorder.record(1500);

            expect(recorder.getKeyFrames().track.frames[0].time).to.equal(1.5);
        });

        it("accumulates frames across multiple record() calls", () => {
            const part = makePart({ dockingRotation: [0, 0, 0] });
            const parts = { arm: part };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });

            part.dockingRotation = [0, 0, 0];  recorder.record(0);
            part.dockingRotation = [0, 45, 0]; recorder.record(500);
            part.dockingRotation = [0, 90, 0]; recorder.record(1000);

            const frames = recorder.getKeyFrames().track.frames;
            expect(frames).to.have.length(3);
            expect(frames[0]).to.deep.equal({ time: 0,   value: 0  });
            expect(frames[1]).to.deep.equal({ time: 0.5, value: 45 });
            expect(frames[2]).to.deep.equal({ time: 1,   value: 90 });
        });
    });

    // ─── getKeyFrames() output structure ─────────────────────────────────────

    describe("getKeyFrames() — output structure", () => {
        it("includes the correct partName in the parts array", () => {
            const parts = { arm: makePart() };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });
            recorder.record(0);

            expect(recorder.getKeyFrames().track.parts).to.deep.equal(["arm"]);
        });

        it("returns one track per configured record entry", () => {
            const parts = {
                arm:    makePart({ dockingRotation: [0, 45, 0] }),
                piston: makePart({ dockingTranslation: [0, 0, 1.5] }),
            };
            recorder.init({
                parts,
                records: [
                    { partName: "arm",    dpName: "arm_rot",  parameters: "dockingRotation[1]"    },
                    { partName: "piston", dpName: "piston_z", parameters: "dockingTranslation[2]" },
                ],
            });
            recorder.record(0);

            const kf = recorder.getKeyFrames();
            expect(kf).to.have.all.keys("arm_rot", "piston_z");
        });
    });

    // ─── reset() ─────────────────────────────────────────────────────────────

    describe("reset()", () => {
        it("clears frames so a re-init starts with empty tracks", () => {
            const parts = { arm: makePart({ dockingRotation: [0, 45, 0] }) };
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });
            recorder.record(0);

            recorder.reset();
            recorder.init({ parts, records: [{ partName: "arm", dpName: "track", parameters: "dockingRotation[1]" }] });

            expect(recorder.getKeyFrames().track.frames).to.have.length(0);
        });
    });
});
