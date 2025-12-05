// src/phaser/manager/SoundManager.js
export default class SoundManager {
  /** @type {SoundManager | null} */
  static _instance = null;

  /**
   * 게임 생성 직후 한 번만 호출
   * @param {Phaser.Game} game
   */
  static init(game) {
    if (!SoundManager._instance) {
      SoundManager._instance = new SoundManager(game);
    }
    return SoundManager._instance;
  }

  /**
   * 어디서든 가져다 쓸 수 있는 싱글톤
   */
  static getInstance() {
    return SoundManager._instance;
  }

  constructor(game) {
    this.game = game;
    this.sound = game.sound; // Phaser의 글로벌 사운드 매니저

    // 볼륨 (0 ~ 1)
    this.masterVolume = 1;
    this.bgmVolume = 1;
    this.sfxVolume = 1;

    // 현재 재생 중인 BGM
    this.currentBgm = null;

    // 마스터 볼륨은 phaser sound manager의 volume으로
    this.sound.volume = this.masterVolume;

    // 필요하면 localStorage에서 불러오기도 가능
    this._loadFromStorage();
  }

  _clampVolume(v) {
    return Math.max(0, Math.min(1, v));
  }

  _saveToStorage() {
    try {
      const data = {
        master: this.masterVolume,
        bgm: this.bgmVolume,
        sfx: this.sfxVolume,
      };
      localStorage.setItem("game_sound_settings", JSON.stringify(data));
    } catch (e) {
      // 로컬 스토리지 못 써도 게임은 돌아가야 하니까 무시
    }
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem("game_sound_settings");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.master === "number") this.masterVolume = this._clampVolume(data.master);
      if (typeof data.bgm === "number") this.bgmVolume = this._clampVolume(data.bgm);
      if (typeof data.sfx === "number") this.sfxVolume = this._clampVolume(data.sfx);
      this.sound.volume = this.masterVolume;
    } catch (e) {
      // 실패해도 무시
    }
  }

  /* =========================
   *  볼륨 설정 (Vue에서 호출)
   * ========================= */

  setMasterVolume(v) {
    this.masterVolume = this._clampVolume(v);
    this.sound.volume = this.masterVolume; // 전체 스케일
    this._saveToStorage();
  }

  setBgmVolume(v) {
    this.bgmVolume = this._clampVolume(v);
    if (this.currentBgm) {
      this.currentBgm.setVolume(this.bgmVolume);
    }
    this._saveToStorage();
  }

  setSfxVolume(v) {
    this.sfxVolume = this._clampVolume(v);
    this._saveToStorage();
  }

  getVolumes() {
    return {
      master: this.masterVolume,
      bgm: this.bgmVolume,
      sfx: this.sfxVolume,
    };
  }

  /* =========================
   *  BGM 관련
   * ========================= */

  /**
   * BGM 재생 (이전 BGM은 자동 stop)
   * @param {string} key - preload에서 등록한 오디오 키
   * @param {object} config
   */
  playBgm(key, config = {}) {
    if (!this.sound) return;

    // 같은 곡이면 그냥 리턴해도 됨
    if (this.currentBgm && this.currentBgm.key === key) {
      return;
    }

    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }

    const bgm = this.sound.add(key, {
      loop: true,
      volume: this.bgmVolume,
      ...config,
    });

    bgm.play();
    this.currentBgm = bgm;
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }
  }

  pauseBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
    }
  }

  resumeBgm() {
    if (this.currentBgm) {
      this.currentBgm.resume();
    }
  }

  /* =========================
   *  SFX 공통 (효과음)
   * ========================= */

  playSfx(key, config = {}) {
    if (!this.sound) return;
    this.sound.play(key, {
      volume: this.sfxVolume,
      ...config,
    });
  }

  /* =========================
   *  편의 메서드 (카테고리별)
   * ========================= */

  // 2. 몬스터 피격 sound
  playMonsterHit() {
    this.playSfx("monster_hit");
  }

  // 3. 몬스터 타격 sound (몬스터가 플레이어 때릴 때)
  playMonsterAttack() {
    this.playSfx("monster_attack");
  }

  // 3-1. 몬스터 사망 사운드
  playMonsterDeath() {
    this.playSfx("monsterDeath");
  }

  // 4. item drop sound
  playItemDrop() {
    this.playSfx("item_drop");
  }

  // 5. item 먹는 sound
  playItemPickup() {
    this.playSfx("item_pickup");
  }

  // 6. 걷는 사운드 (한 걸음마다 호출)
  playFootstep() {
    this.playSfx("footstep");
  }

  // 6-1. 대쉬 사운드
  playDash() {
    this.playSfx("dash");
  }

  // 7. 스킬 캐스팅 사운드 (스킬별로)
  playSkillCast(skillId) {
    const map = {
      fireball: "skill_fireball",
      buff: "skill_buff",
      flameA: "skill_flameA",
      flameB: "skill_flameB",
      flameC: "skill_flameC",
      firebomb: "skill_firebomb",
      incendiary: "skill_incendiary",
      meteor_S: "skill_meteor_S",
      meteor_M: "skill_meteor_M",
      meteor_L: "skill_meteor_L",
      napalm: "skill_napalm",
      deathhand: "skill_deathhand",
    };

    const key = map[skillId] || "skill_default";
    this.playSfx(key);
  }

  // 8. 아이템 사용 sound
  playItemUse() {
    this.playSfx("item_use");
  }

  // 9. 레벨업 사운드
  playLevelUp() {
    this.playSfx("level_up");
  }

  // 10. 스킬/스탯 레벨업 (+ 버튼)
  playStatIncrease() {
    this.playSfx("stat_increase");
  }

  // 11. UI: 창 열고 닫을 때
  playUiOpen() {
    this.playSfx("ui_open");
  }

  playUiClose() {
    this.playSfx("ui_close");
  }

  // 12. 버튼 클릭 (SAVE, SOUND 등)
  playUiClick() {
    this.playSfx("ui_click");
  }

  // 13. 포탈 이동
  playPortal() {
    this.playSfx("portal");
  }

  // 14. 플레이어 사망
  playDeath() {
    this.playSfx("player_death")
  }
}
