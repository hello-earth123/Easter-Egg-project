// skills/Napalm.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Napalm extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 150;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    // 🔥 초기 폭발 애니메이션
    const boom = scene.add.sprite(ox, oy, "napalm");
    boom.play("napalm");
    boom.once("animationcomplete", () => boom.destroy());

    const radius = this.base.radius;
    const tickDmg = this.base.tickDmg;
    const duration = this.base.duration;
    const interval = this.base.interval ?? 450;

    // 🔥 즉발 데미지
    scene.damageArea({
      x: ox,
      y: oy,
      radius,
      dmg: this.getDamage(),
      onHit: () => this.shakeCameraOnHit(scene)
    });

    // 🔥 napalm 불길 반복 sprite
    const flame = scene.add.sprite(ox, oy, "napalm_flame");
    flame.play("napalm_flame_loop");   // 반복되는 불길 애니메이션

    // 지속시간 끝나면 제거
    scene.time.delayedCall(duration, () => {
      flame.destroy();
    });

    // 🔥 지속 데미지 loop
    const ticks = Math.floor(duration / interval);
    for (let i = 1; i <= ticks; i++) {
      scene.time.delayedCall(i * interval, () => {
        scene.damageArea({
          x: ox,
          y: oy,
          radius,
          dmg: tickDmg,
          onHit: () => this.shakeCameraOnHit(scene)
        });
      });
    }

    scene.textBar = `Napalm (Lv${this.level})`;
  }
}
