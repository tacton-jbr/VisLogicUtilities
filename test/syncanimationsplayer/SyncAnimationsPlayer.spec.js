import { SyncAnimationsPlayer, runAnimationsSync } from "../../src/syncanimationsplayer/SyncAnimationsPlayer.js";
import { expect } from "chai";

function makeCoreStub() {
    const createdTracks  = [];
    const createdPlayers = [];

    globalThis.core = {
        KeyframeTrack: class {
            constructor(name, property) {
                this.name = name;
                this.property = property;
                this.keys = null;
                createdTracks.push(this);
            }
            setKeys(keys) { this.keys = keys; }
        },
        Animation: class {
            constructor(name, tracks) {
                this.name = name;
                this.tracks = tracks;
            }
        },
        AnimationPlayer: class {
            constructor(part, anims) {
                this.part = part;
                this.anims = anims;
                this.onFinished = null;
                createdPlayers.push(this);
            }
            start() {
                if (typeof this.onFinished === "function") this.onFinished();
            }
        },
    };

    return { createdTracks, createdPlayers };
}

const FRAMES = [{ time: 0, value: 0 }, { time: 1, value: 90 }];

describe("SyncAnimationsPlayer", () => {
    let stub;
    const parts = {
        arm:    { name: "arm"    },
        piston: { name: "piston" },
    };

    beforeEach(() => { stub = makeCoreStub(); });
    afterEach(()  => { delete globalThis.core; });

    // ─── constructor ─────────────────────────────────────────────────────────

    it("creates one AnimationPlayer per part for a single-part animation", () => {
        const animations = {
            arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm"] },
        };
        new SyncAnimationsPlayer(animations, parts);
        expect(stub.createdPlayers).to.have.length(1);
        expect(stub.createdPlayers[0].part).to.equal(parts.arm);
    });

    it("creates one AnimationPlayer per part when an animation targets multiple parts", () => {
        const animations = {
            arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm", "piston"] },
        };
        new SyncAnimationsPlayer(animations, parts);
        expect(stub.createdPlayers).to.have.length(2);
    });

    it("creates one AnimationPlayer per animation when each targets a different part", () => {
        const animations = {
            arm_rot:  { property: "rotation.y", frames: FRAMES, parts: ["arm"]    },
            piston_z: { property: "position.z", frames: FRAMES, parts: ["piston"] },
        };
        new SyncAnimationsPlayer(animations, parts);
        expect(stub.createdPlayers).to.have.length(2);
    });

    it("creates a KeyframeTrack with the correct property for each animation", () => {
        const animations = {
            arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm"] },
        };
        new SyncAnimationsPlayer(animations, parts);
        expect(stub.createdTracks[0].property).to.equal("rotation.y");
    });

    it("sets the correct keyframes on the track", () => {
        const animations = {
            arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm"] },
        };
        new SyncAnimationsPlayer(animations, parts);
        expect(stub.createdTracks[0].keys).to.deep.equal(FRAMES);
    });

    // ─── start() ─────────────────────────────────────────────────────────────

    it("fires onAllFinished after all players have finished", () => {
        const animations = {
            arm_rot:  { property: "rotation.y", frames: FRAMES, parts: ["arm"]    },
            piston_z: { property: "position.z", frames: FRAMES, parts: ["piston"] },
        };
        const player = new SyncAnimationsPlayer(animations, parts);
        let callCount = 0;
        player.start(() => { callCount++; });
        expect(callCount).to.equal(1);
    });

    it("fires onAllFinished exactly once even when multiple parts are animated", () => {
        const animations = {
            rot: { property: "rotation.y", frames: FRAMES, parts: ["arm", "piston"] },
        };
        const player = new SyncAnimationsPlayer(animations, parts);
        let callCount = 0;
        player.start(() => { callCount++; });
        expect(callCount).to.equal(1);
    });

    it("does not throw when start() is called without a callback", () => {
        const animations = {
            arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm"] },
        };
        const player = new SyncAnimationsPlayer(animations, parts);
        expect(() => player.start()).to.not.throw();
    });

    // ─── runAnimationsSync() ─────────────────────────────────────────────────

    describe("runAnimationsSync()", () => {
        it("starts immediately and fires the callback", () => {
            const animations = {
                arm_rot: { property: "rotation.y", frames: FRAMES, parts: ["arm"] },
            };
            let called = false;
            runAnimationsSync(animations, parts, () => { called = true; });
            expect(called).to.equal(true);
        });
    });
});
