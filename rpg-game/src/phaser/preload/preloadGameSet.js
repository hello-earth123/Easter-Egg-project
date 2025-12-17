export function preloadGameSet(scene) {
    // 포탈 PNG 로드
    scene.load.spritesheet("portal", "/static/assets/portal.png", {
        frameWidth: 102.1428,   // 포탈 프레임 최대 가로(당신이 원하는 값으로 맞추기)
        frameHeight: 120,  // 프레임 높이(실제 png 높이에 맞추기)
    });

    // 플레이어 PNG 로드
    scene.load.spritesheet("playerSheet", "/static/assets/player.png", {
        frameWidth: 36,
        frameHeight: 24,
    });
    
    // 사망 시 나오는 gameover 이미지
    scene.load.image("gameover", "/static/assets/gameover.png");

    const itemList = ['hpPotion', 'mpPotion', 'damageGemLow', 'damageGemMid', 'damageGemHigh', 'damageGemSuper', 'cooldownGemLow', 'cooldownGemMid', 'cooldownGemHigh', 'cooldownGemSuper', 'manaCostGemLow', 'manaCostGemMid', 'manaCostGemHigh', 'manaCostGemSuper', 'defenseGemLow', 'defenseGemMid', 'defenseGemHigh', 'defenseGemSuper', 'luckGemLow', 'luckGemMid', 'luckGemHigh', 'luckGemSuper'];
    for (const key of itemList) {
        if (!scene.scene.manager.keys[key]){
            scene.load.image(key, `static/assets/${key}.png`)
        }
    }
}