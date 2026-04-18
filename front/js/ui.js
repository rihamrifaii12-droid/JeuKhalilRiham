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

    let driftText = "";
    if (isDrifting) driftText = " <span style='font-size:14px; color:#ffaa00;'>DRIFTING</span>";
    else if (isDriftMode) driftText = " <span style='font-size:14px; color:#ff5500;'>DRIFT MODE</span>";

    const speedEl = document.getElementById("speedometer");
    speedEl.innerHTML = `${speed}<span>KM/H</span>${driftText}`;

    if (boostActive) {
        document.getElementById("boostLabel").textContent = "BOOSTING 🔥";
        document.getElementById("boostLabel").classList.add("boostTextActive");
        speedEl.style.color = "#ff006e";
        speedEl.style.textShadow = "0 0 25px rgba(255, 0, 110, 0.8)";
    } else {
        let statusText = boostEnergy >= 100 ? "READY TO BOOST (SPACE)" : "NITRO RECHARGING";
        document.getElementById("boostLabel").textContent = statusText;
        document.getElementById("boostLabel").classList.remove("boostTextActive");
        speedEl.style.color = isDrifting ? "#ffaa00" : "#00ffff";
        speedEl.style.textShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
    }

    if (distance > FINISH_LINE_Z - 500 && distance < FINISH_LINE_Z) {
        document.getElementById("finishWarning").style.display = "block";
    } else {
        document.getElementById("finishWarning").style.display = "none";
    }
}

export function showGameOver(finished, place, distance) {
    document.getElementById("gameOver").style.display = "block";
    const gameResultEl = document.getElementById("gameResult");
    const gameOverEl = document.getElementById("gameOver");
    const finalInfoEl = document.getElementById("finalInfo");

    if (finished) {
        if (place === 1) {
            gameResultEl.textContent = "YOU WIN! 🥇";
            gameResultEl.style.color = "#ffff00";
            gameOverEl.style.borderColor = "#ffff00";
        } else {
            gameResultEl.textContent = `FINISHED ${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} 🥈`;
            gameResultEl.style.color = "#ffaa00";
            gameOverEl.style.borderColor = "#ffaa00";
        }
        finalInfoEl.textContent = `VITESSE ET STYLE AU TOP !`;
    } else {
        // En mode sans timer, ceci ne devrait plus arriver via le temps
        gameResultEl.textContent = "GAME OVER!";
        gameResultEl.style.color = "#ff0000";
        gameOverEl.style.borderColor = "#ff0000";
        finalInfoEl.textContent = `DISTANCE PARCOURUE : ${Math.floor(distance)}M`;
    }
}

export function startCountdown(onComplete) {
    let countdownValue = 3;
    const countdownEl = document.getElementById("countdownDisplay");
    let countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            countdownEl.textContent = countdownValue;
            countdownEl.style.transform = "translate(-50%, -50%) scale(1.8)";
            countdownEl.style.opacity = "1";
            setTimeout(() => {
                countdownEl.style.transform = "translate(-50%, -50%) scale(1)";
            }, 200);
        } else if (countdownValue === 0) {
            countdownEl.textContent = "GO!";
            countdownEl.style.color = "#00ff88";
            countdownEl.style.textShadow = "0 0 60px #00ff88, 0 0 20px #ffffff";
            countdownEl.style.transform = "translate(-50%, -50%) scale(2)";
            onComplete();
        } else {
            countdownEl.style.opacity = "0";
            countdownEl.style.transform = "translate(-50%, -50%) scale(5)";
            clearInterval(countdownInterval);
        }
    }, 1000);
}

export function takePhoto(engine, camera) {
    BABYLON.Tools.CreateScreenshotAsync(engine, camera, { width: 1920, height: 1080 }).then((screenshot) => {
        const apiUrl = window.location.port === '5500' ? 'http://localhost:3000/api/save-photo' : '/api/save-photo';

        // Send to server
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: screenshot }),
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Photo saved:', data);
            })

            .catch(error => {
                console.error('Error saving photo:', error);
                if (window.location.port === '5500') {
                    console.warn("ASTUCE : Live Server (5500) ne peut pas enregistrer de fichiers. Utilisez http://localhost:3000 pour que l'API fonctionne.");
                }
            });
    });
}
