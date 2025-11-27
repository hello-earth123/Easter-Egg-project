// skills/Incendiary.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Incendiary extends FireSkillBase {
  constructor(name, config) {
    super(name, config);
    this.isHoldSkill = true;

    this.active = false;
    this._tickEvent = null;

    this.liveEffects = [];   // 🔥 stop() 시 자연스럽게 종료하도록 fx 저장
  }

  getDamage() {
    return this.scaledDamage(this.base.tickDmg);
  }

  cast(scene, caster) {
    if (this.active) return;

    this.active = true;
    this.scene = scene;
    scene.activeHoldSkill = this.name;

    caster.setVelocity(0, 0);

    const interval = this.base.interval ?? 500;
    this.lastTickAt = 0;

    // 🔥 tick 루프
    this._tickEvent = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => this._tick(scene, caster, interval)
    });

    scene.textBar = `Incendiary (Hold)`;
  }

  /** 매 tick 실행 */
  _tick(scene, caster, interval) {
    if (!this.active) return;

    const now = scene.time.now;
    if (now - this.lastTickAt < interval) return;
    this.lastTickAt = now;

    // 🔥 MP 소모
    const mpCost = this.getManaCost();
    if (scene.playerStats.mp < mpCost) {
      this.stop();
      return;
    }
    scene.playerStats.mp -= mpCost;

    // 🔥 판정 → fx 생성 순으로 진행
    this.doDamage(scene, caster);
    this.doEffect(scene, caster);
  }

  /** 판정 먼저 */
  doDamage(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const radius = this.base.radius ?? 80;
    const dmg = this.getDamage();

    //------------------------------------------------------
    //  🔥 "스프라이트 전체 Hitbox 기반" 직사각형 판정
    //------------------------------------------------------
    scene.damageRectangle({
        originX: ox,
        originY: oy,
        dir,
        width: 96,     // sprite width
        height: 32,    // sprite height
        length: dist,  // 분사 거리
        dmg
    });

    // scene.damageCone({
    //   originX: ox,
    //   originY: oy,
    //   dir,
    //   radius,
    //   angleRad: Math.PI / 2,
    //   dmg,
    //   onHit: () => this.shakeCameraOnHit(scene)
    // });
  }

  /** fx는 방향을 반영해야 함 */
  doEffect(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    // 🔥 이펙트 생성
    const fx = scene.add.sprite(ox, oy, "incendiary");

    // fx 방향 회전
    fx.rotation = Math.atan2(dir.y, dir.x);

    fx.play("incendiary");

    // 자연스러운 종료를 위해 리스트에 저장
    this.liveEffects.push(fx);

    fx.on("animationcomplete", () => {
      const idx = this.liveEffects.indexOf(fx);
      if (idx !== -1) this.liveEffects.splice(idx, 1);
      fx.destroy();
    });
  }

  /** 종료 시 fx는 animationcomplete까지 유지 */
  stop() {
    if (!this.active) return;

    this.active = false;

    if (this._tickEvent) {
      this._tickEvent.remove(false);
      this._tickEvent = null;
    }

    // 🔥 이미 생성된 fx는 자연스럽게 끝나도록 놔둠
    // 즉시 destroy 하지 않음 (애니메이션 끊김 방지)

    if (this.scene) {
      this.scene.activeHoldSkill = null;
    }
  }
}
