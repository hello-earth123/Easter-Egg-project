export function createBossPattern(scene) {
  const frames = {
    thunder: 6,
  };

  Object.entries(frames).forEach(([key, max]) => {
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: max }),
      frameRate: 18,
      repeat: 0
    });
  });
}