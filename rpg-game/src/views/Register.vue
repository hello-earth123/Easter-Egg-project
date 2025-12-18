<template>
  <div>
    <h2>회원가입</h2>
    <input v-model="username" placeholder="아이디" required>
    <input v-model="email" placeholder="이메일" type="email" required>
    <input v-model="password" type="password" placeholder="비밀번호" required>
    <button @click="register" :disabled="loading">
      {{ loading ? '등록 중...' : '회원가입' }}
    </button>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      message: '',
      loading: false
    }
  },
  methods: {
    async register() {
      this.message = '';
      this.loading = true;
      try {
        const response = await fetch('http://localhost:8000/api/accounts/register/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          // 회원가입 성공 → 로그인 화면으로 이동
          this.$router.push('/login');
        } else {
          this.message = data.detail || JSON.stringify(data);
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
