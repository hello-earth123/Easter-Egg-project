export function preloadBossPattern(scene) {

    const bossPattern = [
        {key: 'thunder', file: 'thunder.png', w: 64, h: 64},
    ];

    for (const b of bossPattern) {
        scene.load.spritesheet(b.key, `/static/assets/pattern/${b.file}`, {
            frameWidth: b.w,
            frameHeight: b.h
        });
    }
}