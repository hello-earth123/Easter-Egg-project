<template>
  <div id="app-wrap">
    <div id="hud">
      <div class="info-row">
        <div>Lv {{ playerLevel }}</div>
        <div style="margin-left: auto">Gold: {{ inventory.money }}</div>
      </div>

      <div class="bar label">HP</div>
      <div class="bar-wrap">
        <div class="bar-fill" :style="{ width: hpPercent + '%' }"></div>
        <div class="bar-text">{{ playerHP }} / {{ playerMaxHP }}</div>
      </div>

      <div class="bar label">MP</div>
      <div class="bar-wrap">
        <div class="bar-fill mp" :style="{ width: mpPercent + '%' }"></div>
        <div class="bar-text">{{ playerMP }} / {{ playerMaxMP }}</div>
      </div>

      <div class="bar label">EXP</div>
      <div class="bar-wrap">
        <div class="bar-fill exp" :style="{ width: expPercent + '%' }"></div>
        <div class="bar-text">{{ Math.floor(playerEXP * 100) }}%</div>
      </div>

      <div id="skill-row">
        <div class="skill" v-for="(s, idx) in skills" :key="idx">
          <div class="skill-key">{{ s.key }}</div>
          <div class="skill-cd" v-if="s.cooldownRemaining > 0">
            {{ Math.ceil(s.cooldownRemaining / 1000) }}s
          </div>
        </div>
      </div>

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
            <img :src="s.icon" alt="it" />
            <div class="slot-cd" v-if="s.cooldownRemaining > 0">
              {{ Math.ceil(s.cooldownRemaining / 1000) }}s
            </div>
          </div>
          <div class="slot-key">{{ ["Q", "W", "E", "R"][idx] }}</div>
        </div>

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
            <div class="slot-count" v-if="i.count > 1">{{ i.count }}</div>
          </div>
          <div class="slot-key">{{ ["PgUp", "PgDn"][idx] }}</div>
        </div>
      </div>

      <div id="text-bar">{{ textBar }}</div>

      <div style="margin-top: 10px; font-size: 12px; color: #ddd">
        Press I to toggle Inventory | Press P to toggle Stats
      </div>
    </div>

    <div id="game-container">
      <!-- Skill modal -->
      <div
        v-if="showSkills"
        class="modal draggable"
        tabindex="0"
        ref="skillsModal"
      >
        <div class="modal-header">Skills</div>
        <div class="skills-grid">
          <div
            v-for="(skill, idx) in allSkills"
            :key="idx"
            class="skill-slot"
            :class="{ locked: !skill.acquired }"
            draggable="true"
            @dragstart="onSkillDragStart($event, idx)"
          >
            <img v-if="skill.acquired" :src="skill.icon" />
            <div class="skill-name">{{ skill.name }}</div>
          </div>
        </div>
        <div style="margin-top: 8px; color: #ccc">
          스킬을 Q/W/E/R 단축키에 드래그하여 배치 | 닫기: K
        </div>
      </div>

      <!-- Inventory modal -->
      <div
        v-if="showInventory"
        id="inventory"
        @keydown.esc="showInventory = false"
        tabindex="0"
      >
        <h3>Inventory (더블클릭으로 사용)</h3>
        <div class="inventory-grid">
          <div
            class="inv-item"
            v-for="(it, idx) in inventory.items"
            :key="idx"
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

      <!-- Stats modal -->
      <div
        v-if="showStats"
        id="stats"
        @keydown.esc="showStats = false"
        tabindex="0"
      >
        <h3>Player Stats</h3>
        <div class="stats-grid">
          <div><b>Level:</b> {{ playerLevel }}</div>
          <div><b>HP:</b> {{ playerHP }} / {{ playerMaxHP }}</div>
          <div><b>MP:</b> {{ playerMP }} / {{ playerMaxMP }}</div>
          <div><b>EXP:</b> {{ Math.floor(playerEXP * 100) }}%</div>
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
      playerHP: 100,
      playerMaxHP: 100,
      playerMP: 50,
      playerMaxMP: 50,
      playerEXP: 0,
      playerLevel: 1,
      allSkills: [
        { name: "Skill 1", icon: "/assets/skill1.png", acquired: true },
        { name: "Skill 2", icon: "/assets/skill2.png", acquired: true },
        { name: "Skill 3", icon: "/assets/skill3.png", acquired: true },
        { name: "Skill 4", icon: "/assets/skill4.png", acquired: true },
        { name: "Skill 5", icon: "/assets/skill5.png", acquired: false },
        { name: "Skill 6", icon: "/assets/skill6.png", acquired: false },
        { name: "Skill 7", icon: "/assets/skill7.png", acquired: false },
        { name: "Skill 8", icon: "/assets/skill8.png", acquired: false },
      ],
      textBar: "로딩 중...",
      scene: null,
      pollTimer: null,
      showInventory: false,
      showStats: false,
      showSkills: false,
      inventory: { money: 0, items: [] }, // local mirror
      shortcutSlots: [null, null, null, null, null, null], // Q,W,E,R,PgUp,PgDn
      skillSlots: [null, null, null, null], // Q, W, E, R
      itemSlots: [null, null], // PgUp, PgDn
    };
  },
  computed: {
    hpPercent() {
      return Math.max(0, (this.playerHP / this.playerMaxHP) * 100);
    },
    mpPercent() {
      return Math.max(0, (this.playerMP / this.playerMaxMP) * 100);
    },
    expPercent() {
      return Math.max(0, this.playerEXP * 100);
    },
  },
  mounted() {
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

    this.pollTimer = setInterval(() => {
      const main = game.scene.keys["MainScene"];
      if (main && main.player) {
        this.scene = main;
        this.playerHP = Math.round(main.player.hp);
        this.playerMaxHP = Math.round(main.player.maxHp);
        this.playerMP = Math.round(main.player.mp);
        this.playerMaxMP = Math.round(main.player.maxMp);
        this.playerEXP = main.player.expPercent || 0;
        this.playerLevel = main.player.level || 1;
        this.textBar = main.textBar || "";

        if (main.inventory) {
          this.inventory.money = main.inventory.money;
          this.inventory.items = main.inventory.items
            ? main.inventory.items.map((i) => ({ ...i }))
            : [];
        }

        const now = main.time.now;
        this.skills.forEach((s, idx) => {
          const ss = main.skillState ? main.skillState[idx] : null;
          s.cooldownRemaining = ss ? Math.max(0, ss.nextAvailable - now) : 0;
        });

        if (main.shortcutSlots) {
          this.shortcutSlots = main.shortcutSlots.map((slot) =>
            slot ? { ...slot } : null
          );
        }
      }
    }, 100);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    window.removeEventListener("keydown", this.onGlobalKeyDown);
  },
  methods: {
    onGlobalKeyDown(e) {
      if (e.key === "i" || e.key === "I") {
        this.showInventory = !this.showInventory;
        if (this.showInventory) {
          this.$nextTick(() => {
            const el = document.getElementById("inventory");
            if (el) el.focus();
          });
        }
      }
      if (e.key === "p" || e.key === "P") {
        this.showStats = !this.showStats;
        if (this.showStats) {
          this.$nextTick(() => {
            const el = document.getElementById("stats");
            if (el) el.focus();
          });
        }
      }
      if (e.key === "k" || e.key === "K") {
        this.showSkills = !this.showSkills;
        if (this.showSkills) {
          this.$nextTick(() => {
            const el = document.getElementById("skills");
            if (el) el.focus();
          });
        }
      }
    },
    // 스킬 드래그 시작
    onSkillDragStart(ev, idx) {
      const skill = this.allSkills[idx];
      if (!skill.acquired) return ev.preventDefault();
      ev.dataTransfer.setData("skill-idx", idx);
    },

    // 단축키 슬롯에 드롭
    onDropSkillShortcut(ev, slotIdx) {
      const skillIdx = parseInt(ev.dataTransfer.getData("skill-idx"), 10);
      if (isNaN(skillIdx)) return;
      const skill = this.allSkills[skillIdx];
      if (!skill || !skill.acquired) return;

      // Vue 단축키 슬롯에 저장
      this.skillSlots.splice(slotIdx, 1, { ...skill, cooldownRemaining: 0 });
    },

    // 단축키 슬롯에서 스킬 사용
    useSkillFromVue(idx) {
      const slot = this.skillSlots[idx];
      if (!slot || !this.scene) return;
      this.scene.useSkill(idx); // MainScene.js에서 구현 필요
    },

    // 기존 아이템 단축키 드래그 앤 드롭
    onDropItemShortcut(ev, slotIdx) {
      const invIdx = parseInt(ev.dataTransfer.getData("text/plain"), 10);
      if (!this.scene) return;
      const item = this.inventory.items[invIdx];
      if (!item) return;
      this.itemSlots.splice(slotIdx, 1, { ...item });
    },
    useItemShortcutFromVue(idx) {
      if (!this.scene) return;
      this.scene.useItemShortcut(idx);
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
  width: 280px;
  padding: 10px;
  box-sizing: border-box;
  color: #fff;
  background: rgba(10, 10, 10, 0.85);
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
#skill-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.skill {
  width: 56px;
  height: 56px;
  background: #222;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: bold;
  color: #fff;
}
.skill-cd {
  position: absolute;
  bottom: 4px;
  font-size: 12px;
  color: #ffd;
}
#shortcut {
  left: 20px; /* 원하는 위치 (왼쪽 하단 기준) */
  bottom: 5px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(136, 189, 231, 0.884); /* 반투명 배경 */
  padding: 6px;
  border-radius: 6px;
  z-index: 5000; /* 모달보다는 낮게, HUD 위에 보이도록 */
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
  border: 1px dashed rgba(255, 255, 255, 0.05);
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
.slot-hint {
  font-size: 11px;
  color: #bbb;
  margin-top: 6px;
}
#text-bar {
  margin-top: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  font-size: 13px;
  min-height: 36px;
}

#game-container {
  width: 900px;
  height: 700px;
  background: #000;
  position: relative;
}

/* Inventory modal */
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

.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  background: #222;
  border: 1px solid #444;
  padding: 12px;
  color: #fff;
  z-index: 9999;
  border-radius: 8px;
}
.modal-header {
  font-weight: bold;
  margin-bottom: 6px;
  cursor: grab;
}
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.skill-slot {
  width: 80px;
  height: 80px;
  background: #111;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>
