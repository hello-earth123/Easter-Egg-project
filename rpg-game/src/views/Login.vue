<template>
  <div>
    <h2>로그인</h2>
    <input v-model="email" placeholder="이메일" type="email" required>
    <input v-model="password" type="password" placeholder="비밀번호" required>
    <button @click="login" :disabled="loading">
      {{ loading ? '로그인 중...' : '로그인' }}
    </button>
    <button @click="$router.push('/register')">회원가입</button>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      message: '',
      loading: false
    }
  },
  methods: {
    async login() {
      this.message = '';
      this.loading = true;
      try {
        const response = await fetch('http://localhost:8000/api/accounts/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          // 로그인 성공 → user_id를 localStorage에 저장 후 Game.vue로 이동
          localStorage.setItem('user_id', data.user_id);
          this.$router.push('/game');
        } else {
          this.message = data.message || JSON.stringify(data);
        }
      } catch (error) {
        this.message = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
