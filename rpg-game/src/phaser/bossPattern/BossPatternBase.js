export class BossPatternBase {
    constructor(name, baseConfig) {
        this.name = name;            // fireball, flameA 등
        this.base = baseConfig;      // CFG.fireball 같은 설정
    }

    getDamage() {
        return this.scaledDamage(this.base.baseDmg || 0);
    }

    // ---- 데미지 계산 ----
    scaledDamage(base) {
        let value = base * 1;   // 체력 % 데미지

        return Math.floor(value);
    }
    
    tryCast(scene, caster) {
        this.cast(scene, caster);
    }

    // 개별 스킬이 override 해야함
    cast(scene, caster) { }
}
