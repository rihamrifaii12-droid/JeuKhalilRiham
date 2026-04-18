export const canvas = document.getElementById("renderCanvas");
export const engine = new BABYLON.Engine(canvas, true);
export const scene = new BABYLON.Scene(engine);

// Ambiance de jour (Ciel très clair façon ciel d'été)
scene.clearColor = new BABYLON.Color4(0.5, 0.85, 1, 1); // Ciel bleu clair d'été
scene.fogEnabled = true;
scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
scene.fogStart = 700;
scene.fogEnd = 2200;
scene.fogColor = new BABYLON.Color3(0.52, 0.78, 0.92);

// ========== LUMIÈRE ==========
// Soleil directionnel pour bien éclairer la ville et l'eau
export const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -0.5), scene);
sun.intensity = 1.6;
sun.diffuse = new BABYLON.Color3(1, 0.92, 0.78); // Lumière chaude méditerranéenne

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

// EFFET GLOW (Pour le style Asphalt Legends)
export const glowLayer = new BABYLON.GlowLayer("glow", scene);
glowLayer.intensity = 0.8;
