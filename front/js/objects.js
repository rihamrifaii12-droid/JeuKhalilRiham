import { scene } from './scene_setup.js';
import { getTrackX, getTrackY } from './utils.js';

export function initBoosters() {
    const boosterFiles = [];

    // Matériau partagé pour la peau Nitro
    const nitroSkinPath = "texture/nitro_skin.png";

    const boosterPositions = [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800];

    for (let i = 0; i < boosterPositions.length; i++) {
        const isSuper = (i % 3 === 0);
        const bottleColor = isSuper ? "blue" : "yellow";
        
        // Création de la bouteille
        const bottle = BABYLON.MeshBuilder.CreateCylinder("nitro" + i, { diameter: 1.6, height: 2.8, tessellation: 12 }, scene);
        const neck = BABYLON.MeshBuilder.CreateCylinder("neck" + i, { diameter: 0.9, height: 0.8, tessellation: 8 }, scene);
        neck.parent = bottle;
        neck.position.y = 1.8;

        const bottleMat = new BABYLON.StandardMaterial("bottleMat" + i, scene);
        const tex = new BABYLON.Texture(nitroSkinPath, scene);
        bottleMat.diffuseTexture = tex;
        bottleMat.emissiveTexture = tex;
        // Tint pour le bleu si nécessaire
        if (isSuper) {
            bottleMat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
            bottleMat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
        } else {
            bottleMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            bottleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        }
        bottleMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        
        bottle.material = bottleMat;
        neck.material = bottleMat;

        const cz = boosterPositions[i];
        bottle.position.z = cz;
        bottle.position.x = getTrackX(cz) + (Math.random() - 0.5) * 15;
        bottle.position.y = getTrackY(cz) + 2.0;
        bottle.nitroType = bottleColor;
        bottle.userData = { offset: Math.random() * Math.PI * 2 };
        
        boosterFiles.push(bottle);
    }
    return boosterFiles;
}

export function initRamps() {
    const ramps = [];

    
    // Matériau Carbone Fumé / Verre sombre (Translucide)
    const carbonGlassMat = new BABYLON.StandardMaterial("carbonGlassMat", scene);
    carbonGlassMat.diffuseColor = new BABYLON.Color3(0.01, 0.01, 0.01);
    carbonGlassMat.specularColor = new BABYLON.Color3(1, 1, 1);
    carbonGlassMat.alpha = 0.8;
    carbonGlassMat.backFaceCulling = false;

    // Couleurs Néon
    const neonCyan = new BABYLON.Color3(0, 1, 1);
    const neonPurple = new BABYLON.Color3(1, 0, 1);

    const rampPositions = [600, 1400, 2200, 3000, 3800, 4600];

    for (let i = 0; i < rampPositions.length; i++) {
        const isBarrel = (i % 2 === 1); // Alternance: Saut droit / Tonneau
        const color = isBarrel ? neonPurple : neonCyan;
        
        const rz = rampPositions[i];
        const rx = getTrackX(rz);
        const ry = getTrackY(rz);

        // --- GÉNÉRATION DU RUBAN (RIBBON) ---
        const pathLen = 12;
        const width = 16;
        const paths = [];
        
        // On crée un ruban en définissant les points de chaque côté
        const leftPath = [];
        const rightPath = [];
        
        for (let j = 0; j <= pathLen; j++) {
            const z = (j / pathLen) * 10;
            const progress = j / pathLen;
            
            // Parabole pour la hauteur
            const h = Math.pow(progress, 2) * 4;
            
            // Torsion pour le Barrel Roll (Spiral)
            let twist = 0;
            if (isBarrel) {
                twist = progress * Math.PI / 4; // Rotation de 45 deg max
            }
            
            // Calcul des positions locales (V-Wing style)
            const ly = h + Math.sin(twist) * (width / 2);
            const lx = - (width / 2) * Math.cos(twist);
            
            const ry_pt = h - Math.sin(twist) * (width / 2);
            const rx_pt = (width / 2) * Math.cos(twist);

            leftPath.push(new BABYLON.Vector3(lx, ly, z));
            rightPath.push(new BABYLON.Vector3(rx_pt, ry_pt, z));
        }
        paths.push(leftPath);
        paths.push(rightPath);

        const ribbon = BABYLON.MeshBuilder.CreateRibbon("rampRibbon" + i, { pathArray: paths }, scene);
        ribbon.position = new BABYLON.Vector3(rx, ry, rz);
        ribbon.material = carbonGlassMat;
        ribbon.isBarrel = isBarrel;

        // Surface de flèches (Neon Grid)
        const scrollMat = new BABYLON.StandardMaterial("scrollMat" + i, scene);
        const tex = new BABYLON.Texture("texture/ramp_arrow.png", scene);
        tex.vScale = 4.0; // Plus de petites flèches
        scrollMat.diffuseTexture = tex;
        scrollMat.emissiveTexture = tex;
        scrollMat.emissiveColor = color;
        scrollMat.diffuseTexture.hasAlpha = true;
        scrollMat.useAlphaFromDiffuseTexture = true;
        ribbon.material = scrollMat; // Toute la surface est active
        ribbon.userData = { material: scrollMat };

        // --- LISERÉS NÉON (Tubes fins sur les bords) ---
        const tubeL = BABYLON.MeshBuilder.CreateTube("tubeL" + i, { path: leftPath, radius: 0.15, tessellation: 6 }, scene);
        tubeL.parent = ribbon;
        const tubeR = BABYLON.MeshBuilder.CreateTube("tubeR" + i, { path: rightPath, radius: 0.15, tessellation: 6 }, scene);
        tubeR.parent = ribbon;
        
        const neonTubeMat = new BABYLON.StandardMaterial("neonTubeMat" + i, scene);
        neonTubeMat.emissiveColor = color;
        neonTubeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        tubeL.material = neonTubeMat;
        tubeR.material = neonTubeMat;

        // Inclinaison ajustée à la route
        const slope = (getTrackY(rz + 5) - getTrackY(rz)) / 5;
        ribbon.rotation.x = -Math.atan(slope);

        ramps.push(ribbon);
    }
    return ramps;
}


export function initTrackScreens() {
    const screens = [];
    const screenPositions = [500, 1500, 2500, 3500, 4500];
    
    for (let i = 0; i < screenPositions.length; i++) {
        const z = screenPositions[i];
        const x = getTrackX(z) - 50;
        const y = getTrackY(z) + 15;

        const frame = BABYLON.MeshBuilder.CreateBox("screenFrame" + i, { width: 42, height: 26, depth: 2 }, scene);
        frame.position = new BABYLON.Vector3(x, y, z);
        frame.rotation.y = Math.PI / 4;
        
        const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        frame.material = frameMat;

        const support = BABYLON.MeshBuilder.CreateBox("screenSupport" + i, { width: 2, height: y, depth: 2 }, scene);
        support.position = new BABYLON.Vector3(x, y / 2, z);
        support.material = frameMat;

        const screen = BABYLON.MeshBuilder.CreatePlane("trackScreen" + i, { width: 40, height: 24 }, scene);
        screen.parent = frame;
        screen.position.z = -1.1;
        
        // --- TEXTURE FIXE "NITRO SERIES" (Fini les ricochets) ---
        const screenMat = new BABYLON.StandardMaterial("screenMat" + i, scene);
        const tex = new BABYLON.Texture("texture/nitro_blue.png", scene);
        screenMat.diffuseTexture = tex;
        screenMat.emissiveTexture = tex;
        screenMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
        screen.material = screenMat;
        
        screens.push(screen);
    }
    return screens;
}
