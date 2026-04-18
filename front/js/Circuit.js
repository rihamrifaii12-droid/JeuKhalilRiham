import { getTrackX, getTrackY } from './utils.js';
import { FINISH_LINE_Z, TRACK_LENGTH, TRACK_WIDTH } from './config.js';

export class CoteAzur {
    constructor(scene) {
        this.scene = scene;
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        // --- MATÉRIAUX URBAINS ---
        this.materials.asphalte = new BABYLON.StandardMaterial("asphalte", this.scene);
        this.materials.asphalte.diffuseTexture = new BABYLON.Texture("./texture/asphalt_texture.jpg", this.scene);
        this.materials.asphalte.diffuseTexture.uScale = 6;
        this.materials.asphalte.diffuseTexture.vScale = 200;
        this.materials.asphalte.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        this.materials.asphalte.specularPower = 20;

        this.materials.trottoirMat = new BABYLON.StandardMaterial("trottoirMat", this.scene);
        this.materials.trottoirMat.diffuseTexture = new BABYLON.Texture("./texture/sidewalk_texture.jpg", this.scene);
        this.materials.trottoirMat.diffuseTexture.uScale = 3;
        this.materials.trottoirMat.diffuseTexture.vScale = 150;
        this.materials.trottoirMat.diffuseColor = new BABYLON.Color3(0.80, 0.10, 0.08); // Rouge brique méditerranéen
        this.materials.trottoirMat.specularColor = new BABYLON.Color3(0.1, 0.05, 0.05);

        this.materials.sableMat = new BABYLON.StandardMaterial("sableMat", this.scene);
        this.materials.sableMat.diffuseTexture = new BABYLON.Texture("./texture/nice_pebbles.png", this.scene);
        this.materials.sableMat.diffuseTexture.uScale = 20;
        this.materials.sableMat.diffuseTexture.vScale = 3;
        this.materials.sableMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        this.materials.sableMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        this.materials.eauMat = new BABYLON.StandardMaterial("eauMat", this.scene);
        this.materials.eauMat.diffuseTexture = new BABYLON.Texture("./texture/water_texture.png", this.scene);
        this.materials.eauMat.diffuseTexture.uScale = 20;
        this.materials.eauMat.diffuseTexture.vScale = 20;
        this.materials.eauMat.diffuseColor = new BABYLON.Color3(0.05, 0.15, 0.4);
        this.materials.eauMat.specularColor = new BABYLON.Color3(0.1, 0.2, 0.5);
        this.materials.eauMat.specularPower = 16;

        this.materials.herbeMat = new BABYLON.StandardMaterial("herbeMat", this.scene);
        this.materials.herbeMat.diffuseTexture = new BABYLON.Texture("./texture/grass_texture.jpg", this.scene);
        this.materials.herbeMat.diffuseTexture.uScale = 25;
        this.materials.herbeMat.diffuseTexture.vScale = 250;

        this.materials.falaiseMat = new BABYLON.StandardMaterial("falaiseMat", this.scene);
        this.materials.falaiseMat.diffuseTexture = new BABYLON.Texture("texture/cliff_rock.png", this.scene);
        this.materials.falaiseMat.diffuseTexture.uScale = 20;
        this.materials.falaiseMat.diffuseTexture.vScale = 1;
        this.materials.falaiseMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        this.materials.falaiseMat.roughness = 0.9;
    }

