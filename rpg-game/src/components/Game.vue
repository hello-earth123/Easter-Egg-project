<template>
  <div id="app-wrap">
    <!-- 좌측 HUD -->
    <div id="hud">
      <div class="info-row">
        <div>Lv {{ playerLevel }}</div>
        <div style="margin-left: auto">Gold: {{ inventory.money }}</div>
      </div>

      <div class="bar label">HP</div>
      <div class="bar-wrap">
        <div
          class="bar-fill"
          :style="{ width: Math.max(0, (playerHP / playerMaxHP) * 100) + '%' }"
        ></div>
        <div class="bar-text">{{ playerHP }} / {{ playerMaxHP }}</div>
      </div>

      <div class="bar label">MP</div>
      <div class="bar-wrap">
        <div
          class="bar-fill mp"
          :style="{ width: Math.max(0, (playerMP / playerMaxMP) * 100) + '%' }"
        ></div>
        <div class="bar-text">{{ playerMP }} / {{ playerMaxMP }}</div>
      </div>

      <div class="bar label">EXP</div>
      <div class="bar-wrap">
        <div
          class="bar-fill exp"
          :style="{
            width: Math.max(0, (playerEXP / playerNextEXP) * 100) + '%',
          }"
        ></div>
        <div class="bar-text">{{ playerEXP }} / {{ playerNextEXP }}</div>
      </div>

      <div class="info-row" style="margin-top: 6px">
        <div>Skill Pts: {{ skillPoints }}</div>
        <div style="margin-left: auto; font-size: 12px; color: #ccc">
          I:Inventory / P:Stats / K:Skills
        </div>
      </div>

      <!-- 스킬 슬롯(QWER) -->
      <div id="shortcut">
        <div
          class="shortcut-slot"
          v-for="(s, idx) in skillSlots"
          :key="'skill-' + idx"
          @drop.prevent="onDropSkillShortcut($event, idx)"
          @dragover.prevent
          @click="useSkillFromVue(idx)"
          :class="{ empty: !s }"
        >
          <div v-if="s" class="slot-item">
            <img :src="s.icon" :alt="s.name" />
            <div class="slot-cd" v-if="cdLeftMs(s.name) > 0">
              {{ Math.ceil(cdLeftMs(s.name) / 1000) }}s
            </div>
            <div class="slot-lv">Lv {{ skillLevel(s.name) }}</div>
          </div>
          <div class="slot-key">{{ ["Q", "W", "E", "R"][idx] }}</div>
        </div>
      </div>

      <!-- 아이템 슬롯(PgUp/PgDn) -->
      <div id="shortcut">
        <div
          class="shortcut-slot"
          v-for="(i, idx) in itemSlots"
          :key="'item-' + idx"
          @drop.prevent="onDropItemShortcut($event, idx)"
          @dragover.prevent
          @click="useItemShortcutFromVue(idx)"
          :class="{ empty: !i }"
        >
          <div v-if="i" class="slot-item">
            <img :src="i.icon" alt="item" />
            <div class="slot-count" v-if="i.count > 1">x{{ i.count }}</div>
          </div>
          <div class="slot-key">{{ ["PgUp", "PgDn"][idx] }}</div>
        </div>
      </div>

      <div id="text-bar">{{ textBar }}</div>
    </div>

    <!-- 우측 게임 영역 + 모달들 -->
    <div id="game-container">
      <!-- 스킬 목록(레벨업 UI 포함) -->
      <div v-if="showSkills" class="modal" tabindex="0" ref="skillsModal">
        <div class="modal-header">Skills (스킬 포인트: {{ skillPoints }})</div>
        <div class="skills-grid">
          <div
            v-for="(skill, idx) in allSkills"
            :key="'all-' + idx"
            class="skill-slot"
            :class="{ locked: !skill.acquired }"
            draggable="true"
            @dragstart="onSkillDragStart($event, idx)"
          >
            <img v-if="skill.acquired" :src="skill.icon" />
            <div class="skill-name">{{ skill.name }}</div>
            <div class="skill-lv">Lv {{ skillLevel(skill.name) }}</div>
            <button
              class="up-btn"
              :disabled="skillPoints <= 0"
              @click="upgradeSkill(skill.name)"
            >
              +
            </button>
          </div>
        </div>
        <div style="margin-top: 8px; color: #ccc">
          스킬을 Q/W/E/R에 드래그하여 배치 | 닫기: K
        </div>
      </div>

      <!-- 인벤토리 -->
      <div v-if="showInventory" id="inventory" tabindex="0">
        <h3>Inventory (더블클릭 사용)</h3>
        <div class="inventory-grid">
          <div
            class="inv-item"
            v-for="(it, idx) in inventory.items"
            :key="'inv-' + idx"
            draggable="true"
            @dragstart="onDragStart($event, idx)"
            @dblclick="useItem(idx)"
          >
            <img :src="it.icon" />
            <div class="inv-info">
              <div class="inv-name">{{ it.name }}</div>
              <div class="inv-count" v-if="it.count > 1">x{{ it.count }}</div>
            </div>
          </div>
        </div>
        <div style="margin-top: 10px">Money: {{ inventory.money }}</div>
        <div style="margin-top: 8px; color: #ccc">닫기: I</div>
      </div>

      <!-- 스탯 -->
      <div v-if="showStats" id="stats" tabindex="0">
        <h3>Player Stats</h3>
        <div class="stats-grid">
          <div><b>Level:</b> {{ playerLevel }}</div>
          <div><b>HP:</b> {{ playerHP }} / {{ playerMaxHP }}</div>
          <div><b>MP:</b> {{ playerMP }} / {{ playerMaxMP }}</div>
          <div><b>EXP:</b> {{ playerEXP }} / {{ playerNextEXP }}</div>
          <div><b>Skill Pts:</b> {{ skillPoints }}</div>
          <div><b>Gold:</b> {{ inventory.money }}</div>
        </div>
        <div style="margin-top: 8px; color: #ccc">닫기: P</div>
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from "phaser";
import MainScene from "../phaser/scenes/MainScene";

