<template>
  <div id="app-wrap">
    <!-- 게임 컨테이너 (Phaser가 붙는 영역) -->
    <div id="game-container">
      <!-- =================== 오버레이 HUD =================== -->
      <div class="hud-root">
        <!-- 좌측 상단: Lv + HP/MP/EXP 패널 -->
        <div class="hud-top-left-panel">
          <div class="hud-level-row">
            <span class="hud-level-text">Lv {{ playerLevel }}</span>
            <span class="hud-shortcuts-text">
              I:Inventory · P:Stats · K:Skills
            </span>
          </div>

          <div class="hud-bars">
            <!-- HP -->
            <div class="hud-bar">
              <div class="hud-bar-label hp">HP</div>
              <div class="bar-wrap">
                <div
                  class="bar-fill hp"
                  :style="{ width: Math.max(0, (playerHP / playerMaxHP) * 100) + '%' }"
                ></div>
                <div class="bar-text">
                  {{ playerHP }} / {{ playerMaxHP }}
                </div>
              </div>
            </div>

            <!-- MP -->
            <div class="hud-bar">
              <div class="hud-bar-label mp">MP</div>
              <div class="bar-wrap">
                <div
                  class="bar-fill mp"
                  :style="{ width: Math.max(0, (playerMP / playerMaxMP) * 100) + '%' }"
                ></div>
                <div class="bar-text">
                  {{ playerMP }} / {{ playerMaxMP }}
                </div>
              </div>
            </div>

            <!-- EXP -->
            <div class="hud-bar">
              <div class="hud-bar-label exp">EXP</div>
              <div class="bar-wrap">
                <div
                  class="bar-fill exp"
                  :style="{ width: Math.max(0, (playerEXP / playerNextEXP) * 100) + '%' }"
                ></div>
                <div class="bar-text">
                  {{ playerEXP }} / {{ playerNextEXP }}
                </div>
              </div>
            </div>

            <!-- Skill Points 표시 (작게) -->
            <div class="hud-skill-pts-row">
              <span>Skill Pts: {{ availableSkillPoints }}</span>
              <span class="hud-skill-pts-sub">
              </span>
            </div>
          </div>
        </div>

        <!-- 하단 중앙: 스킬(QWER) / 아이템(PgUp/PgDn) 숏컷 바 -->
        <div class="hud-bottom-center-panel">
                    <!-- 아이템 슬롯 -->
          <div class="shortcut-row item-row">
            <div
              class="shortcut-slot item-slot"
              v-for="(i, idx) in itemSlots"
              :key="'item-' + idx"
              @drop.prevent="onDropItemShortcut($event, idx)"
              @dragover.prevent
              @click="useItemShortcutFromVue(idx)"
              :class="{ empty: !i }"
            >
              <div v-if="i" class="slot-item">
                <img :src="i.icon" />
                <div class="slot-count" v-if="i.count > 1">
                  x{{ i.count }}
                </div>
              </div>
              <div class="slot-key">
                {{ ["PgUp", "PgDn"][idx] }}
              </div>
            </div>
          </div>

          <!-- 스킬 슬롯 -->
          <div class="shortcut-row skill-row">
            <div class="shortcut-slot"
                v-for="(s, idx) in skillSlots"
                :key="'skill-' + idx"
                @drop.prevent="onDropSkillShortcut($event, idx)"
                @dragover.prevent
                @click="useSkillFromVue(idx)"
                :class="{ empty: !s }">

              <div v-if="s" class="slot-item">
                <img :src="s.icon" :alt="s.name" />

                <!-- 쿨다운 남은 시간 (오른쪽 상단) -->
                <div class="slot-cd-text" v-if="cdLeftMs(s.phaserKey) > 0">
                  {{ Math.ceil(cdLeftMs(s.phaserKey) / 1000) }}
                </div>

                <!-- 시계 방향 쿨다운 마스크 -->
                <svg
                  v-if="cdLeftMs(s.phaserKey) > 0"
                  class="cooldown-mask"
                  viewBox="0 0 54 54"
                >
                  <path
                    class="cooldown-sector"
                    :d="cooldownSectorPath(s.phaserKey)"
                  />
                </svg>

                <div class="slot-lv">Lv {{ skillLevel(s.phaserKey) }}</div>
              </div>

              <div class="slot-key">{{ ["Q","W","E","R"][idx] }}</div>
            </div>

          </div>
        </div>

        <!-- 좌측 하단: 텍스트 로그 바 -->
        <div class="hud-bottom-left-log">
          <div class="log-label">LOG</div>
          <div class="log-content">
            {{ textBar }}
          </div>
        </div>
      </div>
      
      <!-- 미니맵 HUD -->
      <MiniMap 
        :mapName="currentMapTitle"
        :player="miniMapPlayer"
        :monsters="miniMapMonsters"
        :portals="miniMapPortals"
      />
      
      <!-- 맵 이름 표시 -->
      <div
        v-if="showMapTitle"
        class="map-title-banner"
      >
        {{ currentMapTitle }}
      </div>

      <!-- 컷씬 대화 UI -->
      <DialogueUI ref="dialogue" />


      <!-- =================== 스킬 창 (배틀메이지 스타일 트리) =================== -->
      <div
        v-if="showSkills"
        class="modal skills-modal"
        tabindex="0"
        ref="skillsModal"
      >
        <div class="modal-header">
          <span>Skill Tree</span>
          <span class="modal-header-sub">
            사용 가능 포인트:
            <b>{{ availableSkillPoints }}</b> / {{ totalSkillPoints }}
          </span>
        </div>

        <div class="skill-main">
          <!-- 좌측: 선택 스킬 상세 패널 -->
          <div class="skill-detail-panel">
            <div v-if="selectedSkill">
              <div class="detail-icon-placeholder">
                <img
                  v-if="selectedSkill"
                  :src="'/static/assets/skill_icon/' + selectedSkill.icon"
                  class="detail-icon-img"
                />
              </div>

              스킬 상세 표시
              <div class="detail-name">
                {{ selectedSkill.name }}
              </div>
              <div class="detail-level">
                Lv {{ skillLevelOf(selectedSkill.id) }} /
                {{ selectedSkill.maxLevel }}
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

              <!-- 스킬 상세 내용 -->
              <div class="skill-detail-body">
                <div v-if="selectedSkillDetail">

                  <!-- 설명 -->
                  <p class="skill-desc">
                    {{ selectedSkillDetail.description }}
                  </p>

                  <!-- 정보 그리드 -->
                  <div class="skill-info">
                    <div class="label">소비 마나 : </div>
                    <div class="value">{{ selectedSkillDetail.manaCost }}</div>

                    <div class="label">쿨타임 : </div>
                    <div class="value">{{ selectedSkillDetail.cooldownSec }} 초</div>
                  </div>

                </div>

                <div v-else class="skill-desc">
                  상세 정보를 불러오는 중입니다...
                </div>
              </div>

              <!-- 스킬 포인트, 스킬 트리 작동 방식 -->
              <div class="detail-help">
                • 스킬 포인트는 2레벨마다 1개씩 획득됩니다.<br />
                • 분기 스킬은 한쪽을 레벨업하면 다른 한쪽은 영구 잠금됩니다.
              </div>
              <div class="detail-sp-info">
                사용 가능 스킬 포인트:
                <b>{{ availableSkillPoints }}</b>
              </div>
              <button class="detail-reset-btn" @click="resetAllSkills">
                스킬 초기화
              </button>
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
                    <img
                      class="skill-icon"
                      :src="'/static/assets/skill_icon/' + node.icon"
                      alt=""
                    />
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
              <!-- 아이템 이름 -->
              <div class="inv-name" :title="items[it.name]">
                {{ items[it.name] }}
              </div>
              <div class="inv-count" v-if="it.count > 1">
                x{{ it.count }}
              </div>
            </div>
          </div>
        </div>
        <div class="window-footer">닫기: I</div>
      </div>

      <!-- =================== Stats 창 =================== -->
      <div v-if="showStats" id="stats" tabindex="0">
        <h3>Player Stats</h3>

        <!-- ===== 2x2 사분면 배치 ===== -->
        <div class="stats-layout">
          <!-- 1사분면 : 플레이어 외형 -->
          <div class="quad quad-player-image">
            <div class="quad-title">플레이어 외형</div>

            <div
              class="image-placeholder framed"
              :style="{
                position: 'relative',
                overflow: 'hidden',
                width: playerFrameWidth * playerFrameScale + 'px',
                height: playerFrameHeight * playerFrameScale + 'px'
              }"
            >
              <img
                :src="playerSpriteSheet"
                :style="{
                  imageRendering: 'pixelated',
                  transformOrigin: 'top left',
                  transform:
                    'translate(' +
                    (-(playerFrameIndex * playerFrameWidth) - 30) +
                    'px, -15px) ' +
                    'scale(' + playerFrameScale + ')'
                }"
              />
            </div>
          </div>

          <!-- 2사분면 : 무기 이미지 -->
          <div class="quad quad-weapon-image">
            <div class="quad-title">장비 무기</div>

            <div
              class="image-placeholder framed"
              :style="{
                position: 'relative',
                overflow: 'hidden',
                width: weaponFrameWidth * weaponFrameScale + 'px',
                height: weaponFrameHeight * weaponFrameScale + 'px'
              }"
            >
              <img
                :src="weaponSpriteSheet"
                :style="{
                  imageRendering: 'pixelated',
                  transformOrigin: 'top left',
                  transform:
                    'translate(' +
                    (-(weaponFrameIndex * weaponFrameWidth) - weaponOffsetX) +
                    'px, ' +
                    (-weaponOffsetY) +
                    'px) ' +
                    'scale(' + weaponFrameScale + ')'
                }"
              />
            </div>
          </div>

          <!-- 3사분면 : 플레이어 능력치 -->
          <div class="quad quad-basic-stats">
            <div class="quad-title">기본 능력치</div>

            <div class="stats-grid">
              <div><b>Level</b> {{ playerLevel }}</div>

              <div><b>HP</b> {{ playerHP }} / {{ playerMaxHP }}</div>

              <div><b>MP</b> {{ playerMP }} / {{ playerMaxMP }}</div>

              <div><b>EXP</b> {{ playerEXP }} / {{ playerNextEXP }}</div>

              <div><b>Skill Pts</b> {{ availableSkillPoints }}</div>

              <!-- 추가된 Stats Pts -->
              <div><b>Stats Pts</b> {{ statPoints }} / {{ maxStatPoints }}</div>
            </div>

            <!-- Gem 그래프 영역 -->
            <div class="gem-usage-section">
              <div class="gem-title">Gem Usage (Total {{ (totalGemUsed).toFixed(2) }}/20)</div>

              <!-- Damage -->
              <div class="gem-row">
                <div class="gem-label red">데미지</div>
                <div class="gem-bar">
                  <div
                    class="gem-bar-fill red"
                    :style="{
                      width:
                        (Math.min(gemUsage.damage, maxGemUsage) / maxGemUsage) * 100 + '%'
                    }"
                  ></div>
                </div>
                <div class="gem-value">{{ (gemUsage.damage).toFixed(2) }}</div>
              </div>
              
              <!-- Cooldown -->
              <div class="gem-row">
                <div class="gem-label white">쿨타임</div>
                <div class="gem-bar">
                  <div
                    class="gem-bar-fill white"
                    :style="{
                      width:
                        (Math.min(gemUsage.cooldown, maxGemUsage) / maxGemUsage) * 100 + '%'
                    }"
                  ></div>
                </div>
                <div class="gem-value">{{ (gemUsage.cooldown).toFixed(2) }}</div>
              </div>

              <!-- ManaCost -->
              <div class="gem-row">
                <div class="gem-label sky">마나 소모</div>
                <div class="gem-bar">
                  <div
                    class="gem-bar-fill sky"
                    :style="{
                      width:
                        (Math.min(gemUsage.manaCost, maxGemUsage) / maxGemUsage) * 100 + '%'
                    }"
                  ></div>
                </div>
                <div class="gem-value">{{ (gemUsage.manaCost).toFixed(2) }}</div>
              </div>

              <!-- Defense -->
              <div class="gem-row">
                <div class="gem-label yellow">방어력</div>
                <div class="gem-bar">
                  <div
                    class="gem-bar-fill yellow"
                    :style="{
                      width:
                        (Math.min(gemUsage.defense, maxGemUsage) / maxGemUsage) * 100 + '%'
                    }"
                  ></div>
                </div>
                <div class="gem-value">{{ (gemUsage.defense).toFixed(2) }}</div>
              </div>

              <!-- Luck -->
              <div class="gem-row">
                <div class="gem-label green">행운</div>
                <div class="gem-bar">
                  <div
                    class="gem-bar-fill green"
                    :style="{
                      width:
                        (Math.min(gemUsage.luck, maxGemUsage) / maxGemUsage) * 100 + '%'
                    }"
                  ></div>
                </div>
                <div class="gem-value">{{ (gemUsage.luck).toFixed(2) }}</div>
              </div>
            </div>
          </div>


          <!-- 4사분면 : 무기 스탯 레이더 -->
          <div class="quad quad-radar">
            <div class="quad-title">무기 스탯</div>

            <div class="radar-wrapper framed">
              <canvas ref="weaponRadarCanvas"></canvas>
            </div>

            <div class="weapon-stat-controls">
              <div
                v-for="(value, key) in weaponStats"
                :key="key"
                class="weapon-stat-row"
              >
                <span class="weapon-stat-label">
                  {{ weaponStatLabel(key) }}
                </span>
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

        <div class="window-footer">닫기: P</div>
      </div>

      <!-- =================== ESC 메뉴창 =================== -->
      <div v-if="showMenu" class="modal menu-modal" tabindex="0">
        <div class="modal-header">
          <span>Menu</span>
        </div>

        <div class="menu-body">
          <button class="menu-btn" @click="save">SAVE</button>
          <button class="menu-btn" @click="openSoundMenu">SOUND</button>
          <button class="menu-btn" @click="closeMenu">CLOSE</button>
        </div>

        <!-- 사운드 설정 -->
        <div v-if="showSound" class="sound-panel">
          <h3>SOUND SETTINGS</h3>

          <div class="sound-row">
            <span>Master</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="soundSettings.master"
              @input="onChangeSoundSlider"
            />
            <span>{{ (soundSettings.master * 100).toFixed(0) }}%</span>
          </div>

          <div class="sound-row">
            <span>BGM</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="soundSettings.bgm"
              @input="onChangeSoundSlider"
            />
            <span>{{ (soundSettings.bgm * 100).toFixed(0) }}%</span>
          </div>

          <div class="sound-row">
            <span>SFX</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="soundSettings.sfx"
              @input="onChangeSoundSlider"
            />
            <span>{{ (soundSettings.sfx * 100).toFixed(0) }}%</span>
          </div>

          <button class="menu-btn" @click="closeSoundMenu">BACK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from "phaser";