    initTrack() {
        const roadPath1 = []; const roadPath2 = [];
        const tLeft1 = []; const tLeft2 = [];
        const tRight1 = []; const tRight2 = [];
        const cliffTop = []; const cliffBottom = [];
        const beach1 = []; const beach2 = [];
        const ocean1 = []; const ocean2 = [];
        const grass1 = []; const grass2 = [];

        const SEA_LEVEL = -80;

        for (let z = -200; z < TRACK_LENGTH; z += 10) {
            const x = getTrackX(z);
            const y = getTrackY(z);

            roadPath1.push(new BABYLON.Vector3(x - 30, y, z));
            roadPath2.push(new BABYLON.Vector3(x + 30, y, z));

            tLeft1.push(new BABYLON.Vector3(x - 40, y + 0.3, z));
            tLeft2.push(new BABYLON.Vector3(x - 30, y + 0.3, z));
            tRight1.push(new BABYLON.Vector3(x + 30, y + 0.3, z));
            tRight2.push(new BABYLON.Vector3(x + 40, y + 0.3, z));

            // FALAISES (Paroi verticale du trottoir au niveau de la mer)
            cliffTop.push(new BABYLON.Vector3(x - 45, y + 0.3, z));
            cliffBottom.push(new BABYLON.Vector3(x - 45, SEA_LEVEL, z));

            // PLAGE (Pente du pied de la falaise vers le large)
            beach2.push(new BABYLON.Vector3(x - 45, SEA_LEVEL, z));
            beach1.push(new BABYLON.Vector3(-280, SEA_LEVEL, z));

            // OCÉAN (Horizon fixe)
            ocean1.push(new BABYLON.Vector3(-4000, SEA_LEVEL, z));
            ocean2.push(new BABYLON.Vector3(-280, SEA_LEVEL, z));

            grass1.push(new BABYLON.Vector3(x + 40, y + 0.2, z));
            grass2.push(new BABYLON.Vector3(x + 2000, y + 0.2, z));
        }

        const opt = { sideOrientation: BABYLON.Mesh.DOUBLESIDE };

        const road = BABYLON.MeshBuilder.CreateRibbon("road", { pathArray: [roadPath1, roadPath2], ...opt }, this.scene);
        road.material = this.materials.asphalte;

        const lTrot = BABYLON.MeshBuilder.CreateRibbon("lTrot", { pathArray: [tLeft1, tLeft2], ...opt }, this.scene);
        lTrot.material = this.materials.trottoirMat;

        const rTrot = BABYLON.MeshBuilder.CreateRibbon("rTrot", { pathArray: [tRight1, tRight2], ...opt }, this.scene);
        rTrot.material = this.materials.trottoirMat;

        const cliff = BABYLON.MeshBuilder.CreateRibbon("cliff", { pathArray: [cliffTop, cliffBottom], ...opt }, this.scene);
        cliff.material = this.materials.falaiseMat;

        const beach = BABYLON.MeshBuilder.CreateRibbon("beach", { pathArray: [beach1, beach2], ...opt }, this.scene);
        beach.material = this.materials.sableMat;

        const ocean = BABYLON.MeshBuilder.CreateRibbon("ocean", { pathArray: [ocean1, ocean2], ...opt }, this.scene);
        ocean.material = this.materials.eauMat;

        const grass = BABYLON.MeshBuilder.CreateRibbon("grass", { pathArray: [grass1, grass2], ...opt }, this.scene);
        grass.material = this.materials.herbeMat;
    }