export default {
  data() {
    return {
      // 플레이어/HUD
      playerHP: 100,
      playerMaxHP: 100,
      playerMP: 50,
      playerMaxMP: 50,
      playerEXP: 0,
      playerNextEXP: 100,
      playerLevel: 1,
      skillPoints: 0,

      // 인벤토리
      inventory: { money: 0, items: [] },

      // 슬롯
      skillSlots: [null, null, null, null], // Q/W/E/R
      itemSlots: [null, null], // PgUp, PgDn

      // 스킬 목록(드래그 소스 & 레벨업 타겟)
      allSkills: [
        { name: "Skill 1", icon: "/assets/skill1.png", acquired: true },
        { name: "Skill 2", icon: "/assets/skill2.png", acquired: true },
        { name: "Skill 3", icon: "/assets/skill3.png", acquired: true },
        { name: "Skill 4", icon: "/assets/skill4.png", acquired: true },
        { name: "Skill 5", icon: "/assets/skill5.png", acquired: true },
        { name: "Skill 6", icon: "/assets/skill6.png", acquired: true },
        { name: "Skill 7", icon: "/assets/skill7.png", acquired: true },
        { name: "Skill 8", icon: "/assets/skill8.png", acquired: true },
      ],

      // 기타
      textBar: "로딩 중...",
      scene: null,
      pollTimer: null,
      showInventory: false,
      showStats: false,
      showSkills: false,

      // 창 스택 (인벤토리, 스킬, 스탯)
      windowStack: [],
      // 나중에 열린 창이 가장 위로
      topZIndex: 10000,
    };
  },

  mounted() {
    // Phaser 게임 구동
    const config = {
      type: Phaser.AUTO,
      width: 900,
      height: 700,
      parent: "game-container",
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scene: [MainScene],
    };
    const game = new Phaser.Game(config);

    window.addEventListener("keydown", this.onGlobalKeyDown);

    // 씬 → Vue 상태 동기화 (100ms)
    this.pollTimer = setInterval(() => {
      const main = game.scene.keys["MainScene"];
      if (!main || !main.playerStats) return;
      this.scene = main;

      // 스탯
      this.playerHP = Math.round(main.playerStats.hp);
      this.playerMaxHP = Math.round(main.playerStats.maxHp);
      this.playerMP = Math.round(main.playerStats.mp);
      this.playerMaxMP = Math.round(main.playerStats.maxMp);
      this.playerEXP = Math.round(main.playerStats.exp);
      this.playerNextEXP = Math.round(main.playerStats.nextExp);
      this.playerLevel = main.playerStats.level || 1;
      this.skillPoints = main.playerStats.skillPoints || 0;

      // 텍스트바
      this.textBar = main.textBar || "";

      // 인벤토리 미러
      this.inventory.money = main.inventory.money;
      this.inventory.items = (main.inventory.items || []).map((i) => ({
        ...i,
      }));

      // 슬롯 미러 (씬에서 보관 중인 문자열 name 배열)
      if (main.skillSlots) {
        // Vue 슬롯에는 아이콘/이름 필요 → name으로 allSkills 검색
        this.skillSlots = main.skillSlots.map((name) => {
          if (!name) return null;
          const base = this.allSkills.find((s) => s.name === name);
          return base ? { ...base } : { name, icon: "/assets/skill1.png" };
        });
      }
      if (main.itemShortcutSlots) {
        this.itemSlots = main.itemShortcutSlots.map((i) =>
          i ? { ...i } : null
        );
      }
    }, 100);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onGlobalKeyDown);
    if (this.pollTimer) clearInterval(this.pollTimer);
  },

  methods: {
    // 창 닫기
    onGlobalKeyDown(e) {
      if (e.key === "i" || e.key === "I") this.toggleInventory();
      if (e.key === "p" || e.key === "P") this.toggleStats();
      if (e.key === "k" || e.key === "K") this.toggleSkills();

      // ESC로 창 닫기
      if (e.key === "Escape") {
        const last = this.windowStack.pop();
        if (!last) return; // 닫을 창 없음

        if (last === "inventory") this.showInventory = false;
        if (last === "stats") this.showStats = false;
        if (last === "skills") this.showSkills = false;
      }
    },

    toggleInventory() {
      if (this.showInventory) {
        this.showInventory = false;
        this.windowStack = this.windowStack.filter((w) => w !== "inventory");
      } else {
        this.showInventory = true;
        this.windowStack.push("inventory");
        this.topZIndex += 1;
        this.$nextTick(() => {
          const el = this.$el.querySelector("#inventory");
          if (el) {
            this.makeDraggable(el);
            el.style.zIndex = this.topZIndex;
          }
          el?.focus();
        });
      }
    },

    toggleStats() {
      if (this.showStats) {
        this.showStats = false;
        this.windowStack = this.windowStack.filter((w) => w !== "stats");
      } else {
        this.showStats = true;
        this.windowStack.push("stats");
        this.topZIndex += 1;
        this.$nextTick(() => {
          const el = this.$el.querySelector("#stats");
          if (el) {
            this.makeDraggable(el);
            el.style.zIndex = this.topZIndex;
          }
          el?.focus();
        });
      }
    },

    toggleSkills() {
      if (this.showSkills) {
        this.showSkills = false;
        this.windowStack = this.windowStack.filter((w) => w !== "skills");
      } else {
        this.showSkills = true;
        this.windowStack.push("skills");
        this.topZIndex += 1;
        this.$nextTick(() => {
          const el = this.$refs.skillsModal;
          if (el) {
            this.makeDraggable(el);
            el.style.zIndex = this.topZIndex;
          }
          el?.focus();
        });
      }
    },

    // 슬롯에 드롭(스킬)
    onSkillDragStart(ev, idx) {
      const skill = this.allSkills[idx];
      if (!skill?.acquired) return ev.preventDefault();
      ev.dataTransfer.setData("skill-idx", String(idx));
    },
    onDropSkillShortcut(ev, slotIdx) {
      const skillIdx = parseInt(ev.dataTransfer.getData("skill-idx"), 10);
      if (isNaN(skillIdx)) return;
      const skill = this.allSkills[skillIdx];
      if (!skill?.acquired) return;

      // Vue 로컬 갱신
      this.skillSlots.splice(slotIdx, 1, { ...skill });

      // 씬에 전달(슬롯 배열은 name만 유지)
      if (this.scene?.setSkillSlots) {
        const names = this.skillSlots.map((s) => (s ? { name: s.name } : null));
        this.scene.setSkillSlots(names);
      }
    },

    // 슬롯에 드롭(아이템)
    onDragStart(ev, idx) {
      ev.dataTransfer.setData("text/plain", String(idx));
    },
    onDropItemShortcut(ev, slotIdx) {
      const invIdx = parseInt(ev.dataTransfer.getData("text/plain"), 10);
      const item = this.inventory.items[invIdx];
      if (!item) return;
      this.itemSlots.splice(slotIdx, 1, { ...item });
      if (this.scene?.setItemSlots) this.scene.setItemSlots(this.itemSlots);
    },

    // 실행
    useSkillFromVue(idx) {
      if (this.scene?.useSkill) this.scene.useSkill(idx);
    },
    useItemShortcutFromVue(idx) {
      if (this.scene?.useItemShortcut) this.scene.useItemShortcut(idx);
    },
    useItem(idx) {
      if (this.scene?.useItemFromInventory)
        this.scene.useItemFromInventory(idx);
    },

    // 쿨타임 표기 (씬의 스킬 인스턴스 onCooldownUntil 기반)
    cdLeftMs(skillName) {
      if (!this.scene || !this.scene.time || !this.scene.skills) return 0;
      const s = this.scene.skills[skillName];
      if (!s) return 0;
      return Math.max(0, s.onCooldownUntil - this.scene.time.now);
    },
    skillLevel(skillName) {
      if (!this.scene || !this.scene.skills) return 1;
      const s = this.scene.skills[skillName];
      return s?.level || 1;
    },

    // 스킬 레벨업 버튼
    upgradeSkill(skillName) {
      if (!this.scene?.upgradeSkillByName) return;
      const ok = this.scene.upgradeSkillByName(skillName);
      if (!ok) {
        // 실패 사유(포인트 없음 등)는 씬에서 textBar로 알려줌
      }
    },

    // 창 드래그 앤 드롭 메서드 (화면을 벗어나지 않도록 한다.)
    makeDraggable(el) {
      let pos = { x: 0, y: 0, left: 0, top: 0 };
      const header =
        el.querySelector(".modal-header") || el.querySelector("h3");
      if (!header) return;

      header.onmousedown = (e) => {
        e.preventDefault();

        // ✅ 클릭한 창을 맨 위로 가져오기
        this.topZIndex += 1;
        el.style.zIndex = this.topZIndex;

        pos.x = e.clientX;
        pos.y = e.clientY;
        const rect = el.getBoundingClientRect();
        pos.left = rect.left;
        pos.top = rect.top;

        document.onmousemove = (e2) => {
          const dx = e2.clientX - pos.x;
          const dy = e2.clientY - pos.y;

          let newLeft = pos.left + dx;
          let newTop = pos.top + dy;
          const maxLeft = window.innerWidth - el.offsetWidth;
          const maxTop = window.innerHeight - el.offsetHeight;
          if (newLeft < 0) newLeft = 0;
          if (newTop < 0) newTop = 0;
          if (newLeft > maxLeft) newLeft = maxLeft;
          if (newTop > maxTop) newTop = maxTop;

          el.style.left = newLeft + "px";
          el.style.top = newTop + "px";
          el.style.transform = "translate(0,0)";
        };

        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    },
  },
};
</script>

