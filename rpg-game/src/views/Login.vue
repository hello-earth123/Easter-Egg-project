<template>
  <div class="auth-screen">
    <div class="bg-scanlines" aria-hidden="true"></div>
    <div class="ember ember-1" aria-hidden="true"></div>
    <div class="ember ember-2" aria-hidden="true"></div>
    <div class="ember ember-3" aria-hidden="true"></div>

    <main class="panel" role="main" aria-label="프라가라흐 로그인">
      <header class="header">
        <div class="badge">2D PIXEL RPG</div>
        <h1 class="title">프라가라흐</h1>
        <p class="subtitle">로그인</p>
      </header>

      <section class="card">
        <h2 class="card-title">로그인</h2>

        <label class="field">
          <span class="label">이메일</span>
          <input
            v-model.trim="form.email"
            class="input"
            placeholder="mage@pragarach.com"
            type="email"
            autocomplete="email"
            required
            :disabled="isLoading"
          />
        </label>

        <label class="field">
          <span class="label">비밀번호</span>
          <input
            v-model="form.password"
            class="input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            :disabled="isLoading"
            @keydown.enter.prevent="login"
          />
        </label>

        <button class="btn primary" @click="login" :disabled="isLoading || !canSubmit">
          <span class="btn-glow" aria-hidden="true"></span>
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>

        <div class="row">
          <button class="btn ghost" @click="$router.push('/register')" :disabled="isLoading">
            새 캐릭터 생성(회원가입)
          </button>
          <button class="btn ghost subtle" @click="fillDemo" :disabled="isLoading" title="개발/테스트용">
            데모 입력
          </button>
        </div>

        <p v-if="statusMessage" class="message" :class="{ ok: isOk, err: !isOk }">
          {{ statusMessage }}
        </p>

        <div class="hint">
          <span class="hint-key">TIP</span>
          <span class="hint-text">로그인 성공 시 <code>user_id</code>가 저장되고 게임 씬으로 이동합니다.</span>
        </div>
      </section>

      <footer class="footer">
        <span class="footer-text">© Pragarach — Fire Mage Guild</span>
      </footer>
    </main>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      form: {
        email: "",
        password: ""
      },
      statusMessage: "",
      isLoading: false,
      isOk: true
    };
  },
  computed: {
    canSubmit() {
      return Boolean(this.form.email) && Boolean(this.form.password);
    }
  },
  methods: {
    fillDemo() {
      // 기능 누락 방지용: 자동입력은 기존 로직에 영향 없이 개발 편의만 제공합니다.
      this.form.email = this.form.email || "demo@pragarach.com";
      this.form.password = this.form.password || "demo1234";
    },
    normalizeError(data) {
      // 백엔드 응답 포맷이 message/detail/fieldErrors 등으로 달라도 최대한 사람이 읽기 좋게 표시
      if (!data) return "요청에 실패했습니다.";
      if (typeof data === "string") return data;
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      // Django REST Framework validation errors: {field: ["..."]}
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const v = data[firstKey];
        if (Array.isArray(v) && v[0]) return `${firstKey}: ${v[0]}`;
        if (typeof v === "string") return `${firstKey}: ${v}`;
      }
      return JSON.stringify(data);
    },
    async login() {
      this.statusMessage = "";
      this.isOk = true;
      this.isLoading = true;

      try {
        const response = await fetch("http://localhost:8000/api/accounts/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.form.email,
            password: this.form.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          // ✅ 로그인 성공 → user_id를 localStorage에 저장 후 Game.vue로 이동 (기존 기능 유지)
          localStorage.setItem("user_id", data.user_id);
          this.statusMessage = "불꽃의 계약이 체결되었습니다. 게임으로 이동합니다…";
          this.isOk = true;
          this.$router.push("/game");
        } else {
          this.statusMessage = this.normalizeError(data);
          this.isOk = false;
        }
      } catch (error) {
        this.statusMessage = error?.message || "네트워크 오류가 발생했습니다.";
        this.isOk = false;
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Pixel RPG 분위기: 폰트 + 스캔라인 + 불씨 + 카드 */
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

.auth-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 14px;
  position: relative;
  overflow: hidden;

  background:
    radial-gradient(1200px 600px at 50% 30%, rgba(255, 94, 0, 0.20), transparent 60%),
    radial-gradient(900px 420px at 20% 90%, rgba(255, 196, 0, 0.14), transparent 55%),
    linear-gradient(180deg, #140a12 0%, #0b0712 55%, #07050d 100%);
}

.bg-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.08) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  mix-blend-mode: overlay;
}

