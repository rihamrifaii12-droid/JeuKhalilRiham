//bmw m4
import { CAR_DIMENSIONS } from './config.js';
import { getTrackX, getTrackY } from './utils.js';

export class Car {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // --- ÉTAT ---
        this.velocity = 0;
        this.velocityY = 0;
        this.angle = 0;
        this.visualAngle = 0;
        this.boostEnergy = 0;
        this.boostActive = false;
        this.shockwaveActive = false;
        this.isDrifting = false;
        this.isDrafting = false;

        this.gravity = 0.04;
        this.targetBodyRoll = 0;
        this.targetBodyPitch = 0;

        // --- MESH ---
        this.mesh = BABYLON.MeshBuilder.CreateBox("car", {
            width: CAR_DIMENSIONS.width,
            height: CAR_DIMENSIONS.height,
            depth: CAR_DIMENSIONS.depth
        }, this.scene);
        this.mesh.position = new BABYLON.Vector3(10, 0.75, -12);
        this.mesh.isVisible = false;

        // Cible de Caméra Stable (pour éviter que la cam tourne en tonneau)
        this.camTarget = new BABYLON.TransformNode("camTarget", this.scene);
        this.camera.lockedTarget = this.camTarget;

        // Modèle 3D Réel
        this.realCarMesh = null;
        this.loadModel();

