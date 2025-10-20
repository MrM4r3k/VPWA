<template>
    <div class="page">
      <q-card dark bordered style="height: 500px; width: 400px; border-radius: 20px; background: #8b92f936;">
        
        <q-card-section class="row items-center justify-center">
          <q-tabs v-model="tab" class="text-white">
            <q-tab name="search" label="Search group" />
            <q-tab name="create" label="Create new group" />
          </q-tabs>
        </q-card-section>
  
        <q-separator dark inset />
  
        <q-card-section class="q-pa-sm">
          <q-tab-panels v-model="tab" class="bg-transparent text-white">
            <q-tab-panel name="search" >
              <q-input
                v-model="search"
                rounded
                outlined
                dense
                label="Search groups..."
                bg-color="grey-9"
                standout="bg-grey-9 text-white"
                input-class="text-white"
                style="margin-bottom: 20px;"
              >
                <template #prepend>
                  <q-icon name="search" color="grey-5" />
                </template>
              </q-input>
              
              <q-separator dark inset />
  
            </q-tab-panel>
            <q-tab-panel name="create">
              nie
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  const tab = ref<'search' | 'create'>('search')
  const search = ref('');
  </script>
  
  <style scoped>
  .page{
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1d2e;
  }
  
  </style>
  