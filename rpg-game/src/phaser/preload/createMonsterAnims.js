export function createMonsterAnims(scene) {
    const frames = {
        arrow_skeleton_walk: 5,
        bat_walk: 2,
        bird_walk: 7,
        butterfly_walk: 2,
        coffin_walk: 0, // 10
        colossus_walk: 6,
        dwarf_walk: 7,
        eyeball_walk: 14,
        eyebat_walk: 5,
        fire_skull1_walk: 3,
        fire_skull2_walk: 3,
        ghost_walk: 7,
        lich_walk: 7,
        mask_walk: 3,
        mimic_walk: 9,
        mummy_walk: 9,
        mushroom_walk: 3,
        rabbit_walk: 6,
        reaper_walk: 5,
        scorpion_walk: 5,
        skeleton_walk: 8,
        skull_b_walk: 12,
        skull_w_walk: 12,
        slime_walk: 15,
        snail_walk: 11,
        snake_walk: 4,
        squirrel_walk: 5,
        stingsnake_walk: 4,
        vampire_walk: 11,
        weapon_walk: 5,
        wolf_walk: 3,
    };

    Object.entries(frames).forEach(([key, max]) => {
        if (!scene.anims.exists(key)){
        const name = key.slice(0, -5);
        scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(name, { start: 0, end: max }),
            frameRate: 8,
            repeat: -1,
        });
        }
    });

    if (!scene.anims.exists("moai-b_walk")){
        scene.anims.create({
            key: "moai-b_walk",
            frames: scene.anims.generateFrameNumbers("moai-b", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
    }

    if (!scene.anims.exists("moai-s_walk")){
        scene.anims.create({
            key: "moai-s_walk",
            frames: scene.anims.generateFrameNumbers("moai-s", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
    }

    if (!scene.anims.exists("moai-g_walk")){
        scene.anims.create({
            key: "moai-g_walk",
            frames: scene.anims.generateFrameNumbers("moai-g", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
    }
}