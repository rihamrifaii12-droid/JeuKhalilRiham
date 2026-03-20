import { FINISH_LINE_Z } from './config.js';
import { getTrackX } from './utils.js';

export function initMinimap() {
    const minimap = document.getElementById("minimap");
    const ctxMap = minimap.getContext("2d");
    return { minimap, ctxMap };
}

export function updateMinimap(ctxMap, car, bots) {
    ctxMap.clearRect(0, 0, 150, 300);

    // Tracé de la piste globale au crayon blanc
    ctxMap.beginPath();
    ctxMap.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctxMap.lineWidth = 3;
    for (let mz = 0; mz <= FINISH_LINE_Z; mz += 100) {
        let mx = getTrackX(mz);
        let pxlX = ((mx + 250) / 500) * 150;
        let pxlY = 300 - (mz / FINISH_LINE_Z) * 300;
        if (mz === 0) ctxMap.moveTo(Math.floor(pxlX), Math.floor(pxlY));
        else ctxMap.lineTo(Math.floor(pxlX), Math.floor(pxlY));
    }
    ctxMap.stroke();

    // Bots
    bots.forEach(bot => {
        let bx = ((bot.mesh.position.x + 250) / 500) * 150;
        let by = 300 - (bot.mesh.position.z / FINISH_LINE_Z) * 300;
        ctxMap.fillStyle = bot.colorBase ? bot.colorBase.toHexString() : "#ffffff";
        ctxMap.beginPath();
        ctxMap.arc(Math.floor(bx), Math.floor(by), 4, 0, Math.PI * 2);
        ctxMap.fill();
    });

    // Joueur
    let plrX = ((car.position.x + 250) / 500) * 150;
    let plrY = 300 - (car.position.z / FINISH_LINE_Z) * 300;
    ctxMap.fillStyle = "#00ffff"; 
    ctxMap.beginPath();
    ctxMap.arc(Math.floor(plrX), Math.floor(plrY), 6, 0, Math.PI * 2);
    ctxMap.fill();
    ctxMap.strokeStyle = "#ffffff";
    ctxMap.lineWidth = 2;
    ctxMap.stroke();
}

export function updateHUD(speed, distance, currentPlace, botsCount, boostEnergy, boostActive, isDrifting, isDriftMode) {
    document.getElementById("distance").textContent = `POS: ${currentPlace}/${botsCount + 1} | DIST: ${distance}M / ${FINISH_LINE_Z}M`;
    
    // UI Boost
    document.getElementById("boostBar").style.width = `${boostEnergy}%`;

    if (boostActive) {
        document.getElementById("boostLabel").textContent = "BOOSTING 🔥";
        document.getElementById("boostLabel").classList.add("boostTextActive");
        document.getElementById("speedometer").textContent = `SPEED: ${speed} KM/H`;
        document.getElementById("speedometer").style.color = "#ff006e";
        document.getElementById("speedometer").style.textShadow = "0 0 20px #ff006e";
    } else {
        let statusText = boostEnergy >= 100 ? "BOOST FULL (Appuie sur ESPACE)" : "BOOST (Maintiens ESPACE)";
        document.getElementById("boostLabel").textContent = statusText;
        document.getElementById("boostLabel").classList.remove("boostTextActive");

        let driftText = "";
        if (isDrifting) driftText = " (DRIFTING 💨)";
        else if (isDriftMode) driftText = " [DRIFT MODE ON]";

        document.getElementById("speedometer").textContent = `SPEED: ${speed} KM/H${driftText}`;
        document.getElementById("speedometer").style.color = isDrifting ? "#ffaa00" : (isDriftMode ? "#ff5500" : "#00ffff");
    }

    if (distance > FINISH_LINE_Z - 500 && distance < FINISH_LINE_Z) {
        document.getElementById("finishWarning").style.display = "block";
    } else {
        document.getElementById("finishWarning").style.display = "none";
    }
}

export function showGameOver(finished, place, timeLeft, distance) {
    document.getElementById("gameOver").style.display = "block";
    const gameResultEl = document.getElementById("gameResult");
    const gameOverEl = document.getElementById("gameOver");
    const finalInfoEl = document.getElementById("finalInfo");

    if (finished) {
        const timeTaken = 60 - timeLeft;
        if (place === 1) {
            gameResultEl.textContent = "YOU WIN! 🥇";
            gameResultEl.style.color = "#ffff00";
            gameOverEl.style.borderColor = "#ffff00";
        } else {
            gameResultEl.textContent = `FINISHED ${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} 🥈`;
            gameResultEl.style.color = "#ffaa00";
            gameOverEl.style.borderColor = "#ffaa00";
        }
        finalInfoEl.textContent = `TIME: ${timeTaken}s`;
    } else {
        gameResultEl.textContent = "TIME'S UP! ⏰";
        gameResultEl.style.color = "#ff0000";
        gameOverEl.style.borderColor = "#ff0000";
        finalInfoEl.textContent = `DISTANCE REACHED: ${Math.floor(distance)}M`;
    }
}

export function startCountdown(onComplete) {
    let countdownValue = 3;
    const countdownEl = document.getElementById("countdownDisplay");
    let countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            countdownEl.textContent = countdownValue;
            countdownEl.style.transform = "translate(-50%, -50%) scale(1.3)";
            setTimeout(() => countdownEl.style.transform = "translate(-50%, -50%) scale(1)", 150);
        } else if (countdownValue === 0) {
            countdownEl.textContent = "GO!";
            countdownEl.style.color = "#00ff00";
            countdownEl.style.textShadow = "0 0 50px #00ff00, 0 0 10px #ffffff";
            countdownEl.style.transform = "translate(-50%, -50%) scale(1.5)";
            onComplete();
        } else {
            countdownEl.style.opacity = "0";
            clearInterval(countdownInterval);
        }
    }, 1000);
}
