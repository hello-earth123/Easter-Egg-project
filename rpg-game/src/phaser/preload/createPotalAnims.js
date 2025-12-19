export function createPotalAnims(scene) {
    if (!scene.anims.exists("portal-anim")){
        scene.anims.create({
            key: "portal-anim",
            frames: scene.anims.generateFrameNumbers("portal", { start: 0, end: 6 }),
            frameRate: 12,
            repeat: -1
        });
    }
}
