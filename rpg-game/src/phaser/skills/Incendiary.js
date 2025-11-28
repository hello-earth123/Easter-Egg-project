// skills/Incendiary.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class Incendiary extends FireSkillBase {
  constructor(name, config) {
    super(name, config);
    this.isHoldSkill = true;

    this.active = false;
    this._tickEvent = null;

    this.liveEffects = [];
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

    this._tickEvent = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => this._tick(scene, caster, interval)
    });

    scene.textBar = `Incendiary (Hold)`;
  }

  _tick(scene, caster, interval) {
    if (!this.active) return;

    const now = scene.time.now;
    if (now - this.lastTickAt < interval) return;
    this.lastTickAt = now;

    const mpCost = this.getManaCost();
    if (scene.playerStats.mp < mpCost) {
      this.stop();
      return;
    }
    scene.playerStats.mp -= mpCost;

    this.doDamage(scene, caster);
    this.doEffect(scene, caster);
  }

  doDamage(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const radius = this.base.radius ?? 80;
    const dmg = this.getDamage();

    scene.damageRectangle({
      originX: ox,
      originY: oy,
      dir,
      width: 96,
      height: 32,
      length: dist,
      dmg,
    });
  }

  doEffect(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    // 🔥 stream sprite 생성
    const fx = scene.add.sprite(ox, oy, "incendiary");
    fx.setOrigin(0.5);
    fx.setScale(this.base.scale ?? 1.1);

    // 방향 회전
    fx.rotation = Math.atan2(dir.y, dir.x);

    // VFX 적용
    applyVFX(scene, fx, this.base.vfx);

    fx.play("incendiary");

    this.liveEffects.push(fx);

    fx.on("animationcomplete", () => {
      const idx = this.liveEffects.indexOf(fx);
      if (idx !== -1) this.liveEffects.splice(idx, 1);
      fx.destroy();
    });
  }

  stop() {
    if (!this.active) return;

    this.active = false;

    if (this._tickEvent) {
      this._tickEvent.remove(false);
      this._tickEvent = null;
    }

    if (this.scene) {
      this.scene.activeHoldSkill = null;
    }
  }
}
