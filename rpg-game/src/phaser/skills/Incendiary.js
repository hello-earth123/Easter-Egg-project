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

  getDamage(level) {
    return this.scaledDamage(this.base.tickDmg, level);
  }

  cast(scene, caster, level) {
    if (this.active) return;

    this.active = true;
    this.scene = scene;
    scene.activeHoldSkill = this.name;

    caster.setVelocity(0, 0);

    const interval = this.base.interval ?? 150;
    this.lastTickAt = 0;

    this._tickEvent = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => this._tick(scene, caster, interval, level)
    });

    scene.textBar = `Incendiary (Hold)`;
  }

  _tick(scene, caster, interval, level) {
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

    this.doDamage(scene, caster, level);
    this.doEffect(scene, caster);
  }

  // =========================================================
  //  4방향 정규화 (velocity 우선, 없으면 facing 사용)
  // =========================================================
  _getDirectionState(caster) {
    let vx = 0, vy = 0;

    if (caster.body && caster.body.velocity) {
      vx = caster.body.velocity.x;
      vy = caster.body.velocity.y;
    }

    // 거의 멈춘 상태면 facing(또는 기본 오른쪽) 사용
    if (Math.abs(vx) < 1 && Math.abs(vy) < 1) {
      const f = caster.facing || { x: 1, y: 0 };
      const fx = f.x || 0;
      const fy = f.y || 0;

      if (Math.abs(fx) >= Math.abs(fy)) {
        return fx >= 0 ? "right" : "left";
      } else {
        return fy >= 0 ? "down" : "up";
      }
    }

    // 움직이는 중이면 velocity로 방향 판단
    if (Math.abs(vx) >= Math.abs(vy)) {
      return vx >= 0 ? "right" : "left";
    } else {
      return vy >= 0 ? "down" : "up";
    }
  }

  _getDirVector(direction) {
    switch (direction) {
      case "right": return { x: 1, y: 0 };
      case "left": return { x: -1, y: 0 };
      case "up": return { x: 0, y: -1 };
      case "down": return { x: 0, y: 1 };
      default: return { x: 1, y: 0 };
    }
  }

  // =========================================================
  // 데미지 판정
  // =========================================================
  doDamage(scene, caster, level) {
    const direction = this._getDirectionState(caster);
    const dir = this._getDirVector(direction);

    const dist = this.base.distance ?? 130;

    // 중심점 (캐릭터에서 dir 방향으로 dist만큼)
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const width = this.getScaledSize(96);
    const height = this.getScaledSize(32);

    scene.damageRectangle({
      originX: ox,
      originY: oy,
      dir,            // ← 여기서도 같은 dir 사용
      width,
      height,
      length: dist,
      dmg: this.getDamage(level),
    });
  }

  // =========================================================
  // FX 생성 (flip + 회전 모두 적용)
  // =========================================================
  doEffect(scene, caster) {
    const direction = this._getDirectionState(caster);
    const dir = this._getDirVector(direction);

    const dist = this.base.distance ?? 130;

    // FX도 동일한 dir 기준으로 앞에 생성
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const fx = scene.add.sprite(ox, oy, "incendiary");
    fx.setOrigin(0.5);
    fx.setScale(this.base.scale ?? 1.1);

    // 방향별 sprite 처리
    switch (direction) {
      case "right":
        fx.flipX = false;
        fx.rotation = 0;
        break;

      case "left":
        fx.flipX = true;
        fx.rotation = 0;                // flipX로 좌우 뒤집기
        break;

      case "up":
        fx.flipX = false;
        fx.rotation = -Math.PI / 2;     // 반시계 90도
        break;

      case "down":
        fx.flipX = false;
        fx.rotation = Math.PI / 2;      // 시계 90도
        break;
    }

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
