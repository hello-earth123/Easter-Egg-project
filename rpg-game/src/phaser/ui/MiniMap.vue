<template>
  <div class="minimap-wrap">
    <div class="mini-title">{{ mapName }}</div>
    <canvas ref="canvas" class="mini-canvas"></canvas>
  </div>
</template>

<script>
export default {
  props: {
    mapName: String,
    player: Object,
    monsters: Array,
    portals: Array
  },

  mounted() {
    this.ctx = this.$refs.canvas.getContext("2d");
    this.renderLoop();
  },

  methods: {
    renderLoop() {
      this.drawMiniMap();
      requestAnimationFrame(this.renderLoop);
    },

    drawMiniMap() {
      const canvas = this.$refs.canvas;
      const ctx = this.ctx;

      const MINI_W = canvas.width = 160;
      const MINI_H = canvas.height = 160;

      const MAP_W = 1600;
      const MAP_H = 1216;

      const sx = MINI_W / MAP_W; 
      const sy = MINI_H / MAP_H; 
      const s = Math.min(sx, sy); // 0.1

      ctx.clearRect(0, 0, MINI_W, MINI_H);

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, MINI_W, MINI_H);

      // 플레이어
      if (this.player) {
        ctx.fillStyle = "#44ff66";
        ctx.fillRect(this.player.x * s - 2, this.player.y * s - 2, 4, 4);
      }

      // 몬스터 표시
      ctx.fillStyle = "#ff4444";
      this.monsters.forEach(m => {
        ctx.fillRect(m.x * s - 2, m.y * s - 2, 4, 4);
      });

      // 포탈 표시
      ctx.fillStyle = "#66ccff";
      this.portals.forEach(p => {
        ctx.fillRect(p.x * s - 3, p.y * s - 3, 6, 6);
      });
    }
  }
};
</script>

<style scoped>
.minimap-wrap {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 160px;
  padding: 6px;
  background: rgba(0,0,0,0.35);
  border: 2px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.mini-title {
  font-size: 11px;
  text-align: center;
  color: #ffffff;
  opacity: 0.8;
  margin-bottom: 4px;
  font-family: "Press Start 2P", monospace;
}

.mini-canvas {
  width: 160px;
  height: 160px;
  image-rendering: pixelated;
}
</style>
