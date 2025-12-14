/** 공용 설정과 경험치 계산식 - TODO */
export const CFG = {
  // 월드 크기
  world: { width: 1600, height: 1216 },

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
    base: 90,
    growth: 1.6, // nextExp(level) = floor(base * level^growth)
  },

  // 스킬 레벨 당 성장치
  skillScaling: {
    dmgPerLevel: 0.15,
    costPerLevel: 0.1,
  },

  // ============ BOSS PATTERN ============
  thunder: {
    scale: 2.0,
    baseDmg: 3000,
  },

  fireshoot: {
    scale: 0.8,
    baseDmg: 500,
    speed: 400,
  },

  batswarm: {
    scale: 1.5,
    baseDmg: 4000,
    speed: 500,
  },
  // ======================================

  // ============================
  // 🔥 Fire 스킬 설정
  // ============================

  // Fireball
  fireball: {
    baseDmg: 24,
    dmgScale: 0.15,
    baseCost: 10,
    costScale: 0.1,
    cd: 2000,
    speed: 500,
    frameRate: 14,

    // 🔥 연출 관련
    scale: 3.0,            // 작은 탄
    vfx: "trail_fast",     // 빠르게 움직이는 발사체

    description: "마법에 조예가 있다면 누구나 쓸 수 있는 기초 마법이다.\n 전방으로 작은 불덩이를 쏘아낸다.",

  },

  // Buff
  buff: {
    baseCost: 24,
    costScale: 0,
    cd: 25000,

    duration: 10000,
    hpUp: 200,
    mpUp: 150,
    frameRate: 15,

    // 🔥 연출
    scale: 1.3,
    vfx: "buff_aura",

    description: "마나의 축복이 있으리라.\n 짧은 시간 체력과 마나의 상한선이 증가한다.",
  },

  // Flame A (1타)
  flameA: {
    baseDmg: 30,
    dmgScale: 0.15,
    baseCost: 11,
    costScale: 0.1,
    cd: 900,

    distance: 200,
    radius: 60,
    tickDmg: 10,
    duration: 3000,

    frameRate: 10,

    // 🔥 연출
    scale: 1.5,
    vfx: "flame_pulse",

    description: "지열을 한 곳에 모아 뿜어내는 마법이다.\n 전방에 불기둥을 소환하며 일정 시간 화상 데미지를 입힌다."
  },

  // Flame B (1타 + 전방 한 칸 추가)
  flameB: {
    baseDmg: 36,
    dmgScale: 0.15,
    baseCost: 14,
    costScale: 0.1,
    cd: 1200,

    distance: 250,
    radius: 60,
    tickDmg: 12,
    duration: 3500,

    frameRate: 12,

    // 🔥 연출
    scale: 1.8,
    vfx: "flame_pulse",

    description: "지열에 더해, 자신의 마나로 더 넓은 영역에 열기를 뿜어낸다.\n 전방에 크고 강력한 불기둥을 2개 소환하며 일정 시간 화상 데미지를 입힌다."
  },

  // Flame C (십자 5방)
  flameC: {
    baseDmg: 45,
    dmgScale: 0.2,
    baseCost: 20,
    costScale: 0.12,
    cd: 4800,

    distance: 200,
    radius: 70,
    tickDmg: 14,
    duration: 1200,
    spread: 60,

    frameRate: 12,

    // 🔥 연출
    scale: 1.3,
    vfx: "flame_pulse",

    description: "방대한 마나를 사용하여 작은 열기만으로도 큰 효과를 불러일으키는 상급 마법이다.\n 전방에 매우 크고 강력한 불기둥을 4개 소환하며 일정 시간 화상 데미지를 입힌다."
  },

  // Firebomb
  firebomb: {
    baseDmg: 65,
    dmgScale: 0.20,
    baseCost: 24,
    costScale: 0.12,
    cd: 5500,

    radius: 90,

    frameRate: 12,

    // 🔥 연출
    scale: 1.8,
    vfx: "explosion_big",

    description: "예술은 폭발이다!\n 전방에 극한으로 압축한 불꽃을 생성하여 폭발시킨다.",
  },

  // Incendiary (화염 방사기)
  incendiary: {
    baseDmg: 22,
    dmgScale: 0.15,
    baseCost: 18,
    costScale: 0.1,
    cd: 6000,

    tickDmg: 8,
    duration: 2000,
    interval: 150,

    distance: 130,
    radius: 60,
    angle: 26, // degree 단위, 좌우 각도

    frameRate: 10,

    // 🔥 연출
    scale: 2.0,
    vfx: "cone_flame",

    description: "Need a light?\n 화염을 전방으로 발사한다. 사용 중에 움직일 수 없다.",
  },

  // Meteor S
  meteor_S: {
    baseDmg: 45,
    dmgScale: 0.20,
    baseCost: 24,
    costScale: 0.1,
    cd: 3200,

    fallSpeed: 700,
    count: 2,
    radius: 60,
    distance: 200,
    duration: 330,

    frameRate: 10,

    // 🔥 연출
    scale: 2.0,
    vfx: "meteor_small",

    description: "이 마법을 개발한 사람은 호브라는 괴물이 되었다는 소문이 있다.\n 2개의 불덩이를 소환하여 전방 범위에 낙하시킨다."
  },

  // Meteor M
  meteor_M: {
    baseDmg: 80,
    dmgScale: 0.22,
    baseCost: 30,
    costScale: 0.12,
    cd: 7000,

    fallSpeed: 700,
    count: 3,
    radius: 75,
    distance: 200,

    frameRate: 10,

    // 🔥 연출
    scale: 2.0,
    vfx: "meteor_medium",

    description: "이 마법을 개발한 사람은 호브라는 괴물이 되었다는 소문이 있다.\n 3개의 불덩이를 소환하여 전방 범위에 낙하시킨다."

  },

  // Meteor L
  meteor_L: {
    baseDmg: 90,
    dmgScale: 0.25,
    baseCost: 40,
    costScale: 0.15,
    cd: 9500,

    fallSpeed: 700,
    count: 6,
    radius: 90,
    distance: 200,

    frameRate: 12,

    // 🔥 연출
    scale: 2.5,
    vfx: "meteor_large",

    description: "이 마법을 개발한 사람은 호브라는 괴물이 되었다는 소문이 있다.\n 6개의 불덩이를 소환하여 전방 범위에 낙하시킨다."
  },

  // Napalm (장판)
  napalm: {
    baseDmg: 300,
    dmgScale: 0.18,
    baseCost: 32,
    costScale: 0.12,
    cd: 10000,

    duration: 3000,
    tickDmg: 100,
    interval: 450,
    radius: 80,
    length: 140, // napalm 장판 폭

    frameRate: 10,

    // 🔥 연출
    scale: 1.8,            // 폭발 + 장판 기본 스케일
    vfx: "napalm_burst",

    description: "정제하지 않은 마나를 퍼트려 주위 환경을 자신에게 유리하게 바꾸는 초고위 마법이다.\n 시전자를 중심으로 끊임 없이 불타오르는 지대를 형성한다."
  },

  // Death Hand
  deathhand: {
    baseDmg: 400,
    dmgScale: 0.30,
    baseCost: 55,
    costScale: 0.2,
    cd: 10000,

    radius: 120,
    distance: 170,

    frameRate: 14,

    // 🔥 연출
    scale: 2.2,
    vfx: "deathhand_impact",

    description: "재능만으로는 닿을 수 없는, 다른 차원의 불꽃을 사용하는 미지의 마법이다.\n 거대한 불의 손으로 적을 뒤덮는다."
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
