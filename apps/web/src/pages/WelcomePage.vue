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
    background: radial-gradient(1200px 600px at 10% -10%, rgba(88, 101, 242, 0.25), transparent),
              radial-gradient(1200px 600px at 110% 110%, rgba(32, 34, 37, 0.6), transparent),
              #0b0d10 !important;
  }
</style>
  