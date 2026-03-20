export function getTrackX(z) {
    if (z < 100) return 0; // Départ droit
    let factor = (z - 100) / 200; // Transition douce
    if (factor > 1) factor = 1;
    return factor * (Math.sin(z / 400) * 150 + Math.sin(z / 200) * 80);
}

export function getTrackY(z) {
    if (z < 300) return 0; // Départ plat
    let factor = (z - 300) / 300;
    if (factor > 1) factor = 1;
    // Grandes pentes et vallées (oscillations sur l'axe Y)
    return factor * (Math.sin(z / 500) * 60 + Math.cos(z / 250) * 20);
}
