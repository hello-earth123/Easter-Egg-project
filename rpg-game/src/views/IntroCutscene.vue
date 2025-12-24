<template>
  <div class="cutscene-root" v-if="visible">
    <transition name="fade" mode="out-in">
      <img
        :key="currentIndex"
        class="cutscene-img"
        :src="images[currentIndex]"
        alt="cutscene"
      />
    </transition>

    <div class="hint">
      스페이스: 다음 ({{ currentIndex + 1 }} / {{ images.length }})
    </div>
  </div>
</template>

<script>
import img01 from "../assets/cutscene/intro_1.png";
import img02 from "../assets/cutscene/intro_2.png";
import img03 from "../assets/cutscene/intro_3.png";
import img04 from "../assets/cutscene/intro_4.png";
import img05 from "../assets/cutscene/intro_5.png";

export default {
  name: "IntroCutscene",
  emits: ["finished"],
  data() {
    return {
      userId: Number(this.$route.query.userId),
      images: [
        img01,
        img02,
        img03,
        img04,
        img05,
      ],
      currentIndex: 0,
      visible: true,
    };
  },
  mounted() {
    this._onKey = (e) => {
      if (e.code === "Space" || e.key === "Enter") this.next();
    };
    window.addEventListener("keydown", this._onKey);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this._onKey);
  },
  methods: {
    async next() {
      if (this.currentIndex < this.images.length - 1) {
        this.currentIndex += 1;
      } else {
        this.visible = false;
        await fetch(`http://121.162.159.56:8000/api/accounts/first-scene/${this.userId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // body 없어도 됨
        });
        this.$router.push('/game');
      }
    },
  },
};
</script>

<style scoped>
.cutscene-root {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 999999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cutscene-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.hint {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.75);
  font-size: 12px;
}

/* Fade in/out */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
