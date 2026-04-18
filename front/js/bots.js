import { scene } from './scene_setup.js';
import { CAR_DIMENSIONS, BOT_DATA } from './config.js';

export function initBots() {
    const bots = [];

    // Créer les boîtes de collision en premier
    BOT_DATA.forEach((data, index) => {
        const botMesh = BABYLON.MeshBuilder.CreateBox("bot" + index, {
            width: CAR_DIMENSIONS.width,
            height: CAR_DIMENSIONS.height,
            depth: CAR_DIMENSIONS.depth
        }, scene);
        botMesh.position = new BABYLON.Vector3(data.x, 0.75, data.z);
        botMesh.isVisible = false;
        bots.push({
            mesh: botMesh,
            maxSpeed: data.maxSpeed,
            currentSpeed: 0,
            colorBase: data.color,
            boostTimer: 0,
            boostCooldown: Math.floor(Math.random() * 180) + 120, // Démarrage décalé entre bots
            wobble: Math.random() * Math.PI * 2,                  // Phase de trajectoire aléatoire
            laneOffset: data.x,                                   // Cible la ligne de départ de config.js
            shadow: createBotShadow(botMesh, scene)
        });
    });

    function createBotShadow(mesh, scene) {
        const shadow = BABYLON.MeshBuilder.CreatePlane("botShadow", { width: 3.5, height: 6 }, scene);
        shadow.rotation.x = Math.PI / 2;
        shadow.isPickable = false;
        const shadowMat = new BABYLON.StandardMaterial("botShadowMat", scene);
        const dynamicTexture = new BABYLON.DynamicTexture("botShadowTex", 64, scene);
        const context = dynamicTexture.getContext();
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(0,0,0,0.7)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        dynamicTexture.update();
        shadowMat.diffuseTexture = dynamicTexture;
        shadowMat.useAlphaFromDiffuseTexture = true;
        shadowMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadow.material = shadowMat;
        return shadow;
    }


    // Charger le modèle BMW M4 UNE SEULE FOIS, puis instancier pour chaque bot
    BABYLON.SceneLoader.LoadAssetContainerAsync("", "bmw_m4.glb", scene).then(container => {
        BOT_DATA.forEach((data, index) => {
            const entries = container.instantiateModelsToScene(
                name => `bot${index}_${name}`,
                false
            );

            const rootNode = entries.rootNodes[0];
            rootNode.parent = bots[index].mesh;
            rootNode.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
            rootNode.rotationQuaternion = null;
            rootNode.rotation.y = 0;
            rootNode.position.y = CAR_DIMENSIONS.modelOffsetY;

            // Appliquer la couleur unique à chaque bot
            rootNode.getChildMeshes().forEach(mesh => {
                if (mesh.material) {
                    const mat = mesh.material.clone(`botMat${index}_${mesh.name}`);
                    mat.albedoColor = data.color;
                    mat.metallic = 0.9;
                    mat.roughness = 0.1;
                    mesh.material = mat;
                }
            });
        });
    });

    return bots;
}