    initBuildings() {
        // Palette méditerranéenne Riviera / Côte d'Azur
        const medColors = [
            new BABYLON.Color3(0.98, 0.96, 0.90), // Blanc cassé
            new BABYLON.Color3(0.94, 0.91, 0.79), // Crème
            new BABYLON.Color3(0.96, 0.90, 0.73), // Sable doré
            new BABYLON.Color3(0.88, 0.80, 0.68), // Beige méditerranéen
            new BABYLON.Color3(0.87, 0.72, 0.58), // Terracotta claire
            new BABYLON.Color3(0.86, 0.91, 0.96), // Blanc bleué Riviera
            new BABYLON.Color3(1.00, 0.95, 0.85), // Ivoire chaud
        ];

        const baseMats = [
            new BABYLON.StandardMaterial("baseB1", this.scene),
            new BABYLON.StandardMaterial("baseB2", this.scene)
        ];
        baseMats[0].diffuseTexture = new BABYLON.Texture("texture/building_facade.png", this.scene);
        baseMats[1].diffuseTexture = new BABYLON.Texture("texture/nice_building.png", this.scene);

        const SLOT = 32; // espacement fixe entre bâtiments

        for (let bz = -100; bz < TRACK_LENGTH; bz += SLOT) {
            const trackX = getTrackX(bz);
            const nextX  = getTrackX(bz + SLOT);
            const trackY = getTrackY(bz);
            // Angle basé sur toute la longueur du slot pour une meilleure continuité
            const angle  = Math.atan2(nextX - trackX, SLOT);

            // BÂTIMENT PRINCIPAL --- largeur = slot - 1u de gap (garantit l'alignement)
            const bWidth  = SLOT - 1;              // 31 u fixe : s'emboîte parfaitement
            const bHeight = 22 + Math.random() * 32;  // 22 à 54 u
            const bDepth  = 18 + Math.random() * 14;  // 18 à 32 u

            const building = BABYLON.MeshBuilder.CreateBox("build" + bz, {
                width: bWidth, height: bHeight, depth: bDepth, wrap: true
            }, this.scene);
            // Centré au milieu du slot en Z
            const midZ  = bz + SLOT / 2;
            const midX  = getTrackX(midZ);
            const midY  = getTrackY(midZ);
            building.position = new BABYLON.Vector3(midX + 52 + bWidth / 2, midY + bHeight / 2, midZ);
            building.rotation.y = angle;

            const bMat = baseMats[Math.floor(Math.random() * baseMats.length)].clone("bMat" + bz);
            bMat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
            if (bMat.diffuseTexture) {
                bMat.diffuseTexture = bMat.diffuseTexture.clone();
                bMat.diffuseTexture.uScale = bWidth / 8;
                bMat.diffuseTexture.vScale = bHeight / 10;
            }
            building.material = bMat;

            // PENTHOUSE (60% des bâtiments)
            if (Math.random() > 0.4) {
                const phW = bWidth * (0.35 + Math.random() * 0.3);
                const phH = 5 + Math.random() * 10;
                const penthouse = BABYLON.MeshBuilder.CreateBox("pent" + bz, {
                    width: phW, height: phH, depth: bDepth * 0.65
                }, this.scene);
                penthouse.parent = building;
                penthouse.position.y = bHeight / 2 + phH / 2;
                penthouse.position.x = (Math.random() - 0.5) * (bWidth - phW) * 0.4;
                const pMat = new BABYLON.StandardMaterial("pMat" + bz, this.scene);
                pMat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
                penthouse.material = pMat;
            }

            // CHEMINÉE (40% des bâtiments)
            if (Math.random() > 0.6) {
                const chimneyH = 4 + Math.random() * 6;
                const chimney = BABYLON.MeshBuilder.CreateBox("chimney" + bz, {
                    width: 1.2, height: chimneyH, depth: 1.2
                }, this.scene);
                chimney.parent = building;
                chimney.position.y = bHeight / 2 + chimneyH / 2;
                chimney.position.x = (Math.random() - 0.5) * bWidth * 0.5;
                chimney.position.z = (Math.random() - 0.5) * bDepth * 0.4;
                const cMat = new BABYLON.StandardMaterial("chimMat" + bz, this.scene);
                cMat.diffuseColor = new BABYLON.Color3(0.52, 0.35, 0.22);
                chimney.material = cMat;
            }

            // BÂTIMENT DEUXIÈME PLAN (50% des cases)
            if (Math.random() > 0.5) {
                const b2W = SLOT - 1;
                const b2H = 14 + Math.random() * 28;
                const building2 = BABYLON.MeshBuilder.CreateBox("build2_" + bz, {
                    width: b2W, height: b2H, depth: 16
                }, this.scene);
                building2.position = new BABYLON.Vector3(
                    midX + 52 + bWidth + b2W / 2 + 5,
                    midY + b2H / 2, midZ
                );
                building2.rotation.y = angle;
                const b2Mat = new BABYLON.StandardMaterial("b2Mat" + bz, this.scene);
                b2Mat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
                building2.material = b2Mat;
            }
        }
    }

