// SkillBase.js
export class SkillBase {
    constructor(name, baseConfig) {
        this.name = name;            // fireball, flameA 등
        this.base = baseConfig;      // CFG.fireball 같은 설정
        this.level = 1;

        this.onCooldownUntil = 0;
    }

    // ---- 스케일 계산 ----
    scaledDamage(base) {
        return Math.floor(base * (1 + 0.15 * (this.level - 1)));
    }

    scaledCost(base) {
        return Math.floor(base * (1 + 0.10 * (this.level - 1)));
    }

    // ---- MP 체크 ----
    getManaCost() { return this.base.baseCost || 0; }

    canCast(scene) {
        if (!scene?.playerStats) return false;
        if (scene.playerStats.mp < this.getManaCost()) return false;
        return true;
    }

    // ---- 쿨다운 ----
    hasCooldown(scene) {
        return scene.time.now < this.onCooldownUntil;
    }

    startCooldown(scene) {
        this.onCooldownUntil = scene.time.now + (this.base.cd || 0);
    }

    // ---- 캐스팅 호출 ----
    tryCast(scene, caster) {
        if (!this.canCast(scene)) return;

        // 마나 소비
        scene.playerStats.mp -= this.getManaCost();
        scene.textBar = `${this.name} 사용!`;

        this.startCooldown(scene);

        this.cast(scene, caster);
    }

    // 개별 스킬이 override 해야함
    cast(scene, caster) { }
}
