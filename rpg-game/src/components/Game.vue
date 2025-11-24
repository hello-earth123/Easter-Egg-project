<template>
  <div id="app-wrap">
    <!-- 좌측 HUD -->
    <div id="hud">
      <div class="info-row">
        <div>Lv {{ playerLevel }}</div>
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
          :style="{ width: Math.max(0, (playerEXP / playerNextEXP) * 100) + '%' }"
        ></div>
        <div class="bar-text">{{ playerEXP }} / {{ playerNextEXP }}</div>
      </div>

      <div class="info-row" style="margin-top: 6px">
        <!-- HUD에서도 계산된 스킬 포인트 사용 -->
        <div>Skill Pts: {{ availableSkillPoints }}</div>
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
            <img :src="i.icon" />
            <div class="slot-count" v-if="i.count > 1">x{{ i.count }}</div>
          </div>
          <div class="slot-key">{{ ["PgUp", "PgDn"][idx] }}</div>
        </div>
      </div>

      <div id="text-bar">{{ textBar }}</div>
    </div>

    <!-- =================== 게임 영역 / 모달 =================== -->
    <div id="game-container">
      <!-- =================== 스킬 창 (배틀메이지 스타일 트리) =================== -->
      <div v-if="showSkills" class="modal skills-modal" tabindex="0" ref="skillsModal">
        <div class="modal-header">
          Skill Tree
          <span style="margin-left: 8px; font-size: 12px; color: #ddd;">
            (사용 가능 포인트: {{ availableSkillPoints }} / 총 {{ totalSkillPoints }})
          </span>
        </div>

        <div class="skill-main">
          <!-- 좌측: 선택 스킬 상세 패널 -->
          <div class="skill-detail-panel">
            <div v-if="selectedSkill">
              <div class="detail-icon-placeholder">
                ICON
              </div>
              <div class="detail-name">
                {{ selectedSkill.name }}
              </div>
              <div class="detail-level">
                Lv {{ skillLevelOf(selectedSkill.id) }} / {{ selectedSkill.maxLevel }}
              </div>
              <div class="detail-meta">
                요구 레벨: {{ selectedSkill.levelReq }}
              </div>

              <button
                class="detail-levelup-btn"
                @click="levelUpSkill(selectedSkill)"
                :disabled="!canLevelUp(selectedSkill)"
              >
                레벨업
              </button>

              <div class="detail-help">
                • 스킬 포인트는 2레벨마다 1개씩 획득됩니다.<br />
                • 분기 스킬은 한쪽을 레벨업하면 다른 한쪽은 영구 잠금됩니다.
              </div>
            </div>
            <div class="detail-empty" v-else>
              스킬을 선택하면<br />여기에 정보가 표시됩니다.
            </div>
          </div>

          <!-- 우측: 가로 스킬 트리 + SVG 연결선 -->
          <div class="skill-tree-wrapper">
            <div class="skill-tree-inner">
              <svg ref="skillSvg" class="skill-tree-lines"></svg>
              <div class="skill-tree" ref="skillTree">
                <div
                  v-for="node in skillNodes"
                  :key="node.id"
                  class="skill-node"
                  :data-skill-id="node.id"
                  :class="nodeCssClasses(node)"
                  :style="nodePositionStyle(node)"
                  @click="onClickSkill(node)"
                  :draggable="isUnlocked(node)"
                  @dragstart="onSkillTreeDragStart($event, node)"
                >
                  <div class="skill-slot">
                    <div class="skill-icon-placeholder"></div>
                    <div class="skill-lv-text">
                      {{ skillLevelOf(node.id) }} / {{ node.maxLevel }}
                    </div>
                  </div>
                  <div class="skill-node-label">
                    Lv {{ node.levelReq }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="skill-footer-text">닫기: K</div>
      </div>

      <!-- =================== 인벤토리 =================== -->
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
        <div style="margin-top: 8px; color: #ccc">닫기: I</div>
      </div>

      <!-- =================== Stats 창 =================== -->
      <div v-if="showStats" id="stats" tabindex="0">
        <h3>Player Stats</h3>

        <!-- ===== 2x2 사분면 배치 ===== -->
        <div class="stats-layout">
          <!-- 1사분면 : 무기 이미지 -->
          <div class="quad quad-weapon-image">
            <div class="quad-title">[무기 이미지]</div>
            <div class="image-placeholder">
              무기 이미지
            </div>
          </div>

          <!-- 2사분면 : 플레이어 외형 -->
          <div class="quad quad-player-image">
            <div class="quad-title">[플레이어 외형]</div>
            <div class="image-placeholder">
              플레이어 이미지
            </div>
          </div>

          <!-- 3사분면 : 플레이어 능력치 -->
          <div class="quad quad-basic-stats">
            <div class="quad-title">[플레이어 능력치]</div>
            <div class="stats-grid">
              <div><b>Level:</b> {{ playerLevel }}</div>
              <div><b>HP:</b> {{ playerHP }} / {{ playerMaxHP }}</div>
              <div><b>MP:</b> {{ playerMP }} / {{ playerMaxMP }}</div>
              <div><b>EXP:</b> {{ playerEXP }} / {{ playerNextEXP }}</div>
              <div><b>Skill Pts (사용 가능):</b> {{ availableSkillPoints }}</div>
            </div>
          </div>

          <!-- 4사분면 : 무기 스탯 레이더 -->
          <div class="quad quad-radar">
            <div class="quad-title">[무기 스탯]</div>

            <div class="radar-wrapper">
              <canvas ref="weaponRadarCanvas"></canvas>
            </div>

            <div class="weapon-stat-controls">
              <div
                v-for="(value, key) in weaponStats"
                :key="key"
                class="weapon-stat-row"
              >
                <span class="weapon-stat-label">{{ weaponStatLabel(key) }}</span>
                <span class="weapon-stat-value">
                  {{ value }} / {{ weaponMaxPerStat }}
                </span>
                <button
                  class="weapon-up-btn"
                  @click="increaseWeaponStat(key)"
                  :disabled="value >= weaponMaxPerStat"
                >
                  +
                </button>
              </div>

              <!-- 초기화 버튼 -->
              <button class="weapon-reset-btn" @click="resetWeaponStats">
                초기화
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top: 6px; color: #ccc">닫기: P</div>
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from "phaser";
import MainScene from "../phaser/scenes/MainScene";
import TestScene from "../phaser/scenes/TestScene";
import TestScene2 from "../phaser/scenes/TestScene2";

/* Chart.js Radar import */
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default {
  data() {
    return {
      // ===== 플레이어 상태 =====
      playerHP: 100,
      playerMaxHP: 100,
      playerMP: 50,
      playerMaxMP: 50,
      playerEXP: 0,
      playerNextEXP: 100,
      playerLevel: 1,
      skillPoints: 0, // 씬에서 들어오긴 하지만, 실제 UI는 playerLevel 기반 계산 사용

      // 인벤토리
      inventory: { items: [] },

      // 슬롯들
      skillSlots: [null, null, null, null],
      itemSlots: [null, null],

      // (기존) 스킬 목록 - QWER용 (fallback)
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

      // Phaser 연동
      textBar: "",
      scene: null,
      pollTimer: null,

      // UI
      showInventory: false,
      showStats: false,
      showSkills: false,
      windowStack: [],
      topZIndex: 10000,

      // ===== 무기 스탯 (레이더) =====
      weaponStats: {
        damage: 0,
        cooldown: 0,
        manaCost: 0,
        defense: 0,
        luck: 0,
      },
      weaponMaxPerStat: 50,
      weaponRadarChart: null,

      // ===== 스킬 트리(배틀메이지 스타일) =====
      // col: 가로 위치, row: 세로 (0: 위, 1: 중앙, 2: 아래)
      skillNodes: [
        {
          id: "skill1",
          name: "Skill 1",
          levelReq: 1,
          maxLevel: 10,
          branchGroup: null,
          parents: [],
          col: 0,
          row: 1,
        },
        {
          id: "skill2",
          name: "Skill 2",
          levelReq: 5,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill1"],
          col: 1,
          row: 1,
        },
        {
          id: "skill3",
          name: "Skill 3",
          levelReq: 10,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill2"],
          col: 2,
          row: 1,
        },
        {
          id: "skill4a",
          name: "Skill 4A",
          levelReq: 15,
          maxLevel: 5,
          branchGroup: "branch15",
          parents: ["skill3"],
          col: 3,
          row: 0,
        },
        {
          id: "skill4b",
          name: "Skill 4B",
          levelReq: 15,
          maxLevel: 5,
          branchGroup: "branch15",
          parents: ["skill3"],
          col: 3,
          row: 2,
        },
        {
          id: "skill5a",
          name: "Skill 5A",
          levelReq: 20,
          maxLevel: 5,
          branchGroup: "branch20",
          parents: ["skill4a"],
          col: 4,
          row: 0,
        },
        {
          id: "skill5b",
          name: "Skill 5B",
          levelReq: 20,
          maxLevel: 5,
          branchGroup: "branch20",
          parents: ["skill4b"],
          col: 4,
          row: 2,
        },
        {
          id: "skill6",
          name: "Skill 6",
          levelReq: 25,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill5a", "skill5b"], // 어느 분기든 5라인을 타면 허용
          col: 5,
          row: 1,
        },
        {
          id: "skill7",
          name: "Skill 7",
          levelReq: 30,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill6"],
          col: 6,
          row: 1,
        },
        {
          id: "skill8a",
          name: "Skill 8A",
          levelReq: 35,
          maxLevel: 5,
          branchGroup: "branch35",
          parents: ["skill7"],
          col: 7,
          row: 0,
        },
        {
          id: "skill8b",
          name: "Skill 8B",
          levelReq: 35,
          maxLevel: 5,
          branchGroup: "branch35",
          parents: ["skill7"],
          col: 7,
          row: 2,
        },
        {
          id: "skill9",
          name: "Skill 9",
          levelReq: 40,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill8a", "skill8b"],
          col: 8,
          row: 1,
        },
      ],

      // 각 스킬의 현재 레벨
      skillState: {
        skill1: 0,
        skill2: 0,
        skill3: 0,
        skill4a: 0,
        skill4b: 0,
        skill5a: 0,
        skill5b: 0,
        skill6: 0,
        skill7: 0,
        skill8a: 0,
        skill8b: 0,
        skill9: 0,
      },

      // 분기 그룹에서 어떤 스킬을 선택했는지
      branchChosen: {
        branch15: null,
        branch20: null,
        branch35: null,
      },

      selectedSkillId: null,
    };
  },

  computed: {
    // 총 스킬 포인트 (2레벨당 1씩)
    totalSkillPoints() {
      return Math.floor(this.playerLevel / 2);
    },
    // 현재 사용된 포인트 합
    spentSkillPoints() {
      return Object.values(this.skillState).reduce((sum, lv) => sum + lv, 0);
    },
    // 사용 가능한 포인트
    availableSkillPoints() {
      return Math.max(0, this.totalSkillPoints - this.spentSkillPoints);
    },
    selectedSkill() {
      return this.skillNodes.find((n) => n.id === this.selectedSkillId) || null;
    },
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
      scene: [TestScene2, TestScene, MainScene],
    };
    const game = new Phaser.Game(config);

    window.addEventListener("keydown", this.onGlobalKeyDown);
    window.addEventListener("resize", this.onWindowResize);

    // Vue ← Phaser 동기화
    this.pollTimer = setInterval(() => {
      const main = Object.values(game.scene.keys).find((s) => s.scene.isActive());
      this.scene = main;
      if (!main || !main.playerStats) return;

      this.playerHP = Math.round(main.playerStats.hp);
      this.playerMaxHP = Math.round(main.playerStats.maxHp);
      this.playerMP = Math.round(main.playerStats.mp);
      this.playerMaxMP = Math.round(main.playerStats.maxMp);
      this.playerEXP = Math.round(main.playerStats.exp);
      this.playerNextEXP = Math.round(main.playerStats.nextExp);
      this.playerLevel = main.playerStats.level || 1;
      this.skillPoints = main.playerStats.skillPoints || 0; // 참고용

      this.textBar = main.textBar || "";

      // 인벤토리
      this.inventory.items = (main.inventory.items || []).map((i) => ({ ...i }));

      // 스킬 슬롯 (씬 → Vue 미러링)
      if (main.skillSlots) {
        this.skillSlots = main.skillSlots.map((name) => {
          if (!name) return null;
          const base = this.allSkills.find((s) => s.name === name);
          return base ? { ...base } : { name, icon: "/assets/skill1.png" };
        });
      }

      // 아이템 슬롯
      if (main.itemShortcutSlots) {
        this.itemSlots = main.itemShortcutSlots.map((i) => (i ? { ...i } : null));
      }
    }, 100);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onGlobalKeyDown);
    window.removeEventListener("resize", this.onWindowResize);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.weaponRadarChart) this.weaponRadarChart.destroy();
  },

  watch: {
    showStats(val) {
      if (val) {
        this.$nextTick(() => {
          this.initWeaponRadar();
        });
      }
    },
    showSkills(val) {
      if (val) {
        this.$nextTick(() => {
          this.drawSkillLines();
        });
      }
    },
    // 무기 스탯이 바뀔 때마다 차트 자동 업데이트
    weaponStats: {
      deep: true,
      handler() {
        this.updateWeaponRadar();
      },
    },
  },

  methods: {
    /* ===================
       무기 스탯 및 레이더 차트
    ====================== */

    weaponStatLabel(key) {
      return {
        damage: "데미지",
        cooldown: "쿨타임",
        manaCost: "마나 소모",
        defense: "방어력",
        luck: "행운",
      }[key];
    },

    weaponStatArray() {
      return [
        this.weaponStats.damage,
        this.weaponStats.cooldown,
        this.weaponStats.manaCost,
        this.weaponStats.defense,
        this.weaponStats.luck,
      ];
    },

    initWeaponRadar() {
      const canvas = this.$refs.weaponRadarCanvas;
      if (!canvas) return;

      const parent = canvas.parentNode;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      if (this.weaponRadarChart) {
        this.weaponRadarChart.destroy();
      }

      const ctx = canvas.getContext("2d");

      this.weaponRadarChart = new Chart(ctx, {
        type: "radar",
        data: {
          labels: ["데미지", "쿨타임", "마나 소모", "방어력", "행운"],
          datasets: [
            {
              data: this.weaponStatArray(),
              fill: true,
              backgroundColor: "rgba(0, 150, 255, 0.35)",
              borderColor: "rgba(0, 200, 255, 1)",
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 0,
            },
          ],
        },
        options: {
          responsive: false,
          scales: {
            r: {
              min: 0,
              max: this.weaponMaxPerStat,
              ticks: {
                stepSize: 10,
                display: false,
              },
              grid: {
                color: "rgba(255, 255, 255, 0.5)",
                lineWidth: 1.5,
              },
              angleLines: {
                color: "rgba(255, 255, 255, 0.6)",
                lineWidth: 1.5,
              },
              pointLabels: {
                color: "#fff",
                font: {
                  size: 11,
                },
              },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    },

    updateWeaponRadar() {
      if (!this.weaponRadarChart) return;

      this.$nextTick(() => {
        this.weaponRadarChart.data.datasets[0].data = this.weaponStatArray();
        this.weaponRadarChart.update();
      });
    },

    increaseWeaponStat(key) {
      if (this.weaponStats[key] < this.weaponMaxPerStat) {
        this.weaponStats[key]++;
      }
    },

    resetWeaponStats() {
      for (let k in this.weaponStats) this.weaponStats[k] = 0;
    },

    /* ===================
       스킬 트리 로직
    ====================== */

    skillLevelOf(id) {
      return this.skillState[id] || 0;
    },

    // 이 노드가 분기로 인해 잠긴 상태인지
    isLockedByBranch(node) {
      if (!node.branchGroup) return false;
      const chosen = this.branchChosen[node.branchGroup];
      return chosen && chosen !== node.id;
    },

    // 선행 조건 / 레벨 조건을 만족하는지 (0레벨이어도 해금 가능)
    isUnlocked(node) {
      if (this.playerLevel < node.levelReq) return false;

      // 부모 중 하나라도 찍혀있으면 통과 (OR)
      if (node.parents && node.parents.length > 0) {
        const hasParentLearned = node.parents.some(
          (pid) => this.skillLevelOf(pid) > 0
        );
        if (!hasParentLearned) return false;
      }

      if (this.isLockedByBranch(node)) return false;
      return true;
    },

    canLevelUp(node) {
      if (!this.isUnlocked(node)) return false;
      if (this.skillLevelOf(node.id) >= node.maxLevel) return false;
      if (this.availableSkillPoints <= 0) return false;
      return true;
    },

    onClickSkill(node) {
      if (!this.isUnlocked(node)) return;
      this.selectedSkillId = node.id;
    },

    levelUpSkill(node) {
      if (!this.canLevelUp(node)) return;

      // 분기 그룹이면, 첫 투자 시 해당 분기로 고정
      if (node.branchGroup && !this.branchChosen[node.branchGroup]) {
        this.branchChosen[node.branchGroup] = node.id;
      }

      this.skillState = {
        ...this.skillState,
        [node.id]: this.skillLevelOf(node.id) + 1,
      };

      // 레벨업 후에도 라인 강조 등 반영 위해 다시 그림
      this.$nextTick(() => {
        this.drawSkillLines();
      });
    },

    nodeCssClasses(node) {
      const lv = this.skillLevelOf(node.id);
      const unlocked = this.isUnlocked(node);
      const branchLocked = this.isLockedByBranch(node);

      return {
        "is-learned": lv >= 1,                       // ✔ 레벨 1 이상일 때만 색칠
        "is-unlocked-only": lv === 0 && unlocked,    // ✔ 해금만 되었으면 border는 회색
        "is-locked": !unlocked,                      // ✔ 완전 잠금
        "is-branch-locked": branchLocked,
        "is-maxed": lv >= node.maxLevel,
        "is-selected": this.selectedSkillId === node.id,
      };
    },

    nodePositionStyle(node) {
      return {
        gridColumn: node.col + 1,
        gridRow: node.row + 1,
      };
    },

    // 스킬 트리에서 QWER로 드래그 시작
    onSkillTreeDragStart(ev, node) {
      if (!this.isUnlocked(node) || this.isLockedByBranch(node)) {
        ev.preventDefault();
        return;
      }
      ev.dataTransfer.setData("skill-id", node.id);
    },

    // SVG 연결선 그리기
    drawSkillLines() {
      const tree = this.$refs.skillTree;
      const svg = this.$refs.skillSvg;
      if (!tree || !svg) return;

      const treeRect = tree.getBoundingClientRect();
      const width = treeRect.width;
      const height = treeRect.height;

      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      while (svg.firstChild) svg.removeChild(svg.firstChild);

      this.skillNodes.forEach((node) => {
        if (!node.parents || node.parents.length === 0) return;

        const childSlot = tree.querySelector(
          `.skill-node[data-skill-id="${node.id}"] .skill-slot`
        );
        if (!childSlot) return;

        const childRect = childSlot.getBoundingClientRect();
        const childX = childRect.left - treeRect.left + childRect.width / 2;
        const childY = childRect.top - treeRect.top + childRect.height / 2;

        node.parents.forEach((pid) => {
          const parentSlot = tree.querySelector(
            `.skill-node[data-skill-id="${pid}"] .skill-slot`
          );
          if (!parentSlot) return;

          const parentRect = parentSlot.getBoundingClientRect();
          const px = parentRect.left - treeRect.left + parentRect.width / 2;
          const py = parentRect.top - treeRect.top + parentRect.height / 2;

          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          line.setAttribute("x1", px);
          line.setAttribute("y1", py);
          line.setAttribute("x2", childX);
          line.setAttribute("y2", childY);

          // 상태에 따라 색상/굵기 조금 달리 줄 수도 있음
          const parentLearned = this.skillLevelOf(pid) > 0;
          const childLearned = this.skillLevelOf(node.id) > 0;

          if (parentLearned || childLearned) {
            line.setAttribute("stroke", "#4caf50");
            line.setAttribute("stroke-width", "2");
          } else {
            line.setAttribute("stroke", "#777");
            line.setAttribute("stroke-width", node.branchGroup ? "1.8" : "1.4");
          }

          line.setAttribute("stroke-linecap", "round");
          svg.appendChild(line);
        });
      });
    },

    onWindowResize() {
      if (this.showSkills) {
        this.$nextTick(() => this.drawSkillLines());
      }
    },

    /* ===================
         공통 UI
    ====================== */

    onGlobalKeyDown(e) {
      if (e.key === "i" || e.key === "I") this.toggleInventory();
      if (e.key === "p" || e.key === "P") this.toggleStats();
      if (e.key === "k" || e.key === "K") this.toggleSkills();

      if (e.key === "Escape") {
        const last = this.windowStack.pop();
        if (!last) return;

        if (last === "inventory") this.showInventory = false;
        if (last === "stats") this.showStats = false;
        if (last === "skills") this.showSkills = false;
      }
    },

    toggleInventory() {
      this.showInventory = !this.showInventory;
      if (this.showInventory) {
        this.windowStack.push("inventory");
        this.$nextTick(() => {
          const el = this.$el.querySelector("#inventory");
          this.makeDraggable(el);
        });
      }
    },

    toggleStats() {
      this.showStats = !this.showStats;
      if (this.showStats) {
        this.windowStack.push("stats");
        this.$nextTick(() => {
          const el = this.$el.querySelector("#stats");
          this.makeDraggable(el);
          this.initWeaponRadar();
        });
      }
    },

    toggleSkills() {
      this.showSkills = !this.showSkills;
      if (this.showSkills) {
        this.windowStack.push("skills");
        this.$nextTick(() => {
          const el = this.$refs.skillsModal;
          this.makeDraggable(el);
          this.drawSkillLines();
        });
      }
    },

    /* ===================
       드래그 가능한 모달
    ====================== */
    makeDraggable(el) {
      if (!el) return;
      const header = el.querySelector(".modal-header") || el.querySelector("h3");
      if (!header) return;

      header.onmousedown = (e) => {
        let startX = e.clientX;
        let startY = e.clientY;

        const rect = el.getBoundingClientRect();
        let offsetX = startX - rect.left;
        let offsetY = startY - rect.top;

        document.onmousemove = (ev) => {
          el.style.left = ev.clientX - offsetX + "px";
          el.style.top = ev.clientY - offsetY + "px";
        };
        document.onmouseup = () => {
          document.onmousemove = null;
        };
      };
    },

    /* ===================
        슬롯 관련 (QWER / 아이템)
    ====================== */

    // (구) allSkills 드래그 시작 (남겨두면 필요 시 사용 가능)
    onSkillDragStart(ev, idx) {
      const skill = this.allSkills[idx];
      if (!skill.acquired) return;
      ev.dataTransfer.setData("skill-idx", String(idx));
    },

    // QWER 슬롯 드롭: 스킬트리 스킬(A) + 기존 allSkills 겸용
    onDropSkillShortcut(ev, slotIdx) {
      const skillId = ev.dataTransfer.getData("skill-id");
      let newSkill = null;

      if (skillId) {
        // 스킬 트리에서 온 드래그
        const node = this.skillNodes.find((n) => n.id === skillId);
        if (!node) return;
        if (!this.isUnlocked(node) || this.isLockedByBranch(node)) return;

        newSkill = {
          name: node.name,
          icon: "/assets/skill_placeholder.png",
          id: node.id,
        };
      } else {
        // 기존 allSkills 기반 드래그 (호환)
        const idxStr = ev.dataTransfer.getData("skill-idx");
        if (idxStr === "") return;
        const idx = parseInt(idxStr, 10);
        const skill = this.allSkills[idx];
        if (!skill) return;

        newSkill = { ...skill };
      }

      // 동일 스킬이 다른 슬롯에 이미 있으면 제거 (중복 방지)
      const existingIndex = this.skillSlots.findIndex((s, i) => {
        if (!s) return false;
        if (skillId && s.id) return s.id === skillId && i !== slotIdx;
        return s.name === newSkill.name && i !== slotIdx;
      });

      if (existingIndex !== -1) {
        this.skillSlots.splice(existingIndex, 1, null);
      }

      this.skillSlots.splice(slotIdx, 1, newSkill);

      if (this.scene?.setSkillSlots) {
        const names = this.skillSlots.map((s) => (s ? { name: s.name } : null));
        this.scene.setSkillSlots(names);
      }
    },

    onDragStart(ev, idx) {
      ev.dataTransfer.setData("item-idx", idx);
    },

    onDropItemShortcut(ev, slotIdx) {
      const idx = parseInt(ev.dataTransfer.getData("item-idx"));
      const item = this.inventory.items[idx];
      if (!item) return;

      this.itemSlots.splice(slotIdx, 1, { ...item });

      if (this.scene?.setItemSlots) this.scene.setItemSlots(this.itemSlots);
    },

    useSkillFromVue(idx) {
      if (this.scene?.useSkill) this.scene.useSkill(idx);
    },

    useItemShortcutFromVue(idx) {
      if (this.scene?.useItemShortcut) this.scene.useItemShortcut(idx);
    },

    useItem(idx) {
      if (this.scene?.useItemFromInventory) this.scene.useItemFromInventory(idx);
    },

    cdLeftMs(skillName) {
      if (!this.scene || !this.scene.skills) return 0;
      const s = this.scene.skills[skillName];
      return s ? Math.max(0, s.onCooldownUntil - this.scene.time.now) : 0;
    },

    skillLevel(skillName) {
      if (!this.scene || !this.scene.skills) return 1;
      return this.scene.skills[skillName]?.level || 1;
    },
  },
};
</script>

<style scoped>
/* ===================== 전체 레이아웃 ===================== */
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

/* ===================== 게임 영역 ===================== */
#game-container {
  width: 900px;
  height: 700px;
  background: #000;
  position: relative;
}

/* ===================== HUD ===================== */
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

/* ===================== QWER / 아이템 슬롯 ===================== */
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

/* ===================== 모달 공통 ===================== */
.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  background: #222;
  border: 1px solid #444;
  padding: 10px;
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

/* ===================== 배틀메이지 스타일 스킬 창 ===================== */
.skills-modal {
  width: 860px;
  max-height: 580px;
}

.skill-main {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* 좌측 상세 패널 */
.skill-detail-panel {
  width: 260px;
  background: #151515;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.detail-empty {
  width: 100%;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}

.detail-icon-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #ddd;
  margin-bottom: 6px;
}

.detail-name {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
}

.detail-level {
  font-size: 13px;
  margin-bottom: 2px;
}

.detail-meta {
  font-size: 12px;
  color: #bbb;
  margin-bottom: 8px;
}

.detail-levelup-btn {
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: #2e7;
  color: #111;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
}

.detail-levelup-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.detail-help {
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
}

/* 우측 트리 영역 */
.skill-tree-wrapper {
  flex: 1;
  background: #151515;
  border-radius: 8px;
  padding: 6px;
  overflow-x: auto;
}

.skill-tree-inner {
  position: relative;
  min-width: 800px;
}

.skill-tree-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.skill-tree {
  position: relative;
  display: grid;
  grid-template-rows: repeat(3, 140px); /* 위/중간/아래 3줄 */
  grid-auto-columns: 110px;
  column-gap: 30px;
  row-gap: 14px;
  padding: 8px 12px;
}

/* 개별 노드 */
.skill-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  cursor: pointer;
  color: #fff;
}

.skill-slot {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: #222;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.skill-icon-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #333;
}

.skill-lv-text {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  color: #fff;
}

.skill-node-label {
  margin-top: 4px;
  font-size: 11px;
  color: #ccc;
}

/* 상태에 따른 스타일 */
.skill-node.is-locked .skill-slot {
  opacity: 0.35;
  border-color: #333;
}

.skill-node.is-branch-locked .skill-slot {
  opacity: 0.18;
  border-color: #222;
  filter: grayscale(1);
}

.skill-node.is-learned .skill-slot {
  border-color: #4caf50;
}

.skill-node.is-maxed .skill-slot {
  border-color: #ff9800;
}

.skill-node.is-selected .skill-slot {
  box-shadow: 0 0 0 2px #ffd54f;
  transform: translateY(-1px);
}

/* 푸터 텍스트 */
.skill-footer-text {
  margin-top: 6px;
  font-size: 12px;
  color: #ccc;
}

/* ===================== 인벤토리 ===================== */
#inventory {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  max-height: 70vh;
  overflow: auto;
  background: #222;
  border: 1px solid #444;
  padding: 10px;
  color: #fff;
  z-index: 9999;
  border-radius: 8px;
}

#inventory h3 {
  background: linear-gradient(to right, #1d3a5f, #295b85);
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
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

/* ===================== Stats 창 ===================== */
#stats {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  max-height: 680px;
  background: #222;
  border: 1px solid #444;
  padding: 8px;
  overflow: visible;
  color: #fff;
  z-index: 9999;
  border-radius: 8px;
}

#stats h3 {
  background: linear-gradient(to right, #3f2a54, #563b77);
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
}

/* ===== 사분면 레이아웃 ===== */
.stats-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 6px;
  margin-top: 6px;
}

