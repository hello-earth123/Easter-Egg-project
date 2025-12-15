export function preloadBossPattern(scene) {

    const bossPattern = [
        {key: 'path', file: 'path.png', w:16, h:16},
        {key: 'thunder', file: 'thunder.png', w: 64, h: 64},
        {key: 'fireshoot', file: 'fireshoot.png', w: 64, h: 64},
        {key: 'batswarm', file: 'batswarm.png', w: 16, h: 16},
        {key: 'windAoe', file: 'wind.png', w: 64, h: 64},
        {key: 'void', file: 'void.png', w: 64, h: 64},
    ];

    for (const b of bossPattern) {
        scene.load.spritesheet(b.key, `/static/assets/pattern/${b.file}`, {
            frameWidth: b.w,
            frameHeight: b.h
        });
    }
}