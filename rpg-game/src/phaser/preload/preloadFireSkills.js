// preloadFireSkills.js
export function preloadFireSkillAssets(scene) {

    const skillSheets = [
        { key: "fireball", file: "fireball.png", w: 16, h: 16 },
        { key: "buff", file: "buff.png", w: 64, h: 48 },
        { key: "flameA", file: "flameA.png", w: 32, h: 48 },
        { key: "flameB", file: "flameB.png", w: 48, h: 48 },
        { key: "flameC", file: "flameC.png", w: 80, h: 48 },
        { key: "firebomb", file: "firebomb.png", w: 96, h: 48 },
        { key: "incendiary", file: "incendiary.png", w: 96, h: 32 },
        { key: "meteor_S", file: "meteor_S.png", w: 32, h: 32 },
        { key: "meteor_M", file: "meteor_M.png", w: 32, h: 32 },
        { key: "meteor_L", file: "meteor_L.png", w: 32, h: 32 },
        { key: "napalm", file: "napalm.png", w: 128, h: 32 },
        { key: "deathhand", file: "deathhand.png", w: 144, h: 80 },
        { key: "napalm_flame", file: "napalm_flame.png", w: 128, h: 32 },

    ];

    for (const s of skillSheets) {
        scene.load.spritesheet(s.key, `/static/assets/${s.file}`, {
            frameWidth: s.w,
            frameHeight: s.h
        });
    }
}