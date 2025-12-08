export class BossSkillBase {
    constructor(name, baseConfig) {
        this.name = name;            // fireball, flameA 등
        this.base = baseConfig;      // CFG.fireball 같은 설정
    }

    // ---- 스케일 계산 ----
    scaledDamage(base) {
    // 1) 스킬 레벨 기반 성장
    const perLevel = this.base?.dmgScale ?? 0.15;
    const levelScaleSkill = 1 + perLevel * (this.level - 1);

    const stats = this.lastScene?.playerStats;

    // 🔹 플레이어의 baseDamage(무기/레벨 성장)을 base에 더해줌
    const baseWeaponDamage = stats?.baseDamage || 0;

    // 👉 "스킬 기본 데미지 + 무기/레벨 기반 데미지" 를 합쳐서 스킬 레벨 보정
    let value = (base + baseWeaponDamage) * levelScaleSkill;

    if (stats) {
        // 2) 버튼/젬으로 찍는 damage 스탯
        const damageStat =
        (stats.damage || 0) +
        (stats.damageGem || 0);

        const damageScale = 1 + damageStat * 0.02;

        // 3) 플레이어 레벨 보정 (이미 넣어놨다면 유지)
        const playerLevel = stats.level || 1;
        const levelScalePlayer = 1 + Math.max(0, playerLevel - 1) * 0.03;

        value *= damageScale * levelScalePlayer;
    }

    return Math.floor(value);
    }


    scaledCost(base) {
        // 스킬 레벨에 따른 성장 (스킬 개별 costScale 사용)
        const perLevel = this.base?.costScale ?? 0.1;
        const levelScale = 1 + perLevel * (this.level - 1);

        let value = base * levelScale;

        // 플레이어 스탯 / Gem 반영
        const stats = this.lastScene?.playerStats;
        if (stats) {
            const manaStat =
                (stats.manaCost || 0) +
                (stats.manaCostGem || 0);

            // manaCost 1 당 1% 감소, 최소 30%까지만 감소
            const reduceScale = Math.max(0.3, 1 - manaStat * 0.01);
            value *= reduceScale;
        }

        value = Math.floor(value);
        return value < 1 ? 1 : value; // 최소 1
    }

    // ---- MP 체크 ----
    getManaCost() {
        // FireSkillBase에서 override 하더라도, 내부는 scaledCost 사용
        return this.scaledCost(this.base.baseCost || 0);
    }

    canCast(scene) {
        if (!scene?.playerStats) return false;
        // tryCast()에서 this.lastScene를 먼저 세팅해주기 때문에
        // 여기서 getManaCost() 호출 시 스탯 반영 가능
        const cost = this.getManaCost();
        if (scene.playerStats.mp < cost) return false;
        return true;
    }

    // ---- 쿨다운 ----
    hasCooldown(scene) {
        return scene.time.now < this.onCooldownUntil;
    }

    startCooldown(scene) {
        // base.cd는 ms 단위 (Config.js에서 fireball cd: 2000 이런 식)
        let cd = this.base.cd || 0;

        const stats = scene?.playerStats;
        if (stats) {
            const cooldownStat =
                (stats.cooldown || 0) +
                (stats.cooldownGem || 0);

            // cooldown 1당 1.5% 감소, 최소 40%
            const reduceScale = Math.max(0.4, 1 - cooldownStat * 0.015);
            cd = Math.floor(cd * reduceScale); // 여전히 ms
        }

        // 🔥 Vue / TestScene2와 연동되는 필드들
        this.cooldown  = cd / 1000;        // 초 단위 → Vue에서 *1000
        this.lastCastAt = scene.time.now;  // TestScene2에서 성공 판정용

        // 숫자 쿨타임 / hasCooldown용 ms 단위
        this.onCooldownUntil = scene.time.now + cd;
    }
    
    tryCast(scene, caster) {

        // 🔥 여기서 마지막 scene 기억 → scaledDamage/Cost 에서 사용
        this.lastScene = scene;

        // 임시 - 보스 테스트용
        if (caster.name == 'coffin') this.cast(scene, caster);

        // 1) 쿨타임 검사
        if (this.hasCooldown(scene)) {
            scene.textBar = `${this.name} 재사용 대기중`;
            return;
        }

        // 2) MP 검사
        if (!this.canCast(scene)) return;

        // 3) 마나 소비 (스탯/젬 반영된 최종 cost 사용)
        const cost = this.getManaCost();
        scene.playerStats.mp -= cost;
        scene.textBar = `${this.name} 사용!`;

        // 4) 쿨타임 시작 (쿨감 스탯 반영)
        this.startCooldown(scene);

        // 5) 스킬 실제 발동
        this.cast(scene, caster);
    }

    // 개별 스킬이 override 해야함
    cast(scene, caster) { }
}