    initFinishLine() {
        const finishX = getTrackX(FINISH_LINE_Z);
        const finishY = getTrackY(FINISH_LINE_Z);
        
        // Groupe pour l'arche
        const gate = new BABYLON.TransformNode("finishGate", this.scene);
        gate.position = new BABYLON.Vector3(finishX, finishY, FINISH_LINE_Z);

        // Piliers
        const pillarMat = new BABYLON.StandardMaterial("pillarMat", this.scene);
        pillarMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        pillarMat.metallic = 1;

        [-35, 35].forEach(sideX => {
            const p = BABYLON.MeshBuilder.CreateBox("pillar", { width: 4, height: 40, depth: 4 }, this.scene);
            p.parent = gate;
            p.position.x = sideX;
            p.position.y = 20;
            p.material = pillarMat;
            
            // Neon sur le pilier
            const neon = BABYLON.MeshBuilder.CreateBox("neon", { width: 1, height: 38, depth: 1.1 }, this.scene);
            neon.parent = p;
            neon.position.x = sideX > 0 ? -2.1 : 2.1;
            const neonMat = new BABYLON.StandardMaterial("neonMat", this.scene);
            neonMat.emissiveColor = new BABYLON.Color3(1, 0, 0.5); // Magenta/Neon
            neon.material = neonMat;
        });

        // Arche transversale
        const bar = BABYLON.MeshBuilder.CreateBox("archBar", { width: 74, height: 8, depth: 6 }, this.scene);
        bar.parent = gate;
        bar.position.y = 40;
        bar.material = pillarMat;

        // Texte FINISH (emissive)
        const finishBanner = BABYLON.MeshBuilder.CreatePlane("banner", { width: 40, height: 6 }, this.scene);
        finishBanner.parent = bar;
        finishBanner.position.z = -3.1;
        const bannerMat = new BABYLON.StandardMaterial("bannerMat", this.scene);
        const bannerTex = new BABYLON.DynamicTexture("bannerTex", 512, this.scene);
        bannerTex.drawText("FINISH", null, null, "bold 140px Orbitron", "#ffffff", "#ff006e", true);
        bannerMat.emissiveTexture = bannerTex;
        finishBanner.material = bannerMat;

        // Sol Damier
        const checker = BABYLON.MeshBuilder.CreatePlane("checker", { width: 60, height: 10 }, this.scene);
        checker.parent = gate;
        checker.rotation.x = Math.PI / 2;
        checker.position.y = 0.1;
        const checkerMat = new BABYLON.StandardMaterial("checkerMat", this.scene);
        checkerMat.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/Khaled-Rahmouni/JeuKhalilRiham/main/front/texture/asphalt_texture.jpg", this.scene); // Placeholder
        checkerMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        // On simule un damier avec une texture de grille ou DynamicTexture
        const dynamicChecker = new BABYLON.DynamicTexture("checkTex", 512, this.scene);
        const ctx = dynamicChecker.getContext();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,512,512);
        ctx.fillStyle = "#000000";
        for(let i=0; i<8; i++) for(let j=0; j<8; j++) if((i+j)%2===0) ctx.fillRect(i*64, j*64, 64, 64);
        dynamicChecker.update();
        checkerMat.diffuseTexture = dynamicChecker;
        checker.material = checkerMat;

