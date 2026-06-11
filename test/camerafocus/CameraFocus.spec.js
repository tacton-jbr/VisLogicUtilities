import CameraFocus from "../../src/camerafocus/CameraFocus.js";
import { expect } from "chai";

const EPSILON = 1e-10;

describe("CameraFocus", () => {
    let lookAtCalls;
    let currentBB;

    function makeBB(min, max) {
        return { min, max };
    }

    function installFakeCore(resolution = { width: 1, height: 1 }) {
        lookAtCalls = [];
        globalThis.core = {
            scene: {
                getBoundingBox(_sceneObjects) {
                    return currentBB;
                },
                camera: {
                    lookAt(center, pos) {
                        lookAtCalls.push({ center, pos });
                    }
                }
            },
            application: { resolution }
        };
    }

    function uninstallFakeCore() {
        delete globalThis.core;
    }

    beforeEach(() => {
        installFakeCore();
    });

    afterEach(() => {
        uninstallFakeCore();
    });

    describe("focus()", () => {
        it("places camera along +Z with default angles, FoV=90, unit cube centered at origin", () => {
            // perpX=xLen=1, perpY=yLen=1 → perpMax=1 matches perpY → uses vertical FoV
            // halfFoV=45°, adjacent = 0.5/tan(45°) = 0.5, depth=1 → distance = 0.5+0.5 = 1
            currentBB = makeBB([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
            CameraFocus.focus([], 90);

            expect(lookAtCalls).to.have.length(1);
            const { center, pos } = lookAtCalls[0];
            expect(center).to.deep.equal([0, 0, 0]);
            expect(pos[0]).to.be.closeTo(0, EPSILON);
            expect(pos[1]).to.be.closeTo(0, EPSILON);
            expect(pos[2]).to.be.closeTo(1, EPSILON);
        });

        it("increases camera distance proportionally to bufferDistance", () => {
            // bufferDistance=1: opposite=(1+1)/2=1, adjacent=1/tan(45°)=1, depth=1
            // distance = 0.5 + 1 = 1.5
            currentBB = makeBB([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
            CameraFocus.focus([], 90, 1);

            const { pos } = lookAtCalls[0];
            expect(pos[2]).to.be.closeTo(1.5, EPSILON);
        });

        it("computes center point correctly for an offset bounding box", () => {
            currentBB = makeBB([0, 0, 0], [4, 4, 4]);
            CameraFocus.focus([], 90);

            const { center } = lookAtCalls[0];
            expect(center).to.deep.equal([2, 2, 2]);
        });

        it("places camera along +X at horizontalAngle=90", () => {
            // dx=1, dy=0, dz≈0; perpX=zLen=1, perpY=yLen=1 → uses vertical FoV
            // depth=xLen=1, distance=1, camera = center + [1,0,0]*1
            currentBB = makeBB([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
            CameraFocus.focus([], 90, 0, 90);

            const { pos } = lookAtCalls[0];
            expect(pos[0]).to.be.closeTo(1, EPSILON);
            expect(pos[1]).to.be.closeTo(0, EPSILON);
            expect(pos[2]).to.be.closeTo(0, EPSILON);
        });

        it("places camera along -X at horizontalAngle=-90", () => {
            currentBB = makeBB([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
            CameraFocus.focus([], 90, 0, -90);

            const { pos } = lookAtCalls[0];
            expect(pos[0]).to.be.closeTo(-1, EPSILON);
            expect(pos[1]).to.be.closeTo(0, EPSILON);
            expect(pos[2]).to.be.closeTo(0, EPSILON);
        });

        it("handles non-zero verticalAngle (45°)", () => {
            // dy=1/√2, dz=1/√2; perpY=1 > perpX=1/√2 → uses vertical FoV=90
            // depth=√2, opposite=0.5, adjacent=0.5, distance=√2/2+0.5
            currentBB = makeBB([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
            CameraFocus.focus([], 90, 0, 0, 45);

            const s = 1 / Math.sqrt(2);
            const expectedDistance = Math.sqrt(2) / 2 + 0.5;
            const { pos } = lookAtCalls[0];
            expect(pos[0]).to.be.closeTo(0, EPSILON);
            expect(pos[1]).to.be.closeTo(s * expectedDistance, EPSILON);
            expect(pos[2]).to.be.closeTo(s * expectedDistance, EPSILON);
        });

        it("uses vertical FoV when perpY is the larger perpendicular extent", () => {
            // Tall box: perpX=xLen=1, perpY=yLen=10 → uses vertical FoV=90
            // opposite=5, adjacent=5/tan(45°)=5, depth=zLen=1 → distance=5.5
            currentBB = makeBB([-0.5, -5, -0.5], [0.5, 5, 0.5]);
            CameraFocus.focus([], 90);

            const { pos } = lookAtCalls[0];
            expect(pos[2]).to.be.closeTo(5.5, EPSILON);
        });

        it("uses horizontal FoV when perpX is the larger perpendicular extent", () => {
            // Wide box (xLen=10, yLen=1, zLen=1), 2:1 resolution, FoV=90
            // perpX=10 > perpY=1 → uses horizontal FoV
            // calcHorizontalFoV(90): tan(hFoV/2) = tan(45°)*(2/1) = 2 → tan(atan(2)) = 2
            // opposite=5, adjacent=5/2=2.5, depth=1 → distance=0.5+2.5=3
            installFakeCore({ width: 2, height: 1 });
            currentBB = makeBB([-5, -0.5, -0.5], [5, 0.5, 0.5]);
            CameraFocus.focus([], 90);

            const { pos } = lookAtCalls[0];
            expect(pos[2]).to.be.closeTo(3, EPSILON);
        });

        it("passes sceneObjects directly to core.scene.getBoundingBox", () => {
            let receivedObjects;
            globalThis.core.scene.getBoundingBox = (objs) => {
                receivedObjects = objs;
                return makeBB([0, 0, 0], [1, 1, 1]);
            };
            const fakeObjects = [{ id: "A" }, { id: "B" }];
            CameraFocus.focus(fakeObjects, 90);

            expect(receivedObjects).to.equal(fakeObjects);
        });

        it("calls lookAt exactly once per focus() invocation", () => {
            currentBB = makeBB([0, 0, 0], [1, 1, 1]);
            CameraFocus.focus([], 90);
            expect(lookAtCalls).to.have.length(1);
        });

        it("produces correct camera position for a non-centered box with horizontal angle", () => {
            // Box at [10,20,30] with unit size, FoV=90, horizontalAngle=90
            // center=[10.5,20.5,30.5], dx=1,dy=0,dz≈0
            // depth=xLen=1, perpX=zLen=1, perpY=yLen=1 → distance=1
            // camera = [10.5+1, 20.5, 30.5+≈0]
            currentBB = makeBB([10, 20, 30], [11, 21, 31]);
            CameraFocus.focus([], 90, 0, 90);

            const { center, pos } = lookAtCalls[0];
            expect(center).to.deep.equal([10.5, 20.5, 30.5]);
            expect(pos[0]).to.be.closeTo(11.5, EPSILON);
            expect(pos[1]).to.be.closeTo(20.5, EPSILON);
            expect(pos[2]).to.be.closeTo(30.5, EPSILON);
        });
    });
});
