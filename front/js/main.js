import { canvas, engine, scene, camera, light } from './scene_setup.js';
import { getTrackX, getTrackY } from './utils.js';
import { FINISH_LINE_Z } from './config.js';
import { CoteAzur } from './Circuit.js';
import { initBoosters, initRamps, initTrackScreens } from './objects.js';
import { initDriftParticles } from './particles.js';
import { initBots } from './bots.js';
import { initPlayer, setupInputs } from './player.js';
import { initMinimap, updateMinimap, updateHUD, showGameOver, startCountdown, takePhoto } from './ui.js';
import { AudioManager } from './audio.js';

// ========== VARIABLES DU JEU ==========
let gameActive = true;
let isRacing = false;
let photoCooldown = 0;

// Initialisation
const circuit = new CoteAzur(scene);
circuit.initTrack();
circuit.initBuildings();
circuit.initBarriers();
circuit.initStreetLights();
circuit.initRoadMarkings();
circuit.initSun();
const finishLine = circuit.initFinishLine();
const boosterCubes = initBoosters();
const ramps = initRamps();
const trackScreens = initTrackScreens();
const bots = initBots();

const playerCar = initPlayer(scene, camera);
const driftParticles = initDriftParticles(playerCar.mesh);
const { keys, inputState } = setupInputs();
const { ctxMap } = initMinimap();

const photoButton = document.getElementById('photoButton');
if (photoButton) photoButton.addEventListener('click', () => takePhoto(engine, camera));

// Moteur Audio
const audio = new AudioManager(scene);
const startAudio = () => { 
    audio.init(); 
    window.removeEventListener('keydown', startAudio); 
    window.removeEventListener('click', startAudio);
};
window.addEventListener('keydown', startAudio);
window.addEventListener('click', startAudio);

startCountdown(() => { isRacing = true; });

// Ul pour Takedown
const takedownUI = document.createElement("div");
takedownUI.style = "position:absolute; top:30%; left:50%; transform:translate(-50%,-50%) scale(0); color:#ff00ff; font-family:'Impact', sans-serif; font-size:100px; text-shadow:0 0 20px #ff00ff, 0 0 50px #fff; transition:transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity:0; pointer-events:none; z-index:1000;";
takedownUI.innerText = "TAKEDOWN !";
document.body.appendChild(takedownUI);

function triggerTakedownMsg() {
    takedownUI.style.opacity = "1";
    takedownUI.style.transform = "translate(-50%, -50%) scale(1)";
    setTimeout(() => {
        takedownUI.style.opacity = "0";
        takedownUI.style.transform = "translate(-50%, -50%) scale(1.5)";
    }, 1500);
}

