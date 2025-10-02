import Phaser from "phaser";

// 이펙트: shockwave / lightning / hit flash
// 텍스처가 없으면 안전한 대체 그래픽으로 표시

export function spawnShockwave(scene, x, y, radius, dmg) {
  if (scene.textures.exists("shockwave")) {
    const img = scene.add.image(x, y, "shockwave").setScale(1).setAlpha(0.9);
    scene.tweens.add({
      targets: img,
      scale: 1.6,
      alpha: 0.0,
      duration: 240,
      onComplete: () => img.destroy(),
    });
  } else {
    const g = scene.add.circle(x, y, 6, 0x88e0ff, 0.9);
    scene.tweens.add({
      targets: g,
      radius,
      alpha: 0.0,
      duration: 240,
      onComplete: () => g.destroy(),
    });
  }

  // 🔒 안전 판정: Phaser.Math.Distance.Between 사용
  const mons = scene.monsters.getChildren().slice(); // 방어적 복사
  for (const m of mons) {
    if (!m || !m.active) continue;
    const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
    if (dist <= radius) {
      m.hp -= dmg;
      spawnHitFlash(scene, m.x, m.y);
      scene.onMonsterAggro(m);
    }
  }
  scene.cameras.main.shake(120, 0.01);
}

export function spawnLightning(scene, x, y, radius, dmg) {
  if (scene.textures.exists("lightning")) {
    const img = scene.add.image(x, y, "lightning").setScale(1.1).setAlpha(0.95);
    scene.tweens.add({
      targets: img,
      alpha: 0.0,
      duration: 260,
      onComplete: () => img.destroy(),
    });
  } else {
    const line = scene.add.rectangle(x, y - 160, 4, 160, 0xeeeeff, 0.9);
    const boom = scene.add.circle(x, y, 8, 0xffffaa, 0.9);
    scene.tweens.add({ targets: line, y: y, duration: 120, onComplete: () => line.destroy() });
    scene.tweens.add({ targets: boom, radius: radius, alpha: 0.0, duration: 240, onComplete: () => boom.destroy() });
  }

  // 🔒 안전 판정: Phaser.Math.Distance.Between 사용
  const mons = scene.monsters.getChildren().slice(); // 방어적 복사
  for (const m of mons) {
    if (!m || !m.active) continue;
    const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
    if (dist <= radius) {
      m.hp -= dmg;
      spawnHitFlash(scene, m.x, m.y);
      scene.onMonsterAggro(m);
    }
  }
  scene.cameras.main.shake(140, 0.012);
}

export function spawnHitFlash(scene, x, y) {
  const c = scene.add.circle(x, y, 6, 0xffdd88, 0.9);
  scene.time.delayedCall(130, () => c.destroy());
}
