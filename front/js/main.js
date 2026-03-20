import { canvas, engine, scene, camera, light } from './scene_setup.js';
import { getTrackX, getTrackY } from './utils.js';
import { FINISH_LINE_Z, TIME_LIMIT } from './config.js';
import { initTrack, initBuildings, initFinishLine } from './track.js';
import { initBoosters, initRamps } from './objects.js';
import { initDriftParticles } from './particles.js';
import { initBots } from './bots.js';
import { initPlayer, setupInputs } from './player.js';
import { initMinimap, updateMinimap, updateHUD, showGameOver, startCountdown } from './ui.js';

// ========== VARIABLES DU JEU ==========
let gameActive = true;
let isRacing = false;
let timeLeft = TIME_LIMIT;
let carVelocity = 0;
let carVelocityY = 0;
let carAngle = 0;
let boostEnergy = 0;
let boostActive = false;

const gravity = 0.04;

// Initialisation
initTrack();
initBuildings();
const finishLine = initFinishLine();
const boosterCubes = initBoosters();
const ramps = initRamps();
const bots = initBots();
const car = initPlayer();
const driftParticles = initDriftParticles(car);
const { keys, inputState } = setupInputs();
const { ctxMap } = initMinimap();

// Démarrage du compte à rebours
startCountdown(() => {
    isRacing = true;
});

