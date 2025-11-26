// FireSkillBase.js
import { SkillBase } from "./SkillBase.js";

export class FireSkillBase extends SkillBase {
    constructor(name, baseConfig) {
        super(name, baseConfig);
    }

    /** 플레이어가 바라보는 방향 반환 (정규화된 벡터) */
    getDir(caster) {
        if (!caster || !caster.facing) {
            return new Phaser.Math.Vector2(1, 0); // fallback (오른쪽)
        }
        return new Phaser.Math.Vector2(caster.facing.x, caster.facing.y).normalize();
    }

    getDamage() {
        return this.scaledDamage(this.base.baseDmg || 0);
    }

    getManaCost() {
        return this.scaledCost(this.base.baseCost || 0);
    }

    shakeCameraOnHit(scene) {
        scene.cameras.main.shake(120, 0.01);
    }
}
