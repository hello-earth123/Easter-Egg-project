import { BossPatternBase } from "./BossPatternBase";

export class Thunder extends BossPatternBase {
  cast(scene, caster) {
    const sx = scene.player.x;
    const sy = scene.player.y;

    // 예고 이펙트
    const radius = 9;
    const g = scene.add.circle(sx, sy, 6, 0x6ed953, 0.9);
    g.setScale(1);
    scene.tweens.add({
      targets: g,
      scale: radius,
      alpha: 0.0,
      duration: 500,
      onComplete: () => g.destroy(),
    });

    // 실 패턴 사용
    scene.time.delayedCall(600, () => {
      const b = scene.pattern.create(sx, sy, "thunder");
      b.setOrigin(0.5);

      const scale = this.base.scale ?? 1.0;
      b.setScale(scale);

      b.play("thunder");
      b.damage = this.getDamage();

      scene.time.delayedCall(300, () => {
        if (b && b.active) b.destroy();
      });
      caster.isAttack = false;
    })
  }
}