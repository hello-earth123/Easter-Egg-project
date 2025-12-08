import { BossPatternBase } from "./BossPatternBase";

export class Thunder extends BossPatternBase {
  cast(scene, caster) {
    const sx = scene.player.x;
    const sy = scene.player.y;
    // 예고 이펙트 추가

    scene.time.delayedCall(500, () => {
        const b = scene.pattern.create(sx, sy, "thunder");
        b.setOrigin(0.5);

        const scale = this.base.scale ?? 1.0;
        b.setScale(scale);

        b.play("thunder");
        b.damage = this.getDamage();

        scene.time.delayedCall(300, () => {
        if (b && b.active) b.destroy();
        });
    })
  }
}