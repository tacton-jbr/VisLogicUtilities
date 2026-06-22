import { DirectAnimationPlayer, runAnimation } from "../../src/directanimationplayer/DirectAnimationPlayer.js";
import { expect } from "chai";

function makeCoreStub() {
    const createdTracks = [];
    const createdAnims  = [];
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
                createdAnims.push(this);
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

    return { createdTracks, createdAnims, createdPlayers };
}

describe("DirectAnimationPlayer", () => {
    let stub;
    const fakePart = { name: "arm" };

    beforeEach(() => { stub = makeCoreStub(); });
    afterEach(()  => { delete globalThis.core; });

    // ─── constructor ─────────────────────────────────────────────────────────

    it("creates a KeyframeTrack with the given property", () => {
        new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        expect(stub.createdTracks[0].property).to.equal("rotation.y");
    });

    it("sets keyframes with startValue at time 0 and endValue at the given duration", () => {
        new DirectAnimationPlayer(fakePart, "rotation.y", 10, 90, 2.5);
        expect(stub.createdTracks[0].keys).to.deep.equal([
            { time: 0,   value: 10 },
            { time: 2.5, value: 90 },
        ]);
    });

    it("creates an Animation containing the track", () => {
        new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        expect(stub.createdAnims[0].tracks).to.deep.equal([stub.createdTracks[0]]);
    });

    it("creates an AnimationPlayer for the given part", () => {
        new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        expect(stub.createdPlayers[0].part).to.equal(fakePart);
    });

    // ─── start() ─────────────────────────────────────────────────────────────

    it("start() fires the onFinished callback when the player finishes", () => {
        const player = new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        let called = false;
        player.start(() => { called = true; });
        expect(called).to.equal(true);
    });

    it("start() without a callback does not throw", () => {
        const player = new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        expect(() => player.start()).to.not.throw();
    });

    // ─── getPlayer() ─────────────────────────────────────────────────────────

    it("getPlayer() returns the underlying AnimationPlayer", () => {
        const player = new DirectAnimationPlayer(fakePart, "rotation.y", 0, 90, 2);
        expect(player.getPlayer()).to.equal(stub.createdPlayers[0]);
    });

    // ─── runAnimation() ──────────────────────────────────────────────────────

    describe("runAnimation()", () => {
        it("starts the animation immediately and fires the callback", () => {
            let called = false;
            runAnimation(fakePart, "position.x", 0, 1, 2, () => { called = true; });
            expect(called).to.equal(true);
        });

        it("creates exactly one AnimationPlayer", () => {
            runAnimation(fakePart, "position.x", 0, 1, 2);
            expect(stub.createdPlayers).to.have.length(1);
        });
    });
});
