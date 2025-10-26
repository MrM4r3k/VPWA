<template>
  <div class="auth-page bg-gradient">
    <div class="auth-container">
      <div class="brand">
        <img :src="logoUrl" alt="Logo" class="brand-logo" />
        <div class="brand-text">
          <div class="app-tagline">Create your account</div>
        </div>
      </div>

      <q-card class="auth-card" dark bordered flat>
        <q-card-section class="card-title">Register</q-card-section>

        <q-card-section>
          <!--q-form spúšťa validačne pravidlá detských komponentov, .prevent zabráni reloadu stránky-->
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
import 'src/css/auth-theme.scss';

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
/* Styles are now imported from auth-theme.scss */
</style>

