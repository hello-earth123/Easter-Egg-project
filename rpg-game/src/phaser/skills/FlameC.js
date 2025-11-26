// skills/FlameC.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FlameC extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const cx = caster.x + dir.x * this.base.distance;
    const cy = caster.y + dir.y * this.base.distance;

    const off = this.base.spread;

    const positions = [
      { x: cx,     y: cy     },
      { x: cx+off, y: cy     },
      { x: cx-off, y: cy     },
      { x: cx,     y: cy+off },
      { x: cx,     y: cy-off },
    ];

    positions.forEach(p => {
      const fx = scene.add.sprite(p.x, p.y, "flameC").play("flameC");
      fx.on("animationcomplete", () => fx.destroy());

      scene.applyDotArea({
        x: p.x, y: p.y,
        radius: this.base.radius,
        tickDmg: this.base.tickDmg,
        duration: this.base.duration,
      });
    });

    scene.textBar = `Flame C (Lv${this.level})`;
  }
}