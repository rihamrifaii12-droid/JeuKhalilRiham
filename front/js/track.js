import { scene } from './scene_setup.js';
import { getTrackX, getTrackY } from './utils.js';
import { FINISH_LINE_Z, TRACK_LENGTH, TRACK_WIDTH } from './config.js';

// --- MATÉRIAUX URBAINS ---
const asphalte = new BABYLON.StandardMaterial("asphalte", scene);
asphalte.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
asphalte.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

const trottoirMat = new BABYLON.StandardMaterial("trottoirMat", scene);
trottoirMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
trottoirMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

const sableMat = new BABYLON.StandardMaterial("sableMat", scene);
// À Nice, la plage est faite de Galets (Pebbles) !
sableMat.diffuseTexture = new BABYLON.Texture("./texture/nice_pebbles.png", scene);
sableMat.diffuseTexture.uScale = 20;
sableMat.diffuseTexture.vScale = 1;
sableMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); // Fallback color
sableMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

const eauMat = new BABYLON.StandardMaterial("eauMat", scene);
eauMat.diffuseTexture = new BABYLON.Texture("texture/water_texture.png", scene);
eauMat.diffuseTexture.uScale = 20;
eauMat.diffuseTexture.vScale = 20;
eauMat.alpha = 0.8;
eauMat.diffuseColor = new BABYLON.Color3(0, 0.5, 0.8);
eauMat.backFaceCulling = false;

const herbeMat = new BABYLON.StandardMaterial("herbeMat", scene);
herbeMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);
herbeMat.backFaceCulling = false;

export function initTrack() {
    const roadPath1 = []; const roadPath2 = [];
    const tLeft1 = []; const tLeft2 = [];
    const tRight1 = []; const tRight2 = [];
    const beach1 = []; const beach2 = [];
    const ocean1 = []; const ocean2 = [];
    const grass1 = []; const grass2 = [];

    for (let z = -200; z < TRACK_LENGTH; z += 10) {
        const x = getTrackX(z);
        const y = getTrackY(z);

        // Route
        roadPath1.push(new BABYLON.Vector3(x - 30, y, z));
        roadPath2.push(new BABYLON.Vector3(x + 30, y, z));

        // Trottoir
        tLeft1.push(new BABYLON.Vector3(x - 36, y + 0.3, z));
        tLeft2.push(new BABYLON.Vector3(x - 30, y + 0.3, z));
        tRight1.push(new BABYLON.Vector3(x + 30, y + 0.3, z));
        tRight2.push(new BABYLON.Vector3(x + 36, y + 0.3, z));

        // Plage (plus haute pour être vue !)
        beach1.push(new BABYLON.Vector3(x - 130, y + 0.1, z));
        beach2.push(new BABYLON.Vector3(x - 36, y + 0.3, z));

        // Océan
        ocean1.push(new BABYLON.Vector3(x - 4000, -5, z));
        ocean2.push(new BABYLON.Vector3(x - 130, y + 0.1, z));

        // Fond droit
        grass1.push(new BABYLON.Vector3(x + 36, y + 0.2, z));
        grass2.push(new BABYLON.Vector3(x + 2000, y + 0.2, z));
    }

    const opt = { sideOrientation: BABYLON.Mesh.DOUBLESIDE };

    const road = BABYLON.MeshBuilder.CreateRibbon("road", { pathArray: [roadPath1, roadPath2], ...opt }, scene);
    road.material = asphalte;

    const lTrot = BABYLON.MeshBuilder.CreateRibbon("lTrot", { pathArray: [tLeft1, tLeft2], ...opt }, scene);
    lTrot.material = trottoirMat;

    const rTrot = BABYLON.MeshBuilder.CreateRibbon("rTrot", { pathArray: [tRight1, tRight2], ...opt }, scene);
    rTrot.material = trottoirMat;

    const beach = BABYLON.MeshBuilder.CreateRibbon("beach", { pathArray: [beach1, beach2], ...opt }, scene);
    beach.material = sableMat;

    const ocean = BABYLON.MeshBuilder.CreateRibbon("ocean", { pathArray: [ocean1, ocean2], ...opt }, scene);
    ocean.material = eauMat;

    const grass = BABYLON.MeshBuilder.CreateRibbon("grass", { pathArray: [grass1, grass2], ...opt }, scene);
    grass.material = herbeMat;
}

export function initBuildings() {
    const baseMats = [
        new BABYLON.StandardMaterial("baseB1", scene),
        new BABYLON.StandardMaterial("baseB2", scene)
    ];

    const tex1 = new BABYLON.Texture("texture/building_facade.png", scene);
    const tex2 = new BABYLON.Texture("texture/nice_building.png", scene);
    baseMats[0].diffuseTexture = tex1;
    baseMats[1].diffuseTexture = tex2;

    const medColors = [
        new BABYLON.Color3(1, 0.8, 0.5), // Ochre
        new BABYLON.Color3(1, 0.7, 0.4), // Terracotta
        new BABYLON.Color3(1, 0.9, 0.8), // Crème
        new BABYLON.Color3(1, 1, 1)      // Blanc
    ];

    for (let bz = -100; bz < TRACK_LENGTH; bz += 35) {
        let trackX = getTrackX(bz);
        let nextX = getTrackX(bz + 10);
        let bWidth = 15 + Math.random() * 20;
        let bHeight = 15 + Math.random() * 20;

        const building = BABYLON.MeshBuilder.CreateBox("build" + bz, {
            width: bWidth, height: bHeight, depth: 30, wrap: true
        }, scene);

        building.position = new BABYLON.Vector3(trackX + 38 + bWidth / 2, getTrackY(bz) + bHeight / 2, bz);
        building.rotation.y = Math.atan2(nextX - trackX, 10);

        const bMat = baseMats[Math.floor(Math.random() * baseMats.length)].clone("bMat" + bz);
        bMat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];

        if (bMat.diffuseTexture) {
            bMat.diffuseTexture = bMat.diffuseTexture.clone();
            bMat.diffuseTexture.uScale = bWidth / 10;
            bMat.diffuseTexture.vScale = bHeight / 12;
        }
        building.material = bMat;
    }
}

export function initFinishLine() {
    const finishX = getTrackX(FINISH_LINE_Z);
    const finishY = getTrackY(FINISH_LINE_Z);
    const finishLine = BABYLON.MeshBuilder.CreatePlane("finish", { width: 60, height: 20 }, scene);
    finishLine.rotation.x = Math.PI / 2;
    finishLine.position.z = FINISH_LINE_Z;
    finishLine.position.x = finishX;
    finishLine.position.y = finishY + 0.2;
    const finishMat = new BABYLON.StandardMaterial("finishMat", scene);
    finishMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    finishLine.material = finishMat;
    return finishLine;
}
