<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="bg-dark">
      <q-toolbar>
        <q-space />
        <q-btn flat dense color="grey-4" icon="logout" label="Logout" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
  </template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function onLogout() {
  localStorage.removeItem('auth.loggedIn');
  void router.push('/login');
}
</script>

<style scoped>
.bg-dark {
  background: #0b0d10;
}
</style>
