<template>
  <div class="dialogue-ui" v-if="active">
    <div class="dialogue-bg"></div>
    <div class="dialogue-text">{{ text }}</div>
    <div class="dialogue-hint">SPACE ▶</div>
  </div>
</template>

<script>
export default {
  name: "DialogueUI",
  data() {
    return {
      active: false,
      text: "",
      waitForNext: null, // Phaser에서 다음 대사를 기다릴 때 resolve 함수 저장
    };
  },
  methods: {
    showLine(line) {
      this.active = true;
      this.text = "";
      return new Promise((resolve) => {
        this.waitForNext = resolve;
        this.typeLine(line);
      });
    },
    typeLine(full) {
      let idx = 0;
      const speed = 25;

      const timer = setInterval(() => {
        if (idx >= full.length) {
          clearInterval(timer);
          return;
        }
        this.text = full.slice(0, idx);
        idx++;
      }, speed);
    },
    skip() {
      if (this.waitForNext) {
        this.waitForNext(); // Phaser cutscene player에게 신호
        this.waitForNext = null;
      }
    },
    hide() {
      this.active = false;
      this.text = "";
    },
  },
};
</script>

<style scoped>
.dialogue-ui {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  z-index: 99999;
  pointer-events: none;
}

.dialogue-bg {
  width: 100%;
  height: 160px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 14px;
}

.dialogue-text {
  position: absolute;
  bottom: 70px;
  left: 40px;
  right: 40px;
  font-size: 28px;
  color: white;
  line-height: 34px;
}

.dialogue-hint {
  position: absolute;
  bottom: 25px;
  right: 40px;
  font-size: 20px;
  color: #bbbbbb;
}
</style>
