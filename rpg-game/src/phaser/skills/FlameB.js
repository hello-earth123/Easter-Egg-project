// skills/FlameB.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FlameB extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const baseDist = this.base.distance;

    // 두 개의 기둥 위치
    const positions = [
      { x: caster.x + dir.x * baseDist,     y: caster.y + dir.y * baseDist },
      { x: caster.x + dir.x * baseDist * 2, y: caster.y + dir.y * baseDist * 2 },
    ];

    this.shakeCameraOnHit(scene);

    positions.forEach((p, index) => {
      // 첫 기둥은 flameA / 두 번째는 flameB
      const fx = scene.add.sprite(p.x, p.y, index === 0 ? "flameA" : "flameB");
      fx.play(index === 0 ? "flameA" : "flameB");
      fx.on("animationcomplete", () => fx.destroy());

      // ★ 각 기둥 위치별 개별 데미지 판정
      scene.damageArea({
        x: p.x,
        y: p.y,
        radius: this.base.radius,
        dmg: this.getDamage(),
      });

      // ★ 각 기둥 위치별 DOT
      scene.applyDotArea({
        x: p.x,
        y: p.y,
        radius: this.base.radius,
        tickDmg: this.base.tickDmg,
        duration: this.base.duration
      });
    });

    scene.textBar = `Flame B (Lv${this.level})`;
  }
}
