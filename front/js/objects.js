import { scene } from './scene_setup.js';
import { getTrackX, getTrackY } from './utils.js';

export function initBoosters() {
    const boosterCubes = [];
    const boosterMat = new BABYLON.StandardMaterial("boostMat", scene);
    boosterMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0); // Jaune/Or brillant
    boosterMat.diffuseColor = new BABYLON.Color3(1, 1, 0);

    for (let i = 0; i < 40; i++) {
        const cube = BABYLON.MeshBuilder.CreateBox("booster" + i, { size: 1.5 }, scene);
        const cz = 200 + Math.random() * 4600;
        cube.position.z = cz;
        cube.position.x = getTrackX(cz) - 25 + Math.random() * 50;
        cube.position.y = getTrackY(cz) + 1.5; 
        cube.material = boosterMat;
        boosterCubes.push(cube);
    }
    return boosterCubes;
}

export function initRamps() {
    const ramps = [];
    const rampMat = new BABYLON.StandardMaterial("rampMat", scene);
    rampMat.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
    rampMat.alpha = 0.8;

    for (let i = 0; i < 15; i++) {
        const ramp = BABYLON.MeshBuilder.CreateBox("ramp" + i, { width: 14, height: 0.5, depth: 8 }, scene);
        const rz = 300 + Math.random() * 4400;
        ramp.position.z = rz;
        ramp.position.x = getTrackX(rz) - 15 + Math.random() * 30;
        ramp.position.y = getTrackY(rz) + 0.5; 

        const slope = (getTrackY(rz + 5) - getTrackY(rz)) / 5;
        ramp.rotation.x = -0.25 - Math.atan(slope);

        ramp.material = rampMat;
        ramps.push(ramp);
    }
    return ramps;
}
