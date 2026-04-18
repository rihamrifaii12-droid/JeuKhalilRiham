export const FINISH_LINE_Z = 5000;
export const TRACK_LENGTH = FINISH_LINE_Z + 500;
export const TRACK_WIDTH = 60;

export const COUNTDOWN_START = 3;

export const CAR_DIMENSIONS = {
    width: 3,
    height: 1.5,
    depth: 4.5,
    scaling: 0.55,
    modelOffsetY: -0.75,
    halfWidth: 1.5,
    groundOffset: 0.75
};

export const BOT_DATA = [
    { x: -10, z: 24, maxSpeed: 2.3, color: new BABYLON.Color3(1, 0.5, 0) }, // Orange (Poss 1)
    { x:  10, z: 12, maxSpeed: 2.45, color: new BABYLON.Color3(1, 0, 1) },  // Violet (Poss 2)
    { x: -10, z: 0, maxSpeed: 2.15, color: new BABYLON.Color3(0, 1, 0) }    // Vert (Poss 3)
];
