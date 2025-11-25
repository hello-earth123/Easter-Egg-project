/** 공용 설정과 경험치 계산식 - TODO */
export const CFG = {
  // 월드 크기
  world: { width: 1600, height: 1200 },

  // 이동속도
  moveSpeed: 200,

  // 대쉬 설정
  dash: {
    doubleTapWindowMs: 200, // 0.2초 내 추가 입력
    cooldownMs: 1500, // 쿨타임 1.5초
    distance: 250,
    durationMs: 220,
    cameraFlash: { duration: 80, r: 120, g: 120, b: 255 },
  },

  // 플레이어 넉백 설정
  playerKB: {
    power: 700,
    decay: 0.9,
    stopSpeed: 10,
    invulMs: 1000,
    shake: { duration: 250, intensity: 0.02 },
  },

  // 몬스터 넉백 설정
  monsterKB: {
    power: 440,
    decay: 0.86,
    stopSpeed: 10,
  },

  // 경험치 설정
  expCurve: {
    base: 100,
    growth: 1.5, // nextExp(level) = floor(base * level^growth)
  },

  // 스킬 레벨 당 성장치
  skillScaling: {
    dmgPerLevel: 0.15,
    costPerLevel: 0.1,
  },

  // 스킬 별 설정
  skillBase: {
    projectile: { speed: 550, baseDmg: 30, baseCost: 10, cd: 800 },
    cone: {
      count: 5,
      spreadDeg: 50,
      speed: 420,
      baseDmg: 18,
      baseCost: 12,
      cd: 1800,
    },
    weak: { speed: 380, baseDmg: 12, baseCost: 6, cd: 700 },
    shockwave: { radius: 140, baseDmg: 35, baseCost: 16, cd: 3000 },
    projWave: { radius: 140, baseDmg: 28, baseCost: 10, cd: 1200, projDmg: 15 },
    lightning: { radius: 120, baseDmg: 60, baseCost: 20, cd: 4000, range: 220 },
    dot: {
      projSpeed: 400,
      hitDmg: 10,
      tickDmg: 5,
      duration: 3000,
      interval: 1000,
      baseCost: 14,
      cd: 2500,
    },
    freeze: {
      projSpeed: 400,
      hitDmg: 8,
      freezeMs: 2000,
      baseCost: 14,
      cd: 2500,
    },
    knockback: {
      projSpeed: 450,
      hitDmg: 15,
      kbPower: 420,
      baseCost: 12,
      cd: 1400,
    },
  },

  // 몬스터 별 설정 - TODO: 동일한 몬스터 스폰량 수정
  monsters: [
    {
      key: "slime",
      name: "Slime",
      baseHp: 40,
      hpExp: 1.1,
      baseAtk: 4,
      atkExp: 1.05,
      expBase: 8,
      expExp: 1.0,
      minLevel: 1,
      maxLevel: 2,
      count: 5, // 최대 몬스터 스폰 수
      dropTable: [
        { id: "potion_hp", name: "HP Potion", chance: 45 },
        { id: "gold_coin", name: "Gold Coin", chance: 80 },
      ],
    },
    {
      key: "orc",
      name: "Orc",
      baseHp: 90,
      hpExp: 1.18,
      baseAtk: 12,
      atkExp: 1.1,
      expBase: 18,
      expExp: 1.08,
      minLevel: 2,
      maxLevel: 4,
      count: 4,
      dropTable: [
        { id: "mana_pot", name: "MP Potion", chance: 30 },
        { id: "gold_coin", name: "Gold Coin", chance: 90 },
      ],
    },
    {
      key: "dragonling",
      name: "Dragonling",
      baseHp: 220,
      hpExp: 1.25,
      baseAtk: 24,
      atkExp: 1.18,
      expBase: 40,
      expExp: 1.12,
      minLevel: 4,
      maxLevel: 7,
      count: 3,
      dropTable: [
        { id: "rare_gem", name: "Rare Gem", chance: 18 },
        { id: "elixir", name: "Elixir", chance: 10 },
      ],
    },
  ],
};

/** 레벨 당 필요 경험치 계산 */
export function calcNextExp(level) {
  return Math.floor(CFG.expCurve.base * Math.pow(level, CFG.expCurve.growth));
}
