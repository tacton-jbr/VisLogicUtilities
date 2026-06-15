/**
 * Class for automatically focusing the camera
 */
export default class CameraFocus {
    /**
     * Focuses the currently active camera to the specified objects with the specified paramaters to control perspective
     * @param {Object} options - Parameter object, supporting the following properties:
     * {core.SceneObject[]} sceneObjects - Mandatory. List of sceneObjects that you want to focus on. The rotation center of the camera will be at the center point of the combined axis-aligned bounding boxes of all of these.
     * {Number} cameraFoV - Mandatory. Vertical Field of View angle in degrees of the currently active camera. Required for accurate calculations.
     * {Number} bufferDistance - Optional. Distance in meters that is added to the edges of the resulting image frame. Gives users finer control over the zoom level of the result. Default: 0.
     * {Number} horizontalAngle - Optional. Horizontal angle in degrees counter-clockwise relative to looking down the Z axis. Default: 0.
     * {Number} verticalAngle - Optional. Vertical angle in degrees counter-clockwise relative to looking down the Z axis. Default: 0.
     * {Number[3]} offsetVector - Optional. Offset vector which is applied to the center point of the camera for finer user control. Default: [0, 0, 0].
     */
    static focus(options) {
        options = initOptions(options);
        let bb = core.scene.getBoundingBox(options.sceneObjects);
        let centerPoint = calcCenterPoint(bb);
        let offsetCenterPoint = centerPoint.slice();
        offsetCenterPoint[0] += options.offsetVector[0];
        offsetCenterPoint[1] += options.offsetVector[1];
        offsetCenterPoint[2] += options.offsetVector[2];
        let xLength = Math.abs(bb.max[0] - bb.min[0]);
        let yLength = Math.abs(bb.max[1] - bb.min[1]);
        let zLength = Math.abs(bb.max[2] - bb.min[2]);
        let maxDimension = Math.max(xLength, yLength, zLength);

        let hRad = options.horizontalAngle * Math.PI / 180.0;
        let vRad = options.verticalAngle * Math.PI / 180.0;

        // Unit direction vector from center towards where the camera will end up
        let dx = Math.sin(hRad) * Math.cos(vRad);
        let dy = Math.sin(vRad);
        let dz = Math.cos(hRad) * Math.cos(vRad);

        // Project bounding box extents onto the view direction to get depth and perpendicular sizes
        let depth = Math.abs(dx * xLength) + Math.abs(dy * yLength) + Math.abs(dz * zLength);

        // Horizontal perpendicular (right vector): rotate view direction 90 degrees around Y axis
        let rx = dz;
        let rz = -dx;

        // Vertical perpendicular (up vector): cross product of right and view direction
        let ux = -dx * dy;
        let uy = dx * dx + dz * dz; // equivalent to cos²(vRad)
        let uz = -dz * dy;

        // Project bounding box extents onto each perpendicular
        let perpX = Math.abs(rx * xLength) + Math.abs(rz * zLength); // right vector has no Y component
        let perpY = Math.abs(ux * xLength) + Math.abs(uy * yLength) + Math.abs(uz * zLength);
        let perpMax = Math.max(perpX, perpY);

        let opposite = (perpMax + options.bufferDistance) / 2;
        let relevantFoV = perpMax !== perpY ? calcHorizontalFoV(options.cameraFoV) : options.cameraFoV;
        let halfFoV = relevantFoV / 2;
        let adjacent = opposite / Math.tan(halfFoV * Math.PI / 180.0);

        let distance = (depth / 2) + adjacent;
        let cameraX = centerPoint[0] + dx * distance;
        let cameraY = centerPoint[1] + dy * distance;
        let cameraZ = centerPoint[2] + dz * distance;

        core.scene.camera.lookAt(offsetCenterPoint, [cameraX, cameraY, cameraZ]);
    }
}

/**
 * Checks the options object for minimum parameters and ensures all the options that are optional but not supplied are initialized to their default values
 * @param options {Object} - Options object
 * @returns {Object} - Initialized options object
 */
function initOptions(options) {
    checkMinimumOptions(options);
    const defaultOptions = {
        bufferDistance: 0,
        horizontalAngle: 0,
        verticalAngle: 0,
        offsetVector: [0, 0, 0],
    };
    if (!options)
        options = {};
    for (let property in defaultOptions) {
        if (!defaultOptions.hasOwnProperty(property)) {
            continue;
        }
        if (!options.hasOwnProperty(property)) {
            options[property] = defaultOptions[property];
        }
    }

    return options;
}

/**
 * Checks whether the minimum required properties are supplied by the user. Throws an error if they aren't.
 * @param options {Object} - Options object
 */
function checkMinimumOptions(options) {
    let requiredPropertiesAsArray = ["sceneObjects", "cameraFoV"];
    for (let propName of requiredPropertiesAsArray) {
        let value = options[propName];
        if (!value) {
            throw new TypeError("Required property \"" + propName + "\" is not defined!");
        }
    }
}

/**
 * Calculates the center point of the given bounding box in world space
 * @param {Object} boundingBox - Bounding box object as returned by core.scene.getBoundingBox()
 * @returns {Number[3]} - XYZ coordinates of center point
 */
function calcCenterPoint(boundingBox) {
    let centerX = (boundingBox.min[0] + boundingBox.max[0]) / 2;
    let centerY = (boundingBox.min[1] + boundingBox.max[1]) / 2;
    let centerZ = (boundingBox.min[2] + boundingBox.max[2]) / 2;
    return [centerX, centerY, centerZ];
}

/**
 * Calculates the horizontal field of view in degrees based off the vertical field of view in degrees in combination with the current viewport size.
 * @param {Number} cameraFoV - Vertical camera field of view in degrees
 * @returns {Number} - Horizontal camera field of view in degrees
 */
function calcHorizontalFoV(cameraFoV) {
    let fovRad = cameraFoV * Math.PI / 180.0;
    let result = 2 * Math.atan(Math.tan(fovRad / 2) * core.application.resolution.width / core.application.resolution.height);
    result *= 180 / Math.PI;
    return result;
}