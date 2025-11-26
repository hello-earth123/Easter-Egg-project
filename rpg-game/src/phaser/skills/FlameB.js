// skills/FlameB.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FlameB extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const baseDist = this.base.distance;

    const positions = [
      { x: caster.x + dir.x * baseDist,     y: caster.y + dir.y * baseDist },
      { x: caster.x + dir.x * baseDist * 2, y: caster.y + dir.y * baseDist * 2 },
    ];

    positions.forEach((p, index) => {
      const fx = scene.add.sprite(p.x, p.y, index === 0 ? "flameA" : "flameB");
      fx.play(index === 0 ? "flameA" : "flameB");

      fx.on("animationcomplete", () => fx.destroy());

      scene.applyDotArea({
        x: p.x, y: p.y,
        radius: this.base.radius,
        tickDmg: this.base.tickDmg,
        duration: this.base.duration
      });
    });

    scene.textBar = `Flame B (Lv${this.level})`;
  }
}