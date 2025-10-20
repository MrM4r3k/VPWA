<template>
    <q-page class="welcome" style="background: #1a1d2e;">
        <SideBar />
        <WelcomePanel />
    </q-page>
</template>
  
<script setup lang="ts">
    import SideBar from 'src/components/SideBar.vue';
    import WelcomePanel from 'src/components/WelcomePanel.vue'
</script>
  
<style scoped>
  .welcome{
    height: 100%;
    display: grid;
    place-items: center;
  }
</style>
  