import { sceneMap } from "../phaser/manager/sceneRegistry.js";
import MiniMap from "../phaser/ui/MiniMap.vue";
import { initSlot } from "../phaser/manager/slotManager.js";
import { increaseStat, resetStat } from "../phaser/player/PlayerStats.js";
import { saveGame } from "../phaser/manager/saveManager.js";
import SoundManager from "../phaser/manager/SoundManager.js";
import DialogueUI from "../phaser/ui/DialogueUI.vue";
import IntroCutscene from "./IntroCutscene.vue";

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
  BarController,
} from "chart.js";
import CutscenePlayer from "../phaser/cutscene/CutscenePlayer.js";

const CUTSCENE_IMAGES = [
  "/static/assets/cutscene/intro_1.png",
  "/static/assets/cutscene/intro_2.png",
  "/static/assets/cutscene/intro_3.png",
  "/static/assets/cutscene/intro_4.png",
  "/static/assets/cutscene/intro_5.png",
];

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

  // 컷씬 UI
  components: { DialogueUI, MiniMap, IntroCutscene },

  data() {
    return {
      // ===== 플레이어 상태 =====
      playerHP: 100,
      playerMaxHP: 100,
      playerMP: 50,
      playerMaxMP: 50,
      playerEXP: 0,
      playerNextEXP: 100,
      playerLevel: 100,
      skillPoints: 0, // 씬에서 들어오긴 하지만, 실제 UI는 playerLevel 기반 계산 사용


      // 맵 이름, 미니맵 표시
      currentMapTitle: "",
      showMapTitle: false,
      mapTitleTimer: null,
      miniMapPlayer: null,
      miniMapMonsters: [],
      miniMapPortals: [],

      // 스텟창 플레이어
      playerSpriteSheet: "/static/assets/player.png",
      playerFrameIndex: 0, // 무조건 0번 고정
      playerFrameWidth: 30, // 실제 스프라이트 가로
      playerFrameHeight: 16, // 실제 스프라이트 세로
      playerFrameScale: 8,
      playerOffsetX: 2,
      statPoints: 0,
      maxStatPoints: 100,
      
      // 스탯창 무기
      weaponSpriteSheet: "/static/assets/player_staff.png",
      weaponFrameIndex: 1, // 무기는 항상 1번 프레임 표시
      weaponFrameWidth: 32, // 플레이어 스프라이트와 동일
      weaponFrameHeight: 16, // 필요 시 조정
      weaponFrameScale: 8, // Stats 창에 맞게 확대 (플레이어랑 같게)
      weaponOffsetX: 55, // 미세 조정 가능
      weaponOffsetY: 15,

      gemUsage: {
        damage: 0,
        manaCost: 0,
        cooldown: 0,
        defense: 0,
        luck: 0,
      },
      maxGemUsage: 20,
      gemBarChart: null,

      // 인벤토리
      inventory: { items: [] },

      items: {
        hpPotion: 'HP 포션',
        mpPotion: 'MP 포션',
        damageGemLow: '하급 보석\n(데미지)',
        damageGemMid: '중급 보석\n(데미지)',
        damageGemHigh: '상급 보석\n(데미지)',
        damageGemSuper: '특급 보석\n(데미지)',
        cooldownGemLow: '하급 보석\n(쿨타임)',
        cooldownGemMid: '중급 보석\n(쿨타임)',
        cooldownGemHigh: '상급 보석\n(쿨타임)',
        cooldownGemSuper: '특급 보석\n(쿨타임)',
        manaCostGemLow: '하급 보석\n(마나 소모)',
        manaCostGemMid: '중급 보석\n(마나 소모)',
        manaCostGemHigh: '상급 보석\n(마나 소모)',
        manaCostGemSuper: '특급 보석\n(마나 소모)',
        defenseGemLow: '하급 보석\n(방어력)',
        defenseGemMid: '중급 보석\n(방어력)',
        defenseGemHigh: '상급 보석\n(방어력)',
        defenseGemSuper: '특급 보석\n(방어력)',
        luckGemLow: '하급 보석\n(행운)',
        luckGemMid: '중급 보석\n(행운)',
        luckGemHigh: '상급 보석\n(행운)',
        luckGemSuper: '특급 보석\n(행운)',
      },

      // 슬롯들
      skillSlots: [null, null, null, null],
      itemSlots: [null, null],
      animSkillPoints: 0,

      // Phaser 연동
      textBar: "",
      scene: null,
      pollTimer: null,

      // UI
      showInventory: false,
      showStats: false,
      showSkills: false,
      showMenu: false,
      showSound: false,
      windowStack: [],
      topZIndex: 10000,

      // 사운드 설정
      soundSettings: {
        master: 1,
        bgm: 1,
        sfx: 1,
      },

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
          name: "fireball",
          icon: "fireball.png",
          levelReq: 1,
          maxLevel: 10,
          branchGroup: null,
          parents: [],
          col: 0,
          row: 1,
        },
        {
          id: "skill2",
          name: "buff",
          icon: "buff.png",
          levelReq: 5,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill1"],
          col: 1,
          row: 1,
        },
        {
          id: "skill3",
          name: "flameA",
          icon: "flameA.png",
          levelReq: 10,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill2"],
          col: 2,
          row: 1,
        },
        {
          id: "skill4a",
          name: "flameB",
          icon: "flameB.png",
          levelReq: 15,
          maxLevel: 5,
          branchGroup: "branch15",
          parents: ["skill3"],
          col: 3,
          row: 0,
        },
        {
          id: "skill4b",
          name: "firebomb",
          icon: "firebomb.png",
          levelReq: 15,
          maxLevel: 5,
          branchGroup: "branch15",
          parents: ["skill3"],
          col: 3,
          row: 2,
        },
        {
          id: "skill5a",
          name: "flameC",
          icon: "flameC.png",
          levelReq: 20,
          maxLevel: 5,
          branchGroup: "branch20",
          parents: ["skill4a"],
          col: 4,
          row: 0,
        },
        {
          id: "skill5b",
          name: "incendiary",
          icon: "incendiary.png",
          levelReq: 20,
          maxLevel: 5,
          branchGroup: "branch20",
          parents: ["skill4b"],
          col: 4,
          row: 2,
        },
        {
          id: "skill6",
          name: "meteor_S",
          icon: "meteor_S.png",
          levelReq: 25,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill5a", "skill5b"],
          col: 5,
          row: 1,
        },
        {
          id: "skill7",
          name: "meteor_M",
          icon: "meteor_M.png",
          levelReq: 30,
          maxLevel: 5,
          branchGroup: null,
          parents: ["skill6"],
          col: 6,
          row: 1,
        },
        {
          id: "skill8a",
          name: "meteor_L",
          icon: "meteor_L.png",
          levelReq: 35,
          maxLevel: 5,
          branchGroup: "branch35",
          parents: ["skill7"],
          col: 7,
          row: 0,
        },
        {
          id: "skill8b",
          name: "napalm",
          icon: "napalm.png",
          levelReq: 35,
          maxLevel: 5,
          branchGroup: "branch35",
          parents: ["skill7"],
          col: 7,
          row: 2,
        },
        {
          id: "skill9",
          name: "deathhand",
          icon: "deathhand.png",
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

      userId: null,

      // 인트로 일러스트 컷씬
      showIntroCutscene: false,
      cutsceneImages: CUTSCENE_IMAGES,
      hasStartedGame: false,

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

    selectedSkillDetail() {
      // 기본 가드
      if (!this.selectedSkill) return null;
      if (!this.scene || !this.scene.skills) return null;

      // skillNodes의 id -> Phaser 스킬 key로 매핑
      const node = this.selectedSkill;
      const phaserKey = this.skillTreeToPhaserMap(node.id) || node.name;

      const skillObj = this.scene.skills[phaserKey];
      if (!skillObj || !skillObj.base) return null;

      // description 은 Config.js 에서 SkillBase.base 로 들어온 것
      const description = skillObj.base.description || "";

      // 소비 마나 : SkillBase.getManaCost() 재사용 (스탯/젬 반영)
      let manaCost = 0;
      try {
        // getManaCost 내부에서 lastScene.playerStats 를 쓰니까, 혹시 몰라 세팅
        skillObj.lastScene = this.scene;
        if (typeof skillObj.getManaCost === "function") {
          manaCost = skillObj.getManaCost();
        } else {
          manaCost = skillObj.base.baseCost || 0;
        }
      } catch (e) {
        manaCost = skillObj.base.baseCost || 0;
      }

      // 쿨타임 : SkillBase 생성자에서 this.cooldown = base.cd / 1000 으로 넣어둠
      const cooldownSec =
        skillObj.cooldown != null
          ? skillObj.cooldown
          : (skillObj.base.cd || 0) / 1000;

      return {
        description,
        manaCost,
        cooldownSec,
      };
    },

    totalGemUsed() {
      const sum =
        this.gemUsage.damage +
        this.gemUsage.manaCost +
        this.gemUsage.cooldown +
        this.gemUsage.defense +
        this.gemUsage.luck;

      return Math.min(sum, this.maxGemUsage); // 0 ~ 20
    },
  },

  async mounted() {
    this.userId = localStorage.getItem('user_id')

    // 여기서 firstScene 여부 먼저 확인
    // 예시: /accounts/first-scene/<userId>/ 같은 형태
    const API_BASE = "http://121.162.159.56:8000";

    const firstRes = await fetch(`${API_BASE}/api/accounts/first-scene/${this.userId}/`);

    const firstData = await firstRes.json();
    this.showIntroCutscene = firstData.firstScene; // false면 컷씬 보여줌(첫 방문)
    if (!this.showIntroCutscene){
      this.$router.push({
        path: "/introCutscene",
        query: {
          userId: this.userId,
        },
      });
    }
    else{
      // Phaser 게임 구동
      let lastScene = "CastleLobby";

      const skillRes = await fetch(`http://121.162.159.56:8000/api/skill/${this.userId}/`);
      const skillData = await skillRes.json();
      this.skillState = skillData.skillLev;
      const count = this.skillNodes.length;

      for (let index = 0; index < count; index++) {
        let node = this.skillNodes[index];

        if (
          this.skillState[node.id] &&
          this.skillState[node.id] > 0 &&
          node.branchGroup
        ) {
          this.branchChosen[node.branchGroup] = node.id;
        }
      }

      const res = await fetch(`http://121.162.159.56:8000/api/nowLocation/${this.userId}/`);
      const data = await res.json();
      lastScene = data.nowLocation;

      const config = {
        type: Phaser.AUTO,
        width: 900,
        height: 700,
        parent: "game-container",
        physics: {
          default: "arcade",
          arcade: { gravity: { y: 0 }, debug: false },
        },
      };

      const game = new Phaser.Game(config);
      window.game = game;
      this.game = game;
      Object.entries(sceneMap).forEach(([key, scene]) => {
        game.scene.add(key, scene, false);
      });
      game.scene.start(lastScene, {userId: this.userId});

      // Vue 인스턴스를 Phaser game에 연결
      this.$nextTick(() => {
        game.vue = this;
      });

      // 사운드 매니저 초기화
      const sm = SoundManager.init(game);
      const vols = sm.getVolumes();
      this.soundSettings.master = vols.master;
      this.soundSettings.bgm = vols.bgm;
      this.soundSettings.sfx = vols.sfx;

      this._keyHandler = (e) => this.onGlobalKeyDown(e);
      window.addEventListener("keydown", this._keyHandler);
      window.addEventListener("resize", this.onWindowResize);

      /* ----------------------------------------------------------------- */
      initSlot(this.userId).then((slotData) => {
        const skillSlotData = slotData.skillSlots;
        const rawSlots = skillSlotData || [null, null, null, null];

        // DB에서 불러온 스킬을 Vue의 onDropSkillShortcut 방식으로 재적용
        rawSlots.forEach((skill, idx) => {
          if (!skill) return;

          const fakeEv = {
            dataTransfer: {
              getData: (key) => (key === "skill-id" ? skill : ""),
            },
          };
          this.onDropSkillShortcut(fakeEv, idx);
        });

        if (slotData.itemSlots) {
          this.itemSlots = slotData.itemSlots.map((i) =>
            i ? { name: i.name, icon: i.icon } : null
          );
        }
      });
      /* ----------------------------------------------------------------- */

      // Vue ← Phaser 동기화
      this.pollTimer = setInterval(() => {
        const main = game.scene.getScenes(true)[0];

        this.scene = main;
        
        // 맵 이름 띄우기
        if (main.mapName && this.currentMapTitle !== main.mapName) {
          this.currentMapTitle = main.mapName;
          this.triggerMapTitle();
        }

        if (!main || !main.playerStats) return;

        this.playerHP = Math.round(main.playerStats.hp);
        this.playerMaxHP = Math.round(main.playerStats.maxHp);
        this.playerMP = Math.round(main.playerStats.mp);
        this.playerMaxMP = Math.round(main.playerStats.maxMp);
        this.playerEXP = Math.round(main.playerStats.exp);
        this.playerNextEXP = Math.round(main.playerStats.nextExp);
        this.playerLevel = main.playerStats.level || 1;
        this.skillPoints = main.playerStats.skillPoints || 0; // 참고용
        this.statPoints = main.playerStats.point ?? 0;
        this.maxStatPoints = main.playerStats.maxPoint ?? 100;

        // Gem 사용량 업데이트 
        // Gem 사용량 업데이트 PlayerStats 필드에 맞게
        const g = main.playerStats || {};

        this.gemUsage.damage   = g.damageGem   ?? 0;     // damageGem
        this.gemUsage.manaCost = g.manaCostGem ?? 0;     // manaCostGem
        this.gemUsage.cooldown = g.cooldownGem ?? 0;     // cooldownGem
        this.gemUsage.defense  = g.defenseGem  ?? 0;     // defenseGem
        this.gemUsage.luck     = g.luckGem     ?? 0;     // luckGem



        this.weaponStats.damage = main.playerStats.damage;
        this.weaponStats.cooldown = main.playerStats.cooldown;
        this.weaponStats.manaCost = main.playerStats.manaCost;
        this.weaponStats.defense = main.playerStats.defense;
        this.weaponStats.luck = main.playerStats.luck;

        this.textBar = main.textBar || "";

        // 인벤토리
        this.inventory.items = (main.inventoryData.inventory.items || []).map((i) => ({...i, showName: this.items[i.name]}));

        // 아이템 슬롯
        if (main.inventoryData.itemSlots) {
          this.itemSlots = main.inventoryData.itemSlots.map((i) =>
            i ? { name: i.name, icon: i.icon } : null
          );
        }

        main.skillLevel = this.skillState;
      }, 100);
    }

    
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this._keyHandler);
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
    availableSkillPoints(newVal, oldVal) {
      // 스킬 초기화 애니메이션이 아닌,
      // 일반적인 증가라면 즉시 따라가도록 설정
      if (newVal > oldVal) {
        this.animSkillPoints = newVal;
      }
    },
    // gem 스탯이 바뀔 때마다 차트 자동 업데이트
    gemUsage: {
      deep: true,
      handler() {
        this.updateGemChart();
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
    /* 저장 */
    save() {
      this.playUiClick();
      saveGame(this.userId, this.skillState);
    },

    /* ===================
    gem 스탯 및 레이더 차트
    ====================== */
    initGemChart() {
      const canvas = this.$refs.gemChartCanvas;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      if (this.gemBarChart) this.gemBarChart.destroy();

      this.gemBarChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Damage", "ManaCost", "Cooldown", "Defense", "Luck"],
          datasets: [
            {
              data: [
                this.gemUsage.damage,
                this.gemUsage.manaCost,
                this.gemUsage.cooldown,
                this.gemUsage.defense,
                this.gemUsage.luck,
              ],
              backgroundColor: [
                "rgba(255, 80, 80, 0.8)",   // 빨강
                "rgba(120, 200, 255, 0.8)", // 하늘
                "rgba(255, 255, 255, 0.8)", // 흰색
                "rgba(255, 230, 120, 0.8)", // 노랑
                "rgba(150, 255, 150, 0.8)", // 연두
              ],
              borderColor: "rgba(255,255,255,0.45)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: {
            x: {
              min: 0,
              max: this.maxGemUsage,
              ticks: { color: "#fff" },
              grid: { color: "rgba(255,255,255,0.2)" },
            },
            y: {
              ticks: { color: "#fff" },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    },

    updateGemChart() {
      if (!this.gemBarChart) return;

      this.gemBarChart.data.datasets[0].data = [
        this.gemUsage.damage,
        this.gemUsage.manaCost,
        this.gemUsage.cooldown,
        this.gemUsage.defense,
        this.gemUsage.luck,
      ];
      this.gemBarChart.update();
    },

    // 맵 이름 띄우기
    triggerMapTitle() {
      this.showMapTitle = true;

      if (this.mapTitleTimer) clearTimeout(this.mapTitleTimer);

      // 2.2초 후 자연스럽게 사라짐
      this.mapTitleTimer = setTimeout(() => {
        this.showMapTitle = false;
      }, 2200);
    },

    setMapTitle(name) {
      this.currentMapTitle = name;
      this.triggerMapTitle();   // 배너 표시
    },

    // 미니맵 띄우기
    updateMiniMap(payload) {
      this.miniMapPlayer = payload.player || null;
      this.miniMapMonsters = payload.monsters || [];
      this.miniMapPortals = payload.portals || [];

      // 맵 이름 연동
      if (payload.mapName && this.currentMapTitle !== payload.mapName) {
        this.currentMapTitle = payload.mapName;
      }
    },


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
        increaseStat(key);
        const sm = SoundManager.getInstance();
        sm && sm.playStatIncrease();
      }
    },

    resetWeaponStats() {
      resetStat();
    },

    /* ===================
       스킬 트리 로직
    ====================== */
    skillTreeToPhaserMap(id) {
      return (
        {
          skill1: "fireball",
          skill2: "buff",
          skill3: "flameA",
          skill4a: "flameB",
          skill5a: "flameC",
          skill4b: "firebomb",
          skill5b: "incendiary",
          skill6: "meteor_S",
          skill7: "meteor_M",
          skill8a: "meteor_L",
          skill8b: "napalm",
          skill9: "deathhand",
        }[id] || null
      );
    },

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

    syncSkillLevelToPhaser() {
      if (!this.scene || !this.scene.skills) return;

      for (const [nodeId, lv] of Object.entries(this.skillState)) {
        const phaserKey = this.skillTreeToPhaserMap(nodeId);
        if (!phaserKey) continue;

        const skillObj = this.scene.skills[phaserKey];
        if (!skillObj) continue;

        skillObj.level = lv; // Phaser 스킬 레벨 직접 반영
      }
    },

    levelUpSkill(node) {
      if (!this.canLevelUp(node)) return;

      // 사운드 instance 받기
      const sm = SoundManager.getInstance();

      // 분기 그룹이면, 첫 투자 시 해당 분기로 고정
      if (node.branchGroup && !this.branchChosen[node.branchGroup]) {
        this.branchChosen[node.branchGroup] = node.id;
      }

      this.skillState = {
        ...this.skillState,
        [node.id]: this.skillLevelOf(node.id) + 1,
      };

      // UI에 즉시 반영 (사용 가능한 스킬 포인트 감소)
      this.animSkillPoints = this.availableSkillPoints;

      // 레벨업 후에도 라인 강조 등 반영 위해 다시 그림
      this.$nextTick(() => {
        this.drawSkillLines();
        this.syncSkillLevelToPhaser(); // Phaser 반영
      });

      // 스킬/스탯 공용 레벨업 SFX
      if (sm) sm.playStatIncrease();
    },

    nodeCssClasses(node) {
      const lv = this.skillLevelOf(node.id);
      const unlocked = this.isUnlocked(node);
      const branchLocked = this.isLockedByBranch(node);

      return {
        "is-learned": lv >= 1, // ✔ 레벨 1 이상일 때만 색칠
        "is-unlocked-only": lv === 0 && unlocked, // ✔ 해금만 되었으면 border는 회색
        "is-locked": !unlocked, // ✔ 완전 잠금
        "is-branch-locked": branchLocked,
        "is-maxed": lv >= node.maxLevel,
        "is-selected": this.selectedSkillId === node.id,
      };
    },

    resetAllSkills() {
      // 모든 스킬 레벨 0으로
      const resetState = {};
      for (let key in this.skillState) resetState[key] = 0;
      this.skillState = resetState;

      // 모든 분기 선택 초기화
      this.branchChosen = {
        branch15: null,
        branch20: null,
        branch35: null,
      };

      // 선택된 스킬 해제
      this.selectedSkillId = null;

      // QWER 슬롯도 스킬 없도록 초기화
      this.skillSlots = [null, null, null, null];

      if (this.scene?.setSkillSlots) {
        this.scene.setSkillSlots([null, null, null, null]);
      }

      this.$nextTick(() => {
        this.drawSkillLines();
      });

      /* ===========================
      스킬 포인트 환산 애니메이션
      =========================== */
      const start = 0;
      const end = this.availableSkillPoints; // 계산된 실제 값
      const duration = 600; // 0.6초
      const startTime = performance.now();

      const animate = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        this.animSkillPoints = Math.floor(start + (end - start) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.animSkillPoints = end; // 정확히 맞춰줌
        }
      };

      // 애니메이션 시작
      this.animSkillPoints = 0;
      requestAnimationFrame(animate);
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
      const inner = this.$refs.skillTree;
      const scrollWidth = inner.scrollWidth;
      const scrollHeight = inner.scrollHeight;

      svg.setAttribute("width", scrollWidth);
      svg.setAttribute("height", scrollHeight);
      svg.setAttribute("viewBox", `0 0 ${scrollWidth} ${scrollHeight}`);

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

          // 잠김 여부 계산
          const childLocked = this.isLockedByBranch(node);
          const parentLocked = this.isLockedByBranch(
            this.skillNodes.find((n) => n.id === pid)
          );

          // 1) 기본 회색
          let color = "#777";
          let width = 1.4;

          // 2) 잠긴 경우(분기 미선택 노드)
          if (parentLocked || childLocked) {
            color = "#333";
            width = 1.2;
          }
          // 3) 그 외: 부모/자식 중 하나라도 배웠다면 초록
          else if (parentLearned || childLearned) {
            color = "#4caf50";
            width = 2;
          }
          line.setAttribute("stroke", color);
          line.setAttribute("stroke-width", width);
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
    removeFromStack(name) {
      const idx = this.windowStack.lastIndexOf(name);
      if (idx !== -1) {
        this.windowStack.splice(idx, 1);
      }
    },

    onGlobalKeyDown(e) {
      if (e.key === "i" || e.key === "I") this.toggleInventory();
      if (e.key === "p" || e.key === "P") this.toggleStats();
      if (e.key === "k" || e.key === "K") this.toggleSkills();

      if (e.key === "Escape") {
        // Vue 스택에 있는 창이 있으면 그 창만 닫고 끝
        const last = this.windowStack.pop();

        if (last) {
          this.playUiClose(); // 창 닫기 사운드

          if (last === "inventory") this.showInventory = false;
          if (last === "stats") this.showStats = false;
          if (last === "skills") this.showSkills = false;
          if (last === "menu") this.showMenu = false;

          return;
        }

        // Vue 창이 아무것도 안 떠 있으면 메뉴 열기
        this.openMenu();
      }
    },

    cooldownRatio(skillName) {
      if (!this.scene || !this.scene.skills) return 0;

      const skill = this.scene.skills[skillName];
      if (!skill) return 0;

      const now = this.scene.time.now;
      const left = Math.max(0, skill.onCooldownUntil - now);
      const total = skill.cooldown * 1000; // cooldown(sec) → ms

      if (total <= 0) return 0;

      // 1(풀쿨) → 0(쿨 종료)
      return left / total;
    },

    cooldownSectorPath(skillName) {
      const ratio = this.cooldownRatio(skillName);

      // 남은 쿨타임이 없으면 path 없음
      if (ratio <= 0) {
        return "";
      }

      // SVG 좌표계 기준 원 중심/반지름
      const cx = 27;
      const cy = 27;
      const r = 27;

      // 시작 각도(위쪽에서 시작, 시계방향 진행)
      const startAngle = -90;               // deg, 12시 방향
      const endAngle = startAngle + 360 * ratio;

      const toRad = (deg) => (Math.PI / 180) * deg;

      const startRad = toRad(startAngle);
      const endRad = toRad(endAngle);

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      // 180도 초과하면 large-arc-flag = 1
      const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

      // M: 중심 → L: 시작점 → A: 호 → Z: 다시 중심
      const d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      return d;
    },


    cooldownPathStyle(skillName) {
      if (!this.scene || !this.scene.skills) return {};

      const s = this.scene.skills[skillName];
      if (!s) return {};

      const now = this.scene.time.now;
      const left = Math.max(0, s.onCooldownUntil - now);
      const total = s.cooldown * 1000;

      const ratio = left / total; // 1 → 0

      return {
        strokeDasharray: `${100 * ratio}, 100`,
        transition: "stroke-dasharray 0.1s linear"
      };
    },


    toggleInventory() {
      this.showInventory = !this.showInventory;
      if (this.showInventory) {
        this.windowStack.push("inventory");
        this.playUiOpen(); // 창 열기 사운드
        this.$nextTick(() => {
          const el = this.$el.querySelector("#inventory");
          this.makeDraggable(el);
        });
      } else {
        this.removeFromStack("inventory");   
        this.playUiClose(); // 창 닫기 사운드
      }
    },

    toggleStats() {
      this.showStats = !this.showStats;
      if (this.showStats) {
        this.windowStack.push("stats");
        this.playUiOpen(); // 창 열기 사운드
        this.$nextTick(() => {
          const el = this.$el.querySelector("#stats");
          this.makeDraggable(el);
          this.initWeaponRadar();
        });
      } else {
        this.removeFromStack("stats");   
        this.playUiClose(); // 창 닫기 사운드
      }
    },

    toggleSkills() {
      this.showSkills = !this.showSkills;
      if (this.showSkills) {
        this.windowStack.push("skills");
        this.playUiOpen(); // 창 열기 사운드
        this.$nextTick(() => {
          const el = this.$refs.skillsModal;
          this.makeDraggable(el);
          this.drawSkillLines();
        });
      } else {
        this.removeFromStack("skills");   // ← 추가!
        this.playUiClose(); // 창 닫기 사운드
      }
    },

    closeMenu() {
      this.showMenu = false;
      this.playUiClose(); // 창 닫기 사운드
    },
    openMenu() {
      this.showMenu = true;
      this.showSound = false;
      this.windowStack.push("menu");
      this.playUiOpen(); // 창 열기 사운드
    },

    openSoundMenu() {
      this.showSound = true;
      this.playUiClick();
    },
    closeSoundMenu() {
      this.showSound = false;
      this.playUiClick();
    },

    /* ===================
       드래그 가능한 모달
    ====================== */
    makeDraggable(el) {
      if (!el) return;
      const header =
        el.querySelector(".modal-header") || el.querySelector("h3");
      if (!header) return;

      header.onmousedown = (e) => {
        let startX = e.clientX;
        let startY = e.clientY;

        const rect = el.getBoundingClientRect();
        let offsetX = startX - rect.left;
        let offsetY = startY - rect.top;

        // 최상단으로 올리기
        this.topZIndex += 1;
        el.style.zIndex = this.topZIndex;

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
        const node = this.skillNodes.find(
          (n) => n.id === skillId || n.name === skillId
        );
        if (!node) return;

        if (!this.isUnlocked(node) || this.isLockedByBranch(node)) return;

        const phaserKey = this.skillTreeToPhaserMap(skillId) || skillId;
        if (!phaserKey) return;

        // id = phaserKey 로 완전 통일 (스킬 슬롯)
        newSkill = {
          id: phaserKey,
          phaserKey,
          name: phaserKey,
          icon: `/static/assets/skill_icon/${node.icon}`,
        };
      } else {
        // fallback (기존 skill1~8)
        const idxStr = ev.dataTransfer.getData("skill-idx");
        if (idxStr === "") return;
        const idx = parseInt(idxStr, 10);
        const skill = this.allSkills[idx];
        if (!skill) return;

        newSkill = {
          id: skill.name,
          phaserKey: skill.name,
          name: skill.name,
          icon: skill.icon,
        };
      }

      // 중복 제거 (phaserKey 기준)
      const existingIdx = this.skillSlots.findIndex((s, i) => {
        return s && s.phaserKey === newSkill.phaserKey && i !== slotIdx;
      });

      if (existingIdx !== -1) {
        this.skillSlots.splice(existingIdx, 1, null);
      }

      // 슬롯에 저장
      this.skillSlots.splice(slotIdx, 1, newSkill);

      // Phaser 전달
      if (this.scene?.setSkillSlots) {
        const names = this.skillSlots.map((s) =>
          s ? { name: s.phaserKey } : null
        );
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
      const skill = this.scene.skills[skillName];
      if (!skill) return 0;

      const now = this.scene.time.now;
      return Math.max(0, skill.onCooldownUntil - now);
    },

    skillLevel(skillName) {
      const tmpId = this.skillNodes.filter(skill => skill.name === skillName);
      if (!this.scene || !this.scene.skills) return 1;
      return this.skillState[tmpId[0].id] || 0;
    },

    /* ===================
      사운드 설정 적용
    ====================== */
    applySoundSettings() {
      const sm = SoundManager.getInstance();
      if (!sm) return;
      sm.setMasterVolume(this.soundSettings.master);
      sm.setBgmVolume(this.soundSettings.bgm);
      sm.setSfxVolume(this.soundSettings.sfx);
    },

    onChangeSoundSlider() {
      this.applySoundSettings();
    },

    /* ===================
      UI 사운드 헬퍼
    ====================== */
    playUiOpen() {
      const sm = SoundManager.getInstance();
      sm && sm.playUiOpen();
    },

    playUiClose() {
      const sm = SoundManager.getInstance();
      sm && sm.playUiClose();
    },

    playUiClick() {
      const sm = SoundManager.getInstance();
      sm && sm.playUiClick();
    },
  },
};
</script>

<style scoped>
/* ===================== 전체 레이아웃 ===================== */
#app-wrap {
  display: flex;
  justify-content: center;
  padding: 8px;
  font-family: Arial, sans-serif;
  background: #050509;
}

#game-container {
  width: 900px;
  height: 700px;
  background: #000;
  position: relative;

}

/* ===================== 오버레이 HUD 공통 ===================== */
.hud-root {
  position: absolute;
  inset: 0;
  pointer-events: none; /* 기본은 통과, 필요한 곳만 다시 활성화 */
  z-index: 100;
}

/* ---------- 좌측 상단 Lv + HP/MP/EXP ---------- */
.hud-top-left-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 230px;
  padding: 8px 10px;
  border-radius: 10px;
  background: radial-gradient(circle at top left,
    rgba(43, 52, 64, 0.2) 0%,
    rgba(21, 24, 32, 0.2) 55%,
    rgba(12, 13, 18, 0.2) 100%
  );  
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff;
  pointer-events: auto;
}

