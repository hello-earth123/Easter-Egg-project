export function preloadMonsterAnims(scene) {
    const monsterAnims = [
        {file: 'arrow_skeleton.png'},
        {file: 'bat.png'},
        {file: 'bird.png'},
        {file: 'butterfly.png'},
        {file: 'coffin.png'},
        {file: 'colossus.png'},
        {file: 'dwarf.png'},
        {file: 'eyeball.png'},
        {file: 'eyebat.png'},
        {file: 'fire_skull1.png'},
        {file: 'fire_skull2.png'},
        {file: 'ghost.png'},
        {file: 'lich.png'},
        {file: 'mask.png'},
        {file: 'mimic.png'},
        {file: 'moai-b.png'},
        {file: 'moai-s.png'},
        {file: 'moai-g.png'},
        {file: 'mummy.png'},
        {file: 'mushroom.png'},
        {file: 'rabbit.png'},
        {file: 'reaper.png'},
        {file: 'scorpion.png'},
        {file: 'skeleton.png'},
        {file: 'skull_b.png'},
        {file: 'skull_w.png'},
        {file: 'slime.png'},
        {file: 'snail.png'},
        {file: 'snake.png'},
        {file: 'squirrel.png'},
        {file: 'stingsnake.png'},
        {file: 'vampire.png'},
        {file: 'weapon.png'},
        {file: 'wolf.png'},
        {file: 'hidden.png'},
    ];

    for (const m of monsterAnims) {
        const name = m.file.slice(0, -4);
        if (!scene.scene.manager.keys[name]){
            scene.load.spritesheet(name, `/static/assets/monsters/${m.file}`, {
                frameWidth: 16,
                frameHeight: 16
            });    
        }
    }
}