// ========== BOUCLE DE RENDU ==========
engine.runRenderLoop(() => {
    if (!gameActive) {
        driftParticles.emitRate = 0;
        scene.render();
        return;
    }

    // Mise à jour de la voiture
    playerCar.update(keys, inputState, isRacing, ramps, boosterCubes, () => {
        if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
    });
    
    // Particules de Drift
    driftParticles.emitRate = playerCar.isDrifting ? 80 : 0;

    // --- BOOSTERS (COLLECTE) ---
    for (let i = boosterCubes.length - 1; i >= 0; i--) {
        const bottle = boosterCubes[i];
        bottle.rotation.y += 0.04;
        const offset = bottle.userData ? bottle.userData.offset : 0;
        bottle.position.y += Math.sin(Date.now() / 200 + offset) * 0.01;

        if (BABYLON.Vector3.Distance(playerCar.mesh.position, bottle.position) < 4.0) {
            const reward = bottle.nitroType === "blue" ? 60 : 25;
            playerCar.boostEnergy = Math.min(playerCar.boostEnergy + reward, 100);
            bottle.dispose();
            boosterCubes.splice(i, 1);
        }
    }

    // --- COLLISIONS MURS ---
    const trackCenterX = getTrackX(playerCar.mesh.position.z);
    const roadLeft = trackCenterX - 30;
    const roadRight = trackCenterX + 30;
    const sidewalkLeft = trackCenterX - 40;
    const sidewalkRight = trackCenterX + 40;

    // On ne gère les collisions murs que si on est proche du sol
    const groundY = getTrackY(playerCar.mesh.position.z);
    if (playerCar.mesh.position.y < groundY + 2.5) {
        if (playerCar.mesh.position.x < roadLeft && playerCar.mesh.position.x >= sidewalkLeft) {
            playerCar.mesh.position.x = roadLeft;
            playerCar.velocity = Math.max(playerCar.velocity * 0.95, 0);
        } else if (playerCar.mesh.position.x < sidewalkLeft) {
            playerCar.mesh.position.x = sidewalkLeft;
            playerCar.angle = Math.PI - playerCar.angle; // Rebond
            playerCar.velocity = Math.max(playerCar.velocity * 0.6, 0);
            if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
        }

        if (playerCar.mesh.position.x > roadRight && playerCar.mesh.position.x <= sidewalkRight) {
            playerCar.mesh.position.x = roadRight;
            playerCar.velocity = Math.max(playerCar.velocity * 0.95, 0);
        } else if (playerCar.mesh.position.x > sidewalkRight) {
            playerCar.mesh.position.x = sidewalkRight;
            playerCar.angle = Math.PI - playerCar.angle;
            playerCar.velocity = Math.max(playerCar.velocity * 0.6, 0);
            if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
        }
    }

    if (photoCooldown > 0) photoCooldown--;

    // --- BOTS (IA AMÉLIORÉE) ---
    bots.forEach((bot, idx) => {
        if (bot.isDestroyed) return; // Ne bouge plus s'il est détruit

        if (isRacing && bot.mesh.position.z < FINISH_LINE_Z + 200) {

            // 1. SYSTÈME DE BOOST ALÉATOIRE
            if (bot.boostTimer > 0) {
                bot.boostTimer--;
            } else if (bot.boostCooldown > 0) {
                bot.boostCooldown--;
            } else {
                // Déclenche un boost de 2 à 4 secondes
                bot.boostTimer = 120 + Math.floor(Math.random() * 120);
                // Prochain boost dans 5 à 10 secondes
                bot.boostCooldown = 300 + Math.floor(Math.random() * 300);
            }

            const isBoosting = bot.boostTimer > 0;
            let botMaxKmh = bot.maxSpeed * 100 * (isBoosting ? 1.4 : 1.0);
            let botAccel   = isBoosting ? 4 : 2;
            bot.currentSpeed = Math.min(bot.currentSpeed + botAccel, botMaxKmh);
            let botMoveStep = (bot.currentSpeed / 3.6) / 60;
            bot.mesh.position.z += botMoveStep;

            // 2. TRAJECTOIRE IMPARFAITE (oscillation pour ressembler à un humain)
            bot.wobble += 0.018;
            const wobbleOffset = Math.sin(bot.wobble) * 3;

            const offset = bot.laneOffset + wobbleOffset;
            const targetX = getTrackX(bot.mesh.position.z) + offset;
            const targetY = getTrackY(bot.mesh.position.z) + 0.75;
            bot.mesh.position.x += (targetX - bot.mesh.position.x) * 0.15;
            bot.mesh.position.y = targetY;

            const nextZ = bot.mesh.position.z + 10;
            bot.mesh.rotation.y = Math.atan2(getTrackX(nextZ) + offset - bot.mesh.position.x, 10);
            bot.mesh.rotation.x = -Math.atan((getTrackY(nextZ) - getTrackY(bot.mesh.position.z)) / 10);

            // Mise à jour visuels (Ombre)
            if (bot.shadow) {
                bot.shadow.position.x = bot.mesh.position.x;
                bot.shadow.position.z = bot.mesh.position.z;
                bot.shadow.position.y = targetY - 0.65; // Ajusté pour le sol
                bot.shadow.rotation.y = bot.mesh.rotation.y;
            }
        }
    });

    // 3. COLLISIONS JOUEUR <-> BOTS (Aspiration + Takedown)
    playerCar.isDrafting = false;
    bots.forEach(bot => {
        if (bot.isDestroyed) return;

        const dx = playerCar.mesh.position.x - bot.mesh.position.x;
        const dz = playerCar.mesh.position.z - bot.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // ASPIRATION (Drafting) : On est juste derrière le bot
        if (dz < -5 && dz > -40 && Math.abs(dx) < 3.5) {
            playerCar.isDrafting = true;
            if (playerCar.boostEnergy < 100) playerCar.boostEnergy += 0.2; // Remplissage gratuit
        }

        // COLLISION
        if (dist < 5.5 && dist > 0.01) {
            if (playerCar.boostActive || playerCar.shockwaveActive) {
                // TAKEDOWN !
                bot.isDestroyed = true;
                bot.mesh.getChildMeshes().forEach(m => m.dispose()); // Fait disparaître le modèle
                if (bot.shadow) bot.shadow.dispose();
                playerCar.boostEnergy = 100; // Refill complet
                triggerTakedownMsg();
                audio.playTakedownSound();
            } else {
                // Choc normal
                const push = (5.5 - dist) / 5.5;
                playerCar.mesh.position.x += (dx / dist) * push * 2.5;
                playerCar.velocity = Math.max(playerCar.velocity * (1 - push * 0.3), 0);
                audio.playCrashSound(0.2);
            }
        }
    });

    // Mise à jour de l'audio procédural
    audio.updateEngine(playerCar.velocity, playerCar.boostActive, playerCar.shockwaveActive);

    // --- CAMÉRA & LUMIERE ---
    light.position.x = playerCar.mesh.position.x;
    light.position.y = playerCar.mesh.position.y + 20;
    light.position.z = playerCar.mesh.position.z;

    // --- UI & HUD ---
    updateMinimap(ctxMap, playerCar.mesh, bots);

    let currentPlace = 1;
    bots.forEach(b => { if (b.mesh.position.z > playerCar.mesh.position.z) currentPlace++; });

    updateHUD(
        Math.floor(Math.abs(playerCar.velocity)),
        Math.max(0, Math.floor(playerCar.mesh.position.z)),
        currentPlace,
        bots.length,
        playerCar.boostEnergy,
        playerCar.boostActive,
        playerCar.isDrifting,
        inputState.isDriftMode
    );

    // --- FINISH ---
    if (playerCar.mesh.position.z >= FINISH_LINE_Z) {
        endGame(true, currentPlace);
    }

    // --- ANIMATION EAU (scroll de texture) ---
    const eauTex = circuit.materials.eauMat.diffuseTexture;
    if (eauTex) {
        eauTex.uOffset += 0.00018;
        eauTex.vOffset += 0.00012;
    }

    scene.render();
});

function endGame(finished, place = 1) {
    gameActive = false;
    showGameOver(finished, place, playerCar.mesh.position.z);
}

window.addEventListener("resize", () => { engine.resize(); });