.hud-level-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.hud-level-text {
  font-weight: bold;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffaf3a, #ffdd7b);
  color: #31210a;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
}

.hud-shortcuts-text {
  margin-left: auto;
  font-size: 10px;
  color: #c7d5ff;
  opacity: 0.85;
}

.hud-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.hud-bar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hud-bar-label {
  width: 34px;
  font-size: 11px;
  text-align: right;
  opacity: 0.9;
}

.hud-bar-label.hp {
  color: #ff7b7b;
}
.hud-bar-label.mp {
  color: #7db3ff;
}
.hud-bar-label.exp {
  color: #80e680;
}

/* 기존 bar 스타일 재활용 + 다듬기 */
.bar-wrap {
  position: relative;
  flex: 1;
  height: 18px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5a5a, #c33);
  transition: width 0.12s linear;
}

.bar-fill.mp {
  background: linear-gradient(90deg, #4b86ff, #39c);
}

.bar-fill.exp {
  background: linear-gradient(90deg, #74e38a, #3c9);
}

.bar-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 18px;
  font-size: 11px;
  top: 0;
  left: 0;
  text-shadow: 0 0 3px #000;
}

.hud-skill-pts-row {
  margin-top: 4px;
  font-size: 11px;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  color: #f7e99b;
}

.hud-skill-pts-sub {
  color: #cfd3ff;
  opacity: 0.8;
}

/* ---------- 하단 중앙 스킬/아이템 숏컷 바 ---------- */
.hud-bottom-center-panel {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: auto;
}

.shortcut-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.0));
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.0);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.skill-row {
  margin-bottom: 2px;
}

