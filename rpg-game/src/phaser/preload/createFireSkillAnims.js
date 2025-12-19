// preload/createFireSkillAnims.js
export function createFireSkillAnims(scene) {
  const frames = {
    fireball: 7, buff: 14,
    flameA: 5, flameB: 5, flameC: 5,
    firebomb: 15, incendiary: 9,
    meteor_S: 10, meteor_M: 10, meteor_L: 10,
    napalm: 9, napalm_flame: 8,deathhand:20,
  };

  Object.entries(frames).forEach(([key, max]) => {
    if (!scene.scene.manager.keys[key]){
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(key, { start: 0, end: max }),
        frameRate: 18,
        repeat: 0
      });
    }
  });
}
