# CameraFocus

A module for automatically focusing the camera on certain objects in the scene.

![focus](focus.png)

For a detailed documentation of the public functions, please see the JSDoc comments
in [src/camerafocus/CameraFocus.js](src/camerafocus/CameraFocus.js).

## Using CameraFocus in VisLogic

```javascript
//any file in vislogic
//import
import { CameraFocus } from "./VisLogicUtilities/src/camerafocus/CameraFocus.js";
//use
let myObj = core.scene.create(core.assets("some/asset"));
CameraFocus.focus([myObj], 70); //minimal parameters
CameraFocus.focus([myObj], 70, 3, 20, 10); //minimal parameters. 3 Meters buffer distance, 20° horizontal angle, 10° vertical angle
```

## Public Functions
These are the supported public functions you can use in your code.

### focus(sceneObjects, cameraFoV, bufferDistance, horizontalAngle, verticalAngle)
Focuses the camera on the specified scene objects. This will perform a core.scene.camera.lookAt() with the center point being the center of the combined bounding boxes of all specified scene objects. The camera position will be calculated based on the other parameters.

**Parameters**
| Name | Type | Description | Default |
| ---- | ---- | ---- | ---- |
| `sceneObjects` | `core.SceneObject[]` | List of sceneObjects that you want to focus on. The rotation center of the camera will be at the center point of the combined axis-aligned bounding boxes of all of these. | |
| `cameraFoV` | `Number` | Vertical Field of View angle in degrees of the currently active camera. Required for accurate calculations. | |
| `bufferDistance` | `Number` | Optional. Distance in meters that is added to the edges of the resulting frame. Gives users finer control over the zoom level of the result. | `0`|
| `horizontalAngle` | `Number` | Optional. Horizontal angle in degrees counter-clockwise relative to looking down the Z axis. | `0`|
| `verticalAngle` | `Number` | Optional. Vertical angle in degrees counter-clockwise relative to looking down the Z axis. | `0`|