/* 기존 shortcut-slot 스타일 재구성 */
.shortcut-slot {
  width: 54px;
  height: 54px;
  background: radial-gradient(circle at 30% 20%, #333 0, #111 60%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgba(36, 33, 33, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
  cursor: pointer;
}

.shortcut-slot.empty {
  opacity: 0.45;
  border-style: dashed;
}

.slot-item img {
  width: 38px;
  height: 38px;
  image-rendering: pixelated;
}

.slot-key {
  position: absolute;
  right: 4px;
  bottom: 3px;
  font-size: 10px;
  color: #cfd3ff;
  text-shadow: 0 0 3px #000;
}

.slot-count {
  position: absolute;
  right: 4px;
  top: 3px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.65);
  padding: 1px 4px;
  border-radius: 5px;
  color: #fff;
}

.slot-lv {
  position: absolute;
  left: 4px;
  bottom: 3px;
  font-size: 10px;
  color: #fff;
  text-shadow: 0 0 3px #000;
}

.item-slot {
  width: 60px;
}

/* ---------- 좌측 하단 로그 ---------- */
.hud-bottom-left-log {
  position: absolute;
  background: rgba(0,0,0,0.0);
  border: none;
  box-shadow: none;
  left: 12px;
  bottom: 12px;
  width: 260px;
  pointer-events: none;
}