// ========== BOUCLE DE RENDU ==========
engine.runRenderLoop(() => {
    if (!gameActive) {
        driftParticles.emitRate = 0;
        scene.render();
        return;
    }

    let visualAngle = carAngle;
    let isDrifting = false;

    if (!isRacing) {
        carVelocity = 0;
        boostActive = false;
        driftParticles.emitRate = 0;
    } else {
        // Boost
        if (keys[' '] && boostEnergy > 0) {
            boostActive = true;
            boostEnergy = Math.max(boostEnergy - 0.6, 0);
        } else {
            boostActive = false;
        }

        // Physique
        let targetMaxKmh = boostActive ? 420 : 250;
        let accelKmh = boostActive ? 8 : 1.5;
        if (boostActive && boostEnergy > 80) targetMaxKmh = 2500;

        if (keys['ArrowUp']) {
            carVelocity = Math.min(carVelocity + accelKmh, targetMaxKmh);
        } else if (keys['ArrowDown']) {
            carVelocity = Math.max(carVelocity - 5, -50);
        } else {
            if (carVelocity > 0) carVelocity = Math.max(carVelocity - 1.2, 0);
            else if (carVelocity < 0) carVelocity = Math.min(carVelocity + 2, 0);
        }

        // Drift
        if (inputState.isDriftMode && carVelocity > 80 && (keys['ArrowLeft'] || keys['ArrowRight'])) {
            isDrifting = true;
        }

        let turnSpeed = boostActive ? 0.03 : 0.06;
        if (isDrifting) turnSpeed = 0.065;

        if (keys['ArrowLeft']) {
            carAngle -= turnSpeed;
            if (isDrifting) visualAngle = carAngle - 0.25;
        } else if (keys['ArrowRight']) {
            carAngle += turnSpeed;
            if (isDrifting) visualAngle = carAngle + 0.25;
        }

        if (isDrifting && !boostActive) {
            carVelocity = Math.max(carVelocity - 2, 120);
            boostEnergy = Math.min(boostEnergy + 0.2, 100);
            driftParticles.emitRate = 80;
        } else {
            driftParticles.emitRate = 0;
        }
    }

    // Déplacement
    let moveStep = ((carVelocity / 3.6) / 60) * 1.2;
    car.position.x += Math.sin(carAngle) * moveStep;
    car.position.z += Math.cos(carAngle) * moveStep;
    car.rotation.y = visualAngle;

    // Caméra
    camera.fov = 0.8 + (carVelocity / 4000);
    camera.radius = 12 + (carVelocity / 150);
    if (carVelocity > 1000) {
        camera.position.x += (Math.random() - 0.5) * 0.15;
        camera.position.y += (Math.random() - 0.5) * 0.15;
    }

    // Gravité
    carVelocityY -= gravity;
    car.position.y += carVelocityY;
    const currentGroundHeight = getTrackY(car.position.z);
    const carStandY = currentGroundHeight + 0.75;

    if (car.position.y <= carStandY) {
        car.position.y = carStandY;
        carVelocityY = 0;
        const slope = (getTrackY(car.position.z + 5) - getTrackY(car.position.z)) / 5;
        car.rotation.x = -Math.atan(slope);
    }

    // Rampes
    if (car.position.y <= carStandY + 0.5 && carVelocity > 50) {
        for (let i = 0; i < ramps.length; i++) {
            const r = ramps[i];
            if (Math.abs(car.position.x - r.position.x) < 7 && Math.abs(car.position.z - r.position.z) < 4) {
                carVelocityY = Math.max(0.7, (carVelocity / 350));
                car.position.y += 0.5;
                car.rotation.x = -0.3;
                break;
            }
        }
    }

    // Boosters
    for (let i = boosterCubes.length - 1; i >= 0; i--) {
        const cube = boosterCubes[i];
        cube.rotation.y += 0.05;
        cube.rotation.x += 0.02;
        if (BABYLON.Vector3.Distance(car.position, cube.position) < 3.0) {
            cube.dispose();
            boosterCubes.splice(i, 1);
            boostEnergy = Math.min(boostEnergy + 34, 100);
        }
    }

    // Collisions murs
    let trackCenterX = getTrackX(car.position.z);
    if (car.position.x < trackCenterX - 34) {
        car.position.x = trackCenterX - 34;
        carVelocity = Math.max(0, carVelocity - 0.2);
    }
    if (car.position.x > trackCenterX + 34) {
        car.position.x = trackCenterX + 34;
        carVelocity = Math.max(0, carVelocity - 0.2);
    }

    if (car.position.z < -20) {
        car.position.z = -20;
        carVelocity = 0;
    }

    // Bots
    bots.forEach((bot, idx) => {
        if (isRacing && bot.mesh.position.z < FINISH_LINE_Z + 200) {
            let botMaxKmh = bot.maxSpeed * 100;
            bot.currentSpeed = Math.min(bot.currentSpeed + 2, botMaxKmh);
            let botMoveStep = (bot.currentSpeed / 3.6) / 60;
            bot.mesh.position.z += botMoveStep;

            const offset = (idx - 1) * 10;
            const targetX = getTrackX(bot.mesh.position.z) + offset;
            const targetY = getTrackY(bot.mesh.position.z) + 0.75;
            bot.mesh.position.x += (targetX - bot.mesh.position.x) * 0.2;
            bot.mesh.position.y = targetY;

            const nextZ = bot.mesh.position.z + 10;
            bot.mesh.rotation.y = Math.atan2(getTrackX(nextZ) + offset - bot.mesh.position.x, 10);
            bot.mesh.rotation.x = -Math.atan((getTrackY(nextZ) - getTrackY(bot.mesh.position.z)) / 10);
        }
    });

    // Lumière
    light.position.x = car.position.x;
    light.position.z = car.position.z;

    // UI Updates
    updateMinimap(ctxMap, car, bots);
    
    let currentPlace = 1;
    bots.forEach(b => { if (b.mesh.position.z > car.position.z) currentPlace++; });
    
    updateHUD(
        Math.floor(Math.abs(carVelocity)), 
        Math.max(0, Math.floor(car.position.z)), 
        currentPlace, 
        bots.length, 
        boostEnergy, 
        boostActive, 
        isDrifting, 
        inputState.isDriftMode
    );

    if (car.position.z >= FINISH_LINE_Z) {
        endGame(true, currentPlace);
    }

    scene.render();
});

// ========== MINUTEUR ==========
const timerInterval = setInterval(() => {
    if (gameActive && isRacing) {
        timeLeft--;
        document.getElementById("timer").textContent = `TIME: ${timeLeft}`;
        if (timeLeft <= 0) endGame();
    }
}, 1000);

function endGame(finished, place = 1) {
    gameActive = false;
    clearInterval(timerInterval);
    showGameOver(finished, place, timeLeft, car.position.z);
}

window.addEventListener("resize", () => {
    engine.resize();
});
