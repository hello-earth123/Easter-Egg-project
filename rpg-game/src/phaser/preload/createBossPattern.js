export function createBossPattern(scene) {
  const frames = {
    path: 3,
    thunder: 5,
    fireshoot: 5,
    batswarm: 2,
    windAoe: 5,
    void: 5,
  };

  Object.entries(frames).forEach(([key, max]) => {
    if (!scene.anims.exists(key)){
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(key, { start: 0, end: max }),
        frameRate: 18,
        repeat: 300
      });
    }
  });
}