.log-label {
  font-size: 11px;
  color: #9fb5ff;
  margin-left: 4px;
  margin-bottom: 2px;
  opacity: 0.85;
}

.log-content {
  min-height: 38px;
  max-height: 80px;
  padding: 6px 8px;
  font-size: 12px;
  color: #e4e7ff;
  background: radial-gradient(circle at top left, rgba(63, 74, 110, 0.2), rgba(12, 14, 24, 0.25));
  border-radius: 8px;
  border: 1px solid rgba(124, 148, 255, 0.4);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===================== 맵 이름 ===================== */
.map-title-banner {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  
  padding: 8px 22px;
  font-size: 26px;
  font-weight: bold;
  color: #fff2cc;

  font-family: "Press Start 2P", monospace; /* 픽셀 느낌 폰트 */
  text-shadow: 3px 3px #000;

  background: rgba(0,0,0,0.45);
  border: 2px solid rgba(255,255,255,0.25);
  border-radius: 8px;

  animation: mapTitleFade 2.2s ease-out forwards;
  z-index: 99999;
  pointer-events: none;
}

@keyframes mapTitleFade {
  0%   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  85%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
}

/* ===================== 모달 공통 ===================== */
.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at top, #24273a 0, #151624 55%, #090a10 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px;
  color: #fff;
  z-index: 9999;
  border-radius: 10px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.85);
}

