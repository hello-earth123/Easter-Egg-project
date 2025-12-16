export function preloadSound(scene) {
    const monsterAnims = [
        {file: 'monster_hit.wav'},
        {file: 'monster_attack.wav'},
        {file: 'footstep.wav'},
        {file: 'monsterDeath.wav'},
        {file: 'dash.wav'},
        {file: 'portal.wav'},
        {file: 'player_death.wav'},
        {file: 'item_drop.wav'},
        {file: 'item_pickup.wav'},
        {file: 'item_use.wav'},
        {file: 'level_up.wav'},
        {file: 'stat_increase.wav'},
        {file: 'ui_open.wav'},
        {file: 'ui_close.wav'},
        {file: 'ui_click.wav'},
        {file: 'skill_fireball.wav'},
        {file: 'skill_buff.wav'},
        {file: 'skill_flameA.wav'},
        {file: 'skill_flameB.wav'},
        {file: 'skill_flameC.wav'},
        {file: 'skill_firebomb.wav'},
        {file: 'skill_incendiary.wav'},
        {file: 'skill_meteor_S.wav'},
        {file: 'skill_meteor_M.wav'},
        {file: 'skill_meteor_L.wav'},
        {file: 'skill_napalm.wav'},
        {file: 'skill_deathhand.wav'},
    ];

    for (const m of monsterAnims) {
        const name = m.file.slice(0, -4);
        if (!scene.scene.manager.keys[name]){
            scene.load.audio(name, `/static/assets/sound/effects/${m.file}`, {
                frameWidth: 16,
                frameHeight: 16
            });    
        }
    }
}
