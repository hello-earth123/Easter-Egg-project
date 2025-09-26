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
          v-for="(s, idx) in shortcutSlots"
          :key="idx"
          @drop.prevent="onDropShortcut($event, idx)"
          @dragover.prevent
          @click="useShortcutFromVue(idx)"
          :class="{ empty: !s }"
        >
          <div v-if="s" class="slot-item">
            <img :src="s.icon" alt="it" />
            <div class="slot-count" v-if="s.count > 1">{{ s.count }}</div>
          </div>
          <div class="slot-key">{{ idx === 0 ? "PgUp" : "PgDn" }}</div>
        </div>
        <div class="slot-hint">
          단축키: 드래그로 아이템 할당 | 클릭 또는 PgUp/PgDn 사용
        </div>
      </div>

      <div id="text-bar">{{ textBar }}</div>

      <div style="margin-top: 10px; font-size: 12px; color: #ddd">
        Press I to toggle Inventory | Press P to toggle Stats
      </div>
    </div>

    <div id="game-container">
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
      skills: [
        { key: "Q", cooldownRemaining: 0 },
        { key: "W", cooldownRemaining: 0 },
        { key: "E", cooldownRemaining: 0 },
        { key: "R", cooldownRemaining: 0 },
      ],
      textBar: "로딩 중...",
      scene: null,
      pollTimer: null,
      showInventory: false,
      showStats: false,
      inventory: { money: 0, items: [] }, // local mirror
      shortcutSlots: [null, null],
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
    },
    onDragStart(ev, idx) {
      ev.dataTransfer.setData("text/plain", idx);
    },
    onDropShortcut(ev, slotIdx) {
      const invIdx = parseInt(ev.dataTransfer.getData("text/plain"), 10);
      if (!this.scene) return;
      const main = this.scene;
      const item = main.inventory.items[invIdx];
      if (!item) return;
      main.shortcutSlots[slotIdx] = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        count: item.count,
      };
      this.shortcutSlots.splice(slotIdx, 1, { ...main.shortcutSlots[slotIdx] });
    },
    useShortcutFromVue(idx) {
      if (!this.scene) return;
      this.scene.useShortcut(idx);
    },
    useItem(invIdx) {
      if (!this.scene) return;
      this.scene.useItemFromInventory(invIdx);
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
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
</style>
