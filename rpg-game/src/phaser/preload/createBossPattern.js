export function createBossPattern(scene) {
  const frames = {
    thunder: 5,
    fireshoot: 5,
    batswarm: 2,
  };

  Object.entries(frames).forEach(([key, max]) => {
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: max }),
      frameRate: 18,
      repeat: 300
    });
  });
}