.modal-header {
  background: linear-gradient(90deg, #2f3e6a, #3f5a92);
  padding: 6px 10px;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header-sub {
  margin-left: auto;
  font-size: 11px;
  font-weight: normal;
  color: #e0e8ff;
}

/* ===================== 배틀메이지 스타일 스킬 창 ===================== */
.skills-modal {
  width: 860px;
  max-height: 580px;
}

.skill-main {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

/* 좌측 상세 패널 */
.skill-detail-panel {
  width: 270px;
  background: rgba(10, 11, 20, 0.98);
  border-radius: 10px;
  padding: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.detail-empty {
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}

.detail-icon-placeholder {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  background: radial-gradient(circle at 30% 20%, #444 0, #1c1c1c 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
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
  color: #bbbbff;
  margin-bottom: 10px;
}

.detail-levelup-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #63ff9e, #34d88a);
  color: #111;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
}

.detail-levelup-btn:disabled {
  background: #555;
  cursor: not-allowed;
  color: #ccc;
}

.skill-detail-body {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.skill-desc {
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 14px;
  color: #f8e3b4;
  text-shadow: 1px 1px 0 #000;
  white-space: pre-line;
}

/* 정보 라벨 + 값 그리드 */
.skill-info {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 8px;
  column-gap: 12px;
}

.skill-info .label {
  font-size: 12px;
  color: #c8b68a;
}

.skill-info .value {
  font-size: 12px;
  text-align: right;
  font-weight: bold;
  color: #ffe7a8;
}

.detail-help {
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
  margin-bottom: 6px;
}

.detail-sp-info {
  margin-bottom: 8px;
  font-size: 12px;
  color: #ffd86b;
}

.detail-reset-btn {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #f45b5b, #d63b3b);
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.detail-reset-btn:hover {
  filter: brightness(1.05);
}

/* 우측 트리 영역 */
.skill-tree-wrapper {
  flex: 1;
  background: rgba(8, 9, 16, 0.96);
  border-radius: 10px;
  padding: 8px;
  overflow-x: auto;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
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
  column-gap: 32px;
  row-gap: 16px;
  padding: 10px 16px;
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
  border-radius: 12px;
  background: radial-gradient(circle at 30% 20%, #333 0, #111 65%);
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s, filter 0.15s;
}

.skill-icon {
  width: 46px;
  height: 46px;
  image-rendering: pixelated;
}

.detail-icon-img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  object-fit: contain;
}

.skill-lv-text {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  color: #fff;
  text-shadow: 0 0 3px #000;
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
  opacity: 0.2;
  border-color: #222;
  filter: grayscale(1);
}

.skill-node.is-unlocked-only .skill-slot {
  border-color: #888;
}

.skill-node.is-learned .skill-slot {
  border-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.45);
}

.skill-node.is-maxed .skill-slot {
  border-color: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.6);
}

.skill-node.is-selected .skill-slot {
  box-shadow: 0 0 0 2px #ffd54f, 0 0 18px rgba(255, 213, 79, 0.7);
  transform: translateY(-1px);
}

/* 푸터 텍스트 */
.skill-footer-text {
  margin-top: 6px;
  font-size: 12px;
  color: #ccc;
  text-align: right;
}

.cooldown-mask {
  position: absolute;
  width: 54px;
  height: 54px;
  top: 0;
  left: 0;
  z-index: 5;
  pointer-events: none;
}

.cooldown-sector {
  fill: rgba(0, 0, 0, 0.55);
}

.slot-cd-text {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 11px;
  background: rgba(0,0,0,0.55);
  padding: 1px 4px;
  border-radius: 4px;
  color: #fff;
}

/* ===================== 인벤토리 ===================== */
#inventory {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 440px;
  max-height: 70vh;
  overflow: auto;
  background: radial-gradient(circle at top, #263654 0, #151720 55%, #07080d 100%);
  border: 1px solid rgba(111, 148, 255, 0.45);
  padding: 8px 10px 10px 10px;
  color: #fff;
  z-index: 9999;
  border-radius: 10px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.85);
}

#inventory h3 {
  background: linear-gradient(90deg, #24406b, #36699c);
  padding: 6px 10px;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
  font-size: 13px;
  margin: -4px -4px 8px -4px;
}

.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inv-item {
  width: 76px;
  height: 90px;
  background: #101119;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: grab;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
}

.inv-item img {
  width: 46px;
  height: 46px;
  image-rendering: pixelated;
}

.inv-info {
  margin-top: 4px;
  text-align: center;
  max-width: 70px;
}

.inv-name {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 긴 이름 말줄임 처리 */
  white-space: pre-line;  /* 개행 문자 사용 */
}

.inv-count {
  font-size: 11px;
  color: #ddd;
  margin-top: 1px;
}

.window-footer {
  margin-top: 6px;
  color: #ccc;
  font-size: 11px;
}

/* ===================== Stats 창 ===================== */
#stats {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 540px;
  max-height: 680px;
  background: radial-gradient(circle at top, #2a2351 0, #161725 55%, #080810 100%);
  border: 1px solid rgba(176, 140, 255, 0.55);
  padding: 8px 10px 10px 10px;
  overflow: visible;
  color: #fff;
  z-index: 9999;
  border-radius: 10px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.85);
}

#stats h3 {
  background: linear-gradient(90deg, #5b3fb6, #7a57d3);
  padding: 6px 10px;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
  font-size: 13px;
  margin: -4px -4px 8px -4px;
}

.gem-usage-section {
  margin-top: 12px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  box-shadow: inset 0 0 6px rgba(0,0,0,0.45);
}

.gem-title {
  font-size: 13px;
  font-weight: bold;
  color: #ffd86b;
  margin-bottom: 8px;
}

.gem-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.gem-label {
  width: 80px;
  font-size: 14px;
  color: #000;
  font-weight: bold;
  border-radius: 5px;
}

.gem-bar {
  flex: 1;
  height: 20px;
  background: rgba(255,255,255,0.08);
  border-radius: 7px;
  overflow: hidden;
}

.gem-bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.25s;
}

.gem-value {
  width: 30px;
  text-align: center;
  font-size: 12px;
}

/* Gem colors */
.red { background: rgba(255, 80, 80, 0.85); }
.sky { background: rgba(120, 200, 255, 0.85); }
.white { background: rgba(255, 255, 255, 0.85); }
.yellow { background: rgba(255, 230, 120, 0.85); }
.green { background: rgba(150, 255, 150, 0.85); }


/* ===== 사분면 레이아웃 ===== */
.stats-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 8px;
  margin-top: 4px;
}

