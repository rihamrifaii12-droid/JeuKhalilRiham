import { scene, camera } from './scene_setup.js';
import { CAR_DIMENSIONS } from './config.js';

export function initPlayer() {
    const car = BABYLON.MeshBuilder.CreateBox("car", { 
        width: CAR_DIMENSIONS.width, 
        height: CAR_DIMENSIONS.height, 
        depth: CAR_DIMENSIONS.depth 
    }, scene);
    car.position = new BABYLON.Vector3(0, 0.75, 0);
    car.isVisible = false; // Boite de collision rendue invisible

    // Chargement du Modèle 3D
    BABYLON.SceneLoader.ImportMeshAsync("", "./", "bmw_m4.glb", scene).then((result) => {
        console.log("M4 Hyper-Réaliste chargée correctement !");
        const realCarMesh = result.meshes[0];
        realCarMesh.parent = car;

        realCarMesh.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
        realCarMesh.rotationQuaternion = null;
        realCarMesh.rotation.y = 0;
        realCarMesh.position.y = CAR_DIMENSIONS.modelOffsetY;

        // Forcer le rendu Noir Mat pour le joueur (Mode furtif !)
        result.meshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.albedoColor = new BABYLON.Color3(0.04, 0.04, 0.04);
                mesh.material.metallic = 0.6;
                mesh.material.roughness = 0.6;
            }
        });
    }).catch(err => console.error("Erreur de chargement du modèle 3D !", err));

    camera.lockedTarget = car;
    return car;
}

export function setupInputs() {
    const keys = {};
    const inputState = {
        isDriftMode: false
    };

    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key.toLowerCase() === 'f') {
            inputState.isDriftMode = !inputState.isDriftMode;
        }
        if (e.key === ' ') {
            inputState.isDriftMode = false;
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    return { keys, inputState };
}
