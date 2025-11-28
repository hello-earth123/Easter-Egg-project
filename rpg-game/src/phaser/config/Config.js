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

  // ============================
  // 🔥 Fire 스킬 설정
  // ============================

  // Fireball
  fireball: {
    baseDmg: 40,
    dmgScale: 0.15,
    baseCost: 12,
    costScale: 0.1,
    cd: 1200,
    speed: 500,
    frameRate: 14,
  },

  // Buff
  buff: {
    baseCost: 20,
    costScale: 0,
    cd: 5000,

    duration: 8000,
    hpUp: 300,
    mpUp: 500,
    frameRate: 15,
  },

  // Flame A (1타)
  flameA: {
    baseDmg: 22,
    dmgScale: 0.15,
    baseCost: 10,
    costScale: 0.1,
    cd: 900,

    distance: 120,
    radius: 60,
    tickDmg: 8,
    duration: 1200,

    frameRate: 10,
  },

  // Flame B (1타 + 전방 한 칸 추가)
  flameB: {
    baseDmg: 25,
    dmgScale: 0.15,
    baseCost: 12,
    costScale: 0.1,
    cd: 1200,

    distance: 80,
    radius: 60,
    tickDmg: 10,
    duration: 1200,

    frameRate: 12,
  },

  // Flame C (십자 5방)
  flameC: {
    baseDmg: 30,
    dmgScale: 0.2,
    baseCost: 16,
    costScale: 0.12,
    cd: 1600,

    // 중심으로부터 거리/반경/지속은 FlameA/B와 공유
    distance: 80,
    radius: 70,
    tickDmg: 12,
    duration: 1200,

    // 십자 방향으로 퍼지는 거리(전/후/좌/우)
    spread: 60,

    frameRate: 12,
  },

  // Firebomb
  firebomb: {
    baseDmg: 45,
    dmgScale: 0.20,
    baseCost: 20,
    costScale: 0.12,
    cd: 2000,

    radius: 90,

    frameRate: 12,
  },

  // Incendiary (화염 방사기)
  incendiary: {
    baseDmg: 25,
    dmgScale: 0.15,
    baseCost: 14,
    costScale: 0.1,
    cd: 2200,

    tickDmg: 6,
    duration: 2000,
    interval: 150,

    distance: 130,
    radius: 60,
    angle: 26, // degree 단위, 좌우 각도

    frameRate: 10,
  },

  // Meteor S
  meteor_S: {
    baseDmg: 70,
    dmgScale: 0.20,
    baseCost: 22,
    costScale: 0.1,
    cd: 3000,

    fallSpeed: 700,
    count: 2,
    radius: 60,
    distance: 160,
    duration: 330,

    frameRate: 10,
  },

  // Meteor M
  meteor_M: {
    baseDmg: 120,
    dmgScale: 0.22,
    baseCost: 28,
    costScale: 0.12,
    cd: 4200,

    fallSpeed: 700,
    count: 4,
    radius: 75,
    distance: 160,

    frameRate: 10,
  },

  // Meteor L
  meteor_L: {
    baseDmg: 200,
    dmgScale: 0.25,
    baseCost: 35,
    costScale: 0.15,
    cd: 6000,

    fallSpeed: 700,
    count: 6,
    radius: 90,
    distance: 160,

    frameRate: 12,
  },

  // Napalm (장판)
  napalm: {
    baseDmg: 65,
    dmgScale: 0.18,
    baseCost: 30,
    costScale: 0.12,
    cd: 4200,

    duration: 3000,
    tickDmg: 15,
    interval: 450,
    radius: 80,
    length: 140, // napalm 장판 폭

    frameRate: 10,
  },

  // Death Hand
  deathhand: {
    baseDmg: 300,
    dmgScale: 0.30,
    baseCost: 50,
    costScale: 0.2,
    cd: 8000,

    radius: 120,
    distance: 150,

    frameRate: 14,
  },

  // 몬스터 설정
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
      count: 5,
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
