import { scene } from './scene_setup.js';

export function initDriftParticles(car) {
    const driftParticles = new BABYLON.ParticleSystem("drift", 500, scene);
    const smokeTex = new BABYLON.DynamicTexture("smokeTex", 64, scene);
    const ctx = smokeTex.getContext();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    smokeTex.update();
    driftParticles.particleTexture = smokeTex;

    const emitter = new BABYLON.TransformNode("emitter", scene);
    emitter.parent = car;
    emitter.position = new BABYLON.Vector3(0, -0.7, -2); // A ras du sol sous l'arrière de la voiture
    driftParticles.emitter = emitter;

    driftParticles.minEmitBox = new BABYLON.Vector3(-1.5, 0, 0);
    driftParticles.maxEmitBox = new BABYLON.Vector3(1.5, 0, 0);
    driftParticles.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.5); // Fumée de pneu grise
    driftParticles.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0.0);
    driftParticles.minLifeTime = 0.2;
    driftParticles.maxLifeTime = 0.4;
    driftParticles.emitRate = 0; // Éteint par défaut
    driftParticles.minEmitPower = 5;
    driftParticles.maxEmitPower = 10;
    driftParticles.updateSpeed = 0.02;
    driftParticles.start();

    return driftParticles;
}