.panel {
  width: min(560px, 94vw);
  position: relative;
  z-index: 2;
  font-family: "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #ffe9d7;
}

.header {
  text-align: center;
  margin-bottom: 14px;
}

.badge {
  display: inline-block;
  padding: 8px 10px;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: #12060b;
  background: linear-gradient(180deg, #ffcc66, #ff6a00);
  border: 3px solid rgba(0, 0, 0, 0.65);
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0.35);
}

.title {
  margin: 14px 0 8px;
  font-size: 22px;
  line-height: 1.35;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.65);
}

.subtitle {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  opacity: 0.9;
}

.card {
  background: linear-gradient(180deg, rgba(22, 10, 20, 0.88), rgba(10, 6, 16, 0.92));
  border: 4px solid rgba(0, 0, 0, 0.75);
  box-shadow: 0 16px 0 rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 106, 0, 0.25) inset;
  border-radius: 14px;
  padding: 18px 16px 16px;
}

.card-title {
  margin: 0 0 12px;
  font-size: 14px;
  letter-spacing: 0.4px;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.label {
  font-size: 10px;
  opacity: 0.9;
}

.input {
  width: 100%;
  padding: 12px 12px;
  font-size: 12px;
  line-height: 1.2;

  color: #fff4ea;
  background: rgba(0, 0, 0, 0.45);

  border: 3px solid rgba(0, 0, 0, 0.8);
  border-radius: 10px;

  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 106, 0, 0.18) inset;
}

.input:focus {
  box-shadow:
    0 0 0 2px rgba(255, 106, 0, 0.34) inset,
    0 0 18px rgba(255, 106, 0, 0.25);
}

.btn {
  width: 100%;
  margin-top: 14px;
  padding: 12px 12px;
  font-size: 12px;
  border-radius: 12px;
  border: 3px solid rgba(0, 0, 0, 0.85);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 0 rgba(0, 0, 0, 0.35);
  transition: transform 90ms ease, filter 120ms ease;
}

.btn:active {
  transform: translateY(2px);
  filter: brightness(0.98);
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

.primary {
  color: #1b090e;
  background: linear-gradient(180deg, #ffd08a 0%, #ff6a00 55%, #c62b00 100%);
}

.btn-glow {
  position: absolute;
  inset: -60px;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.35), transparent 55%);
  opacity: 0.55;
  transform: rotate(10deg);
  pointer-events: none;
}

.row {
  display: grid;
  grid-template-columns: 1fr 0.6fr;
  gap: 10px;
}

.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #ffe9d7;
}

.subtle {
  opacity: 0.85;
}

.message {
  margin: 14px 0 0;
  padding: 10px 10px;
  font-size: 10px;
  line-height: 1.7;
  border-radius: 10px;
  border: 3px solid rgba(0, 0, 0, 0.75);
  word-break: break-word;
}

.message.ok {
  background: rgba(0, 255, 170, 0.08);
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.10) inset;
}

.message.err {
  background: rgba(255, 60, 60, 0.10);
  box-shadow: 0 0 0 2px rgba(255, 60, 60, 0.12) inset;
}

.hint {
  margin-top: 12px;
  padding: 10px 10px;
  border-radius: 10px;
  background: rgba(255, 204, 102, 0.06);
  border: 3px dashed rgba(255, 204, 102, 0.35);
  display: grid;
  gap: 6px;
}

.hint-key {
  font-size: 10px;
  opacity: 0.95;
}

.hint-text {
  font-size: 10px;
  line-height: 1.6;
  opacity: 0.9;
}

code {
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.55);
}

.footer {
  text-align: center;
  margin-top: 12px;
  opacity: 0.75;
}

.footer-text {
  font-size: 10px;
}

/* 불씨(ember) 애니메이션 */
.ember {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  opacity: 0.65;
  background: linear-gradient(180deg, #ffd08a, #ff6a00);
  box-shadow: 0 0 18px rgba(255, 106, 0, 0.5);
  animation: floatUp 3.4s linear infinite;
  z-index: 1;
  pointer-events: none;
}

.ember-1 { left: 18%; bottom: -20px; animation-duration: 3.6s; transform: rotate(8deg); }
.ember-2 { left: 62%; bottom: -30px; animation-duration: 4.2s; transform: rotate(-10deg); }
.ember-3 { left: 84%; bottom: -24px; animation-duration: 3.9s; transform: rotate(14deg); }

@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0.0; }
  12% { opacity: 0.7; }
  100% { transform: translateY(-120vh) scale(0.8); opacity: 0; }
}

/* 작은 화면에서 버튼 줄바꿈 */
@media (max-width: 420px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
