import { scene } from './scene_setup.js';
import { CAR_DIMENSIONS, BOT_DATA } from './config.js';

export function initBots() {
    const bots = [];

    BOT_DATA.forEach((data, index) => {
        const botMesh = BABYLON.MeshBuilder.CreateBox("bot" + index, { 
            width: CAR_DIMENSIONS.width, 
            height: CAR_DIMENSIONS.height, 
            depth: CAR_DIMENSIONS.depth 
        }, scene);
        botMesh.position = new BABYLON.Vector3(data.x, 0.75, data.z);
        botMesh.isVisible = false;

        // Chargement du même modèle hyper réaliste pour les concurrents avec peintures vives
        BABYLON.SceneLoader.ImportMeshAsync("", "./", "bmw_m4.glb", scene).then((result) => {
            const realCarMesh = result.meshes[0];
            realCarMesh.parent = botMesh;
            realCarMesh.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
            realCarMesh.rotationQuaternion = null;
            realCarMesh.rotation.y = 0;
            realCarMesh.position.y = CAR_DIMENSIONS.modelOffsetY;

            result.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.albedoColor = data.color;
                    mesh.material.metallic = 0.9;
                    mesh.material.roughness = 0.1;
                }
            });
        });

        bots.push({ mesh: botMesh, maxSpeed: data.maxSpeed, currentSpeed: 0, colorBase: data.color });
    });

    return bots;
}