<style scoped>
#app-wrap {
  display: flex;
  gap: 8px;
  font-family: Arial, sans-serif;
}
#hud {
  width: 300px;
  padding: 10px;
  color: #fff;
  background: rgba(10, 10, 10, 0.85);
}
#game-container {
  width: 900px;
  height: 700px;
  background: #000;
  position: relative;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.bar {
  margin-top: 4px;
  margin-bottom: 2px;
  font-weight: bold;
}
.bar-wrap {
  position: relative;
  width: 100%;
  height: 22px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #c33;
  transition: width 0.12s linear;
}
.bar-fill.mp {
  background: #39c;
}
.bar-fill.exp {
  background: #3c9;
}
.bar-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 22px;
  font-size: 12px;
  top: 0;
  left: 0;
}

#shortcut {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(136, 189, 231, 0.12);
  padding: 6px;
  border-radius: 6px;
  margin-top: 8px;
}
.shortcut-slot {
  width: 100%;
  height: 56px;
  background: #111;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px dashed rgba(255, 255, 255, 0.08);
}
.shortcut-slot.empty {
  opacity: 0.6;
}
.slot-item img {
  width: 36px;
  height: 36px;
}
.slot-key {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 11px;
  color: #aaa;
}
.slot-count {
  position: absolute;
  right: 6px;
  top: 4px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  border-radius: 4px;
  color: #fff;
}
.slot-lv {
  position: absolute;
  left: 6px;
  bottom: 4px;
  font-size: 11px;
  color: #fff;
}