        // --- OMBRE ---
        this.createShadow();
    }


    createShadow() {
        this.shadow = BABYLON.MeshBuilder.CreatePlane("carShadow", { width: 3.5, height: 6 }, this.scene);
        this.shadow.rotation.x = Math.PI / 2;
        this.shadow.isPickable = false;

        const dynamicTexture = new BABYLON.DynamicTexture("shadowTex", 128, this.scene);
        const context = dynamicTexture.getContext();
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(0,0,0,0.7)");
        gradient.addColorStop(0.8, "rgba(0,0,0,0.2)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        dynamicTexture.update();

        const shadowMat = new BABYLON.StandardMaterial("shadowMat", this.scene);
        shadowMat.diffuseTexture = dynamicTexture;
        shadowMat.useAlphaFromDiffuseTexture = true;
        shadowMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadowMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        this.shadow.material = shadowMat;
        this.shadow.position.y = 0.1;
    }

    loadModel() {
        // ... (Code de chargement GLB inchangé)
        BABYLON.SceneLoader.ImportMeshAsync("", "./", "bmw_m4.glb", this.scene).then((result) => {
            console.log("M4 Classe Car chargée !");
            this.realCarMesh = result.meshes[0];
            this.realCarMesh.parent = this.mesh;
            this.realCarMesh.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
            this.realCarMesh.rotationQuaternion = null;
            this.realCarMesh.position.y = CAR_DIMENSIONS.modelOffsetY;

            result.meshes.forEach(m => {
                if (m.material) {
                    m.material.albedoColor = new BABYLON.Color3(0.04, 0.04, 0.04);
                    m.material.metallic = 0.6;
                    m.material.roughness = 0.6;
                }
            });
        });
    }

    update(keys, inputState, isRacing, ramps, boosterCubes, photoCallback) {
        if (!isRacing) {
            this.velocity = 0;
            this.boostActive = false;
            return;
        }

        this.isDrifting = false;
        this.visualAngle = this.angle;

        // --- ALIGNEMENT AUTO ---
        const nextZ = this.mesh.position.z + 15;
        const trackAngle = Math.atan2(getTrackX(nextZ) - getTrackX(this.mesh.position.z), 15);

        // --- BOOST & SHOCKWAVE (DOUBLE TAP SPACE) ---
        if (keys[' ']) {
            if (!this.wasSpacePressed) {
                const now = Date.now();
                if (now - (this.lastSpacePress || 0) < 300 && this.boostEnergy >= 95) {
                    this.shockwaveActive = true;
                    // TODO: trigger shockwave sound
                }
                this.lastSpacePress = now;
            }
            this.wasSpacePressed = true;

            if (this.boostEnergy > 0) {
                this.boostActive = true;
                this.boostEnergy = Math.max(this.boostEnergy - (this.shockwaveActive ? 1.5 : 0.6), 0);
            } else {
                this.boostActive = false;
                this.shockwaveActive = false;
            }
        } else {
            this.boostActive = false;
            this.shockwaveActive = false;
            this.wasSpacePressed = false;
        }

        // --- PHYSIQUE ---
        let targetMax = this.boostActive ? (this.shockwaveActive ? 650 : 550) : 350;
        let accel = this.boostActive ? (this.shockwaveActive ? 25 : 15) : 4.5;
        if (this.shockwaveActive) targetMax = 1000;

        if (keys['ArrowUp']) this.velocity = Math.min(this.velocity + accel, targetMax);
        else if (keys['ArrowDown']) this.velocity = Math.max(this.velocity - 5, -50);
        else {
            if (this.velocity > 0) this.velocity = Math.max(this.velocity - 0.8, 0);
            else if (this.velocity < 0) this.velocity = Math.min(this.velocity + 1.5, 0);
        }

        if (inputState.isDriftMode && this.velocity > 80 && (keys['ArrowLeft'] || keys['ArrowRight'])) {
            this.isDrifting = true;
        }

        let turnSpeed = this.boostActive ? 0.025 : 0.055;
        if (this.isDrifting) turnSpeed = 0.06;

        this.targetBodyRoll = 0;
        this.targetBodyPitch = 0;

        if (keys['ArrowLeft']) {
            this.angle -= turnSpeed;
            this.targetBodyRoll = 0.15;
            if (this.isDrifting) this.visualAngle = this.angle - 0.25;
        } else if (keys['ArrowRight']) {
            this.angle += turnSpeed;
            this.targetBodyRoll = -0.15;
            if (this.isDrifting) this.visualAngle = this.angle + 0.25;
        } else {
            // FINI l'assistance ! La voiture garde son angle.
            // On ne la force plus à "se remettre droite" (trackAngle)
        }

        if (this.isDrifting) this.targetBodyRoll *= 2.0;
        if (keys['ArrowUp'] || this.boostActive) this.targetBodyPitch = -0.05;
        else if (keys['ArrowDown']) this.targetBodyPitch = 0.08;

        // --- MOUVEMENT ---
        let moveStep = ((this.velocity / 3.6) / 60) * 1.2;
        this.mesh.position.x += Math.sin(this.angle) * moveStep;
        this.mesh.position.z += Math.cos(this.angle) * moveStep;
        this.mesh.rotation.y = this.visualAngle;

        // --- MISE À JOUR CIBLE CAMÉRA (STABILISATION) ---
        // On suit la position mais on lisse les rotations et le tangage
        this.camTarget.position.x = this.mesh.position.x;
        this.camTarget.position.y = this.mesh.position.y + 1.5; // Offset vertical pour éviter que la cam passe sous le sol
        this.camTarget.position.z = this.mesh.position.z;
        this.camTarget.rotation.y = this.angle;

        // --- GRAVITÉ ET SOL ---
        this.velocityY -= this.gravity;
        this.mesh.position.y += this.velocityY;

        const groundY = getTrackY(this.mesh.position.z);
        const standY = groundY + 0.75;

        if (this.mesh.position.y <= standY) {
            if (this.velocityY < -0.1) {
                this.camera.radius += Math.abs(this.velocityY) * 5;
                if (this.realCarMesh) this.realCarMesh.position.y = -0.4;
            }
            this.mesh.position.y = standY;
            this.velocityY = 0;

            const slope = (getTrackY(this.mesh.position.z + 5) - getTrackY(this.mesh.position.z)) / 5;
            const targetRotX = -Math.atan(slope) + this.targetBodyPitch;
            this.mesh.rotation.x = BABYLON.Scalar.Lerp(this.mesh.rotation.x, targetRotX, 0.12);

            const currentZ = this.mesh.rotation.z;
            const nearestFullRotation = Math.round(currentZ / (Math.PI * 2)) * (Math.PI * 2);
            const targetZ = nearestFullRotation + this.targetBodyRoll;
            this.mesh.rotation.z = BABYLON.Scalar.Lerp(currentZ, targetZ, 0.15);
        } else {
            // Anticipation de l'atterrissage (si très proche du sol, on commence à redresser)
            if (this.mesh.position.y < standY + 3) {
                const nearestFullRotation = Math.round(this.mesh.rotation.z / (Math.PI * 2)) * (Math.PI * 2);
                this.mesh.rotation.z = BABYLON.Scalar.Lerp(this.mesh.rotation.z, nearestFullRotation, 0.1);
            } else if (Math.abs(this.mesh.rotation.z % (Math.PI * 2)) > 0.1) {
                this.mesh.rotation.z += 0.12;
            }
        }

        if (this.realCarMesh && this.realCarMesh.position.y < 0) {
            this.realCarMesh.position.y = BABYLON.Scalar.Lerp(this.realCarMesh.position.y, 0, 0.1);
        }

        // --- SENSATION DE VITESSE (CAMÉRA) ---
        this.camera.radius = BABYLON.Scalar.Lerp(this.camera.radius, 20, 0.05);

        const baseFov = 0.8;
        const maxFov = 1.35; // Le champ de vision s'élargit avec la vitesse
        const targetFov = baseFov + (Math.max(0, this.velocity) / 800) * (maxFov - baseFov);
        this.camera.fov = BABYLON.Scalar.Lerp(this.camera.fov || baseFov, targetFov, 0.08);

        // Légères vibrations pour l'immersion à plus de 200 km/h
        if (this.velocity > 200) {
            const shake = (this.velocity - 200) / 600 * 0.15;
            this.camTarget.position.x += (Math.random() - 0.5) * shake;
            this.camTarget.position.y += (Math.random() - 0.5) * shake;
        }

        // --- RAMPES ---
        for (const r of ramps) {
            if (this.mesh.position.y <= standY + 1.0 && this.velocity > 50) {
                if (Math.abs(this.mesh.position.x - r.position.x) < 8.5 && Math.abs(this.mesh.position.z - r.position.z) < 5) {
                    this.velocityY = Math.max(0.7, (this.velocity / 350));
                    this.mesh.position.y += 0.5;
                    this.mesh.rotation.x = -0.3;
                    if (r.isBarrel) this.mesh.rotation.z += 0.2;
                }
            }
        }

        // --- MISE À JOUR OMBRE ---
        const heightAboveGround = this.mesh.position.y - groundY - 0.75;
        
        if (this.shadow) {
            this.shadow.position.x = this.mesh.position.x;
            this.shadow.position.z = this.mesh.position.z;
            this.shadow.position.y = groundY + 0.1;
            this.shadow.rotation.y = this.visualAngle;
            
            // L'ombre s'estompe et s'agrandit avec la hauteur
            const alpha = Math.max(0, 0.7 - heightAboveGround / 15);
            this.shadow.material.alpha = alpha;
            const scale = 1 + heightAboveGround * 0.15;
            this.shadow.scaling = new BABYLON.Vector3(scale, scale, 1);
        }
    }
}


export function initPlayer(scene, camera) {
    return new Car(scene, camera);
}

export function setupInputs() {
    const keys = {};
    const inputState = { isDriftMode: false };
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key.toLowerCase() === 'f') inputState.isDriftMode = !inputState.isDriftMode;
        if (e.key === ' ') inputState.isDriftMode = false;
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    return { keys, inputState };
}
