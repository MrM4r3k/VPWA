import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: '/login',
    component: () => import('components/Login.vue'),
  },
  {
    path: '/register',
    name: '/register',
    component: () => import('components/Register.vue'),
  },
  {
    path: '/',
    redirect: { name: '/login' },
  },
  {
    path: '/newgroup',
    name: '/newgroup',
    component: () => import('pages/NewGroup.vue'),
  },
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'welcome', component: () => import('pages/WelcomePage.vue'), meta: { showMembers: false } },
      { path: 'c/:channelId', name: 'chat', component: () => import('pages/IndexPage.vue'), meta: { showMembers: true } },
    ],
    meta: { requiresAuth: true },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
