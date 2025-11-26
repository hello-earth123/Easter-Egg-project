// skills/FlameC.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FlameC extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    // 전방 오프셋
    const cx = caster.x + dir.x * this.base.distance * 2;
    const cy = caster.y + dir.y * this.base.distance * 2;

    // 🔥 4방향 벡터
    const dirs = [
      { x: 1, y: 0 },   // 오른쪽
      { x: -1, y: 0 },  // 왼쪽
      { x: 0, y: 1 },   // 아래
      { x: 0, y: -1 }   // 위
    ];
    this.shakeCameraOnHit(scene);

    dirs.forEach(d => {
      const tx = cx + d.x * this.base.distance;
      const ty = cy + d.y * this.base.distance;

      const fx = scene.add.sprite(tx, ty, "flameC").play("flameC");
      fx.on("animationcomplete", () => fx.destroy());
      
      scene.damageArea({
        x: tx,
        y: ty,
        radius: this.base.radius,
        dmg: this.getDamage(),
      });

      scene.applyDotArea({
        x: tx,
        y: ty,
        radius: this.base.radius,
        tickDmg: this.base.tickDmg,
        duration: this.base.duration,
      });
    });
  }

}