#text-bar {
  margin-top: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 13px;
  min-height: 36px;
}

/* 모달 공통 */
.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  background: #222;
  border: 1px solid #444;
  padding: 12px;
  color: #fff;
  z-index: 9999;
  border-radius: 8px;
}
.modal-header {
  background: linear-gradient(to right, #2d2d2d, #3c3c3c);
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
}

#inventory h3 {
  background: linear-gradient(to right, #1d3a5f, #295b85);
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
}

#stats h3 {
  background: linear-gradient(to right, #3f2a54, #563b77);
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
}
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.skill-slot {
  width: 120px;
  height: 120px;
  background: #111;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.skill-slot.locked {
  opacity: 0.3;
  pointer-events: none;
}
.skill-slot img {
  width: 48px;
  height: 48px;
}
.skill-name {
  font-size: 12px;
  margin-top: 4px;
}
.skill-lv {
  font-size: 12px;
  color: #ddd;
  margin-top: 2px;
}
.up-btn {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 22px;
  height: 22px;
  background: #2e7;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.up-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

/* 인벤토리/스탯 모달 */
#inventory,
#stats {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  max-height: 70vh;
  overflow: auto;
  background: #222;
  border: 1px solid #444;
  padding: 12px;
  color: #fff;
  z-index: 9999;
  border-radius: 8px;
}
.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.inv-item {
  width: 80px;
  height: 80px;
  background: #111;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: grab;
}
.inv-item img {
  width: 48px;
  height: 48px;
}
.inv-name {
  font-size: 12px;
  margin-top: 4px;
}
.inv-count {
  font-size: 12px;
  color: #ddd;
  margin-top: 2px;
}
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}
</style>
