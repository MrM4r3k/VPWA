<template>
  <div class="login-page bg-gradient">
    <div class="login-container">
      <div class="brand">
        <img :src="logoUrl" alt="Logo" class="brand-logo" />
        <div class="brand-text">
          <div class="app-tagline">Create your account</div>
        </div>
      </div>

      <q-card class="login-card" dark bordered flat>
        <q-card-section class="card-title">Register</q-card-section>

        <q-card-section>
          <q-form @submit.prevent="onSubmit" @reset="onReset" ref="formRef">
            <div class="two-col">
              <q-input
                v-model="form.name"
                type="text"
                label="Name"
                filled
                color="primary"
                bg-color="grey-10"
                dark
                :rules="[rules.required, (v)=>rules.min(v,2)]"
                class="field"
              />

              <q-input
                v-model="form.surname"
                type="text"
                label="Surname"
                filled
                color="primary"
                bg-color="grey-10"
                dark
                :rules="[rules.required, (v)=>rules.min(v,2)]"
                class="field"
              />
            </div>

            <q-input
              v-model="form.nickname"
              type="text"
              label="Nickname"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              :rules="[rules.required, (v)=>rules.min(v,2)]"
              class="field"
            />

            <q-input
              v-model="form.email"
              type="email"
              label="Email"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              :rules="[rules.required, rules.email]"
              class="field"
            />

            <q-input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              label="Password"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              :rules="[rules.required, (v)=>rules.min(v,6)]"
              class="field"
            >
              <template #append>
                <q-icon
                  :name="showPwd ? 'visibility_off' : 'visibility'"
                  class="toggle-icon"
                  @click="showPwd = !showPwd"
                />
              </template>
            </q-input>

            <q-input
              v-model="form.confirm"
              :type="showConfirm ? 'text' : 'password'"
              label="Confirm Password"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              :rules="[rules.required, rules.matchesPassword]"
              class="field"
            >
              <template #append>
                <q-icon
                  :name="showConfirm ? 'visibility_off' : 'visibility'"
                  class="toggle-icon"
                  @click="showConfirm = !showConfirm"
                />
              </template>
            </q-input>

            <div class="actions">
              <q-btn type="submit" color="primary" label="Create account" unelevated class="full-width q-mb-sm" />
              <q-btn flat label="Back to Sign in" color="grey-5" class="full-width" @click="goLogin" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
  </template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { QForm } from 'quasar';
import logoUrl from 'src/assets/logo.png';

defineOptions({
  name: 'RegisterPage',
});

const router = useRouter();
const formRef = ref<InstanceType<typeof QForm> | null>(null);
const showPwd = ref(false);
const showConfirm = ref(false);

const form = reactive({
  name: '',
  surname: '',
  nickname: '',
  email: '',
  password: '',
  confirm: '',
});

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  min: (v: string, n: number) => (v?.length ?? 0) >= n || `Min ${n} chars`,
  matchesPassword: (v: string) => v === form.password || 'Passwords must match',
};

async function onSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  localStorage.setItem('auth.registered', 'true');
  localStorage.setItem('auth.loggedIn', 'true');
  await router.push('/app');
}

function onReset() {
  form.name = '';
  form.surname = '';
  form.nickname = '';
  form.email = '';
  form.password = '';
  form.confirm = '';
}

function goLogin() {
  void router.push('/login');
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 100vh;
  box-sizing: border-box;
}

.bg-gradient {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(88, 101, 242, 0.25), transparent),
              radial-gradient(1200px 600px at 110% 110%, rgba(32, 34, 37, 0.6), transparent),
              #0b0d10;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  color: #e5e7eb;
}

.brand-logo {
  width: clamp(80px, 20vw, 128px);
  object-fit: contain;
  object-position: center;
  display: block;
}

.brand-text .app-tagline {
  font-size: 18px;
  line-height: 1.5;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 0.2px;
}

.login-card {
  width: 100%;
  padding: 8px 0;
  background: rgba(24, 26, 31, 0.9);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #e5e7eb;
}

.field {
  margin-bottom: 16px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.toggle-icon {
  cursor: pointer;
}
</style>

