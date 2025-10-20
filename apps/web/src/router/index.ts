// src/router/index.ts
import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

export default route(function () {
  const Router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
  })

  // autorizačná podmienka – uprav si na svoj kľúč (token)
  const hasToken = () => !!localStorage.getItem('auth_token') || localStorage.getItem('auth.loggedIn') === 'true'

  Router.beforeEach((to, from) => {
    // 1) Bez prihlásenia nepustiť na /app (a deti)
    if (to.matched.some(r => r.meta.requiresAuth) && !hasToken()) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    // 2) Po registrácii presmeruj NA LOGIN, bez ohľadu na to, kam sa pokúša ísť
    if (from.name === 'register' && to.name !== 'login') {
      return { name: 'login' }
    }

    // 3) Ak je user prihlásený, nepúšťaj ho na login/register
    if ((to.name === 'login' || to.name === 'register') && hasToken()) {
      return { name: 'welcome' }
    }
  })

  return Router
})
