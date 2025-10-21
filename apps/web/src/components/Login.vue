<template>
  <div class="auth-page bg-gradient">
    <div class="auth-container">
      <div class="brand">
        <img :src="logoUrl" alt="Logo" class="brand-logo" />
        <div class="brand-text">
          <div class="app-tagline">Join the weave</div>
        </div>
      </div>

      <q-card class="auth-card" dark bordered flat>
        <q-card-section class="card-title">Sign in to your account</q-card-section>

        <q-card-section>
          <q-form @submit.prevent="onSubmit" @reset="onReset" ref="formRef">
            <q-input
              v-model="form.email"
              type="email"
              label="Email"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              :rules="[rules.required, rules.email]"
              autofocus
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

            <div class="actions">
              <q-btn type="submit" color="primary" label="Sign in" unelevated class="full-width q-mb-sm" />
            </div>
          </q-form>
        </q-card-section>

        <q-separator dark />

        <q-card-actions align="center">
          <q-btn flat label="Create an account" color="primary" @click="goRegister" />
        </q-card-actions>
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
  name: 'LoginPage',
});

const router = useRouter();
const formRef = ref<InstanceType<typeof QForm> | null>(null);
const showPwd = ref(false);

const form = reactive({
  email: '',
  password: '',
});

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  min: (v: string, n: number) => (v?.length ?? 0) >= n || `Min ${n} chars`,
};

async function onSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  // (authStore.signIn(form.email, form.password))
  localStorage.setItem('auth.loggedIn', 'true');
  const redirect = (router.currentRoute.value.query.redirect as string) || '/app';
  await router.push(redirect);
}

function onReset() {
  form.email = '';
  form.password = '';
}

function goRegister() {
  void router.push('/register');
}
</script>

<style scoped>
/* Styles are now imported from auth-theme.scss */
</style>