        return gate;
    }

    // ========== GLISSIÈRES DE SÉCURITÉ ==========
    initBarriers() {
        const barrierMat = new BABYLON.StandardMaterial("barrierMat", this.scene);
        barrierMat.diffuseColor = new BABYLON.Color3(0.88, 0.88, 0.88);
        barrierMat.specularColor = new BABYLON.Color3(1, 1, 1);
        barrierMat.specularPower = 80;

        const stripeMat = new BABYLON.StandardMaterial("barrierStripe", this.scene);
        stripeMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.05);
        stripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.05);

        const lBot = [], lTop = [], rBot = [], rTop = [];
        for (let z = -200; z < TRACK_LENGTH; z += 10) {
            const x = getTrackX(z), y = getTrackY(z);
            lBot.push(new BABYLON.Vector3(x - 40, y + 0.3, z));
            lTop.push(new BABYLON.Vector3(x - 40, y + 1.3, z));
            rBot.push(new BABYLON.Vector3(x + 40, y + 0.3, z));
            rTop.push(new BABYLON.Vector3(x + 40, y + 1.3, z));
        }

        const opt = { sideOrientation: BABYLON.Mesh.DOUBLESIDE };
        BABYLON.MeshBuilder.CreateRibbon("lBarrier", { pathArray: [lBot, lTop], ...opt }, this.scene).material = barrierMat;
        BABYLON.MeshBuilder.CreateRibbon("rBarrier", { pathArray: [rBot, rTop], ...opt }, this.scene).material = barrierMat;

        // Poteaux rouges tous les 80 unités
        for (let z = 0; z < TRACK_LENGTH; z += 80) {
            const x = getTrackX(z), y = getTrackY(z);
            [x - 40, x + 40].forEach((px, side) => {
                const post = BABYLON.MeshBuilder.CreateBox("post" + z + "_" + side, { width: 0.35, height: 1.3, depth: 0.35 }, this.scene);
                post.position = new BABYLON.Vector3(px, y + 0.65, z);
                post.material = stripeMat;
            });
        }
    }


    // ========== LAMPADAIRES ==========
    initStreetLights() {
        const poleMat = new BABYLON.StandardMaterial("poleMat", this.scene);
        poleMat.diffuseColor = new BABYLON.Color3(0.3, 0.32, 0.38);
        poleMat.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        poleMat.specularPower = 40;

        const bulbMat = new BABYLON.StandardMaterial("bulbMat", this.scene);
        bulbMat.emissiveColor = new BABYLON.Color3(1, 0.93, 0.62);
        bulbMat.diffuseColor = new BABYLON.Color3(1, 0.93, 0.62);

        for (let z = 40; z < TRACK_LENGTH; z += 130) {
            const x = getTrackX(z), y = getTrackY(z);

            const pole = BABYLON.MeshBuilder.CreateCylinder("lpole" + z, {
                diameter: 0.35, height: 12, tessellation: 6
            }, this.scene);
            pole.position = new BABYLON.Vector3(x + 45, y + 6, z);
            pole.material = poleMat;

            const arm = BABYLON.MeshBuilder.CreateCylinder("larm" + z, {
                diameter: 0.18, height: 5, tessellation: 5
            }, this.scene);
            arm.parent = pole;
            arm.position = new BABYLON.Vector3(-2.5, 5.5, 0);
            arm.rotation.z = Math.PI / 2;
            arm.material = poleMat;

            // Ampoule — brille grâce au GlowLayer existant
            const bulb = BABYLON.MeshBuilder.CreateSphere("lbulb" + z, {
                diameter: 1.1, segments: 5
            }, this.scene);
            bulb.parent = pole;
            bulb.position = new BABYLON.Vector3(-5, 5.5, 0);
            bulb.material = bulbMat;
        }
    }

    // ========== MARQUAGES AU SOL ==========
    initRoadMarkings() {
        const markMat = new BABYLON.StandardMaterial("markMat", this.scene);
        markMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        markMat.emissiveColor = new BABYLON.Color3(0.12, 0.12, 0.12);

        for (let z = 40; z < TRACK_LENGTH; z += 28) {
            const x = getTrackX(z), y = getTrackY(z);
            const slope  = -Math.atan((getTrackY(z + 5) - getTrackY(z)) / 5);
            const yAngle =  Math.atan2(getTrackX(z + 5) - getTrackX(z), 5);

            const mark = BABYLON.MeshBuilder.CreateBox("mark" + z, {
                width: 0.5, height: 0.06, depth: 10
            }, this.scene);
            mark.position = new BABYLON.Vector3(x, y + 0.09, z);
            mark.rotation.x = slope;
            mark.rotation.y = yAngle;
            mark.material = markMat;
        }
    }

    // ========== SOLEIL GÉANT ==========
    initSun() {
        const sunMat = new BABYLON.StandardMaterial("sunSphereMat", this.scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.88, 0.38);
        sunMat.diffuseColor  = new BABYLON.Color3(0, 0, 0);

        const sunMesh = BABYLON.MeshBuilder.CreateSphere("sunSphere", {
            diameter: 160, segments: 8
        }, this.scene);
        sunMesh.position = new BABYLON.Vector3(-2800, 480, 2500);
        sunMesh.material = sunMat;

        // Halo autour du soleil (sphère plus grande, semi-transparente)
        const haloMat = new BABYLON.StandardMaterial("haloMat", this.scene);
        haloMat.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
        haloMat.diffuseColor  = new BABYLON.Color3(0, 0, 0);
        haloMat.alpha = 0.18;
        const halo = BABYLON.MeshBuilder.CreateSphere("sunHalo", { diameter: 280, segments: 6 }, this.scene);
        halo.position = sunMesh.position.clone();
        halo.material = haloMat;
    }
}