.quad {
  background: #111;
  border-radius: 8px;
  padding: 6px;
}

.quad-title {
  font-size: 13px;
  margin-bottom: 4px;
  color: #ddd;
}

/* ===================== 개별 사분면 ===================== */
.quad-weapon-image {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
}

.quad-player-image {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

/* 플레이어 / 무기 이미지 placeholder 크기 통일 */
.quad-player-image .image-placeholder,
.quad-weapon-image .image-placeholder {
  min-height: 220px;
}

.quad-basic-stats {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.quad-radar {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

/* ===================== 이미지 placeholder ===================== */
.image-placeholder {
  border: 1px dashed #555;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #aaa;
}

/* ===================== 레이더 차트 ===================== */
.radar-wrapper {
  width: 100%;
  height: 120px;
  margin-bottom: 4px;
}

.radar-wrapper canvas {
  width: 100%;
  height: 100%;
}

/* ===================== 무기 스탯 컨트롤 ===================== */
.weapon-stat-controls {
  margin-top: 4px;
  font-size: 12px;
}

.weapon-stat-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.weapon-stat-label {
  min-width: 70px;
  text-align: right;
}

.weapon-stat-value {
  min-width: 60px;
  text-align: center;
}

.weapon-up-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #2e7;
}

.weapon-up-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.weapon-reset-btn {
  margin-top: 6px;
  width: 100%;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: #c33;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.weapon-reset-btn:hover {
  background: #e44;
}
</style>