.quad {
  background: rgba(7, 7, 13, 0.96);
  border-radius: 10px;
  padding: 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.quad-title {
  font-size: 13px;
  margin-bottom: 4px;
  color: #f0e6ff;
}

/* ===================== 개별 사분면 ===================== */
.quad-player-image {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

.quad-weapon-image {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
}

/* 플레이어 / 무기 이미지 placeholder */
.image-placeholder {
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #aaa;
}

.image-placeholder.framed {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at center, #27293a 0, #151622 65%);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.85);
}

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
  gap: 4px;
  font-size: 13px;
}

.stats-grid b {
  display: inline-block;
  min-width: 70px;
  color: #ffdf88;
}

.quad-radar {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

/* ===================== 레이더 차트 ===================== */
.radar-wrapper {
  width: 100%;
  height: 130px;
  margin-bottom: 6px;
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
  min-width: 80px;
  text-align: right;
}

.weapon-stat-value {
  min-width: 60px;
  text-align: center;
}

.weapon-up-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: linear-gradient(135deg, #63ff9e, #34d88a);
  font-weight: bold;
}

.weapon-up-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.weapon-reset-btn {
  margin-top: 6px;
  width: 100%;
  padding: 5px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #f45b5b, #d63b3b);
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.weapon-reset-btn:hover {
  filter: brightness(1.05);
}

/* ============== 메뉴창 ================= */
.menu-modal {
  width: 360px;
}

.menu-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.menu-btn {
  padding: 10px;
  background: linear-gradient(135deg, #383c4f, #262738);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
  transition: transform 0.08s, box-shadow 0.08s, filter 0.08s;
}

.menu-btn:hover {
  filter: brightness(1.07);
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.9);
}

/* ============== 사운드창 ================= */
.sound-panel {
  margin-top: 16px;
  padding: 10px;
  background: rgba(10, 11, 20, 0.96);
  border-radius: 8px;
  font-size: 13px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.sound-panel h3 {
  font-size: 13px;
  margin-bottom: 8px;
}

.sound-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sound-row span:first-child {
  width: 70px;
}
.sound-row input[type="range"] {
  flex: 1;
}
</style>
