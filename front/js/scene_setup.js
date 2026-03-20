export const canvas = document.getElementById("renderCanvas");
export const engine = new BABYLON.Engine(canvas, true);
export const scene = new BABYLON.Scene(engine);

// Ambiance de jour (Ciel très clair façon ciel d'été)
scene.clearColor = new BABYLON.Color4(0.5, 0.8, 0.95, 1); // Ciel bleu clair
scene.clearColor = new BABYLON.Color4(0.5, 0.85, 1, 1);
scene.fogEnabled = false;
scene.fogDensity = 0;
scene.fogColor = new BABYLON.Color3(0.5, 0.85, 1);

// ========== LUMIÈRE ==========
// Soleil directionnel pour bien éclairer la ville et l'eau
export const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -1), scene);
sun.intensity = 1.4;
sun.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

export const light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 20, 0), scene);
light.intensity = 0.4;
light.diffuse = new BABYLON.Color3(1, 1, 1);

export const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
ambientLight.intensity = 0.6;

// Caméra qui suit la voiture
export const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 15, -25), scene);
camera.radius = 20;
camera.heightOffset = 10;
camera.rotationOffset = 180;
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 20;
