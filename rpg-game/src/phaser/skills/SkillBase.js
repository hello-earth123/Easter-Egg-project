// SkillBase.js
export class SkillBase {
    constructor(name, baseConfig) {
        this.name = name;            // fireball, flameA 등
        this.base = baseConfig;      // CFG.fireball 같은 설정
        this.level = 1;
        this.isHoldSkill = false;
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
    
    tryCast(scene, caster) {

        // 1) 쿨타임 검사 추가
        if (this.hasCooldown(scene)) {
            // 쿨타임 중이면 스킬 발동 불가
            scene.textBar = `${this.name} 재사용 대기중`;
            return;
        }

        // 2) MP 검사
        if (!this.canCast(scene)) return;

        // 3) 마나 소비
        scene.playerStats.mp -= this.getManaCost();
        scene.textBar = `${this.name} 사용!`;

        // 4) 쿨타임 시작
        this.startCooldown(scene);

        // 5) 스킬 실제 발동
        this.cast(scene, caster);
    }

    // 개별 스킬이 override 해야함
    cast(scene, caster) { }
}
