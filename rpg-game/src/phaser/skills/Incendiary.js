// skills/Incendiary.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Incendiary extends FireSkillBase {
  // FireSkillBase 에서 key 를 "incendiary" 로 넘겨주기 위해
  constructor(level = 1) {
    super("incendiary", level);
  }

  cast(scene, caster) {
    const base = this.base;

    // 캐릭터가 바라보는 방향
    const dir = this.getDir(caster); // { x, y } 단위 벡터

    // 캐릭터 기준 전방 지점
    const originX = caster.x + dir.x * base.distance;
    const originY = caster.y + dir.y * base.distance;

    const angleRad =
      (typeof base.angle === "number" ? base.angle : 70) * (Math.PI / 180);

    scene.damageCone({
        x: caster.x,
        y: caster.y,
        dir: dir,
        distance: this.base.distance,
        radius: this.base.radius,
        dmg: this.base.tickDmg,
     });


    // 시각 효과
    const fx = scene.add.sprite(originX, originY, "incendiary");
    fx.play("incendiary");
    // 방향에 맞게 회전
    fx.rotation = Math.atan2(dir.y, dir.x);

    // 일정 시간 동안 틱마다 원뿔 데미지
    const tickInterval = base.interval;
    const duration = base.duration;
    const totalTicks = Math.max(1, Math.floor(duration / tickInterval));

    for (let i = 0; i < totalTicks; i++) {
      scene.time.delayedCall(tickInterval * i, () => {
        scene.damageCone({
          originX,
          originY,
          dir,
          radius: base.radius,
          angleRad,
          dmg: base.tickDmg,
        });
      });
    }

    fx.on("animationcomplete", () => fx.destroy());

    scene.textBar = `Incendiary (Lv${this.level})`;
  }
}
