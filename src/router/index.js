import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue')
    },
    {
      path: '/replay',
      name: 'replay',
      component: () => import('../views/Replay.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About.vue')
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/Upload.vue')
    },
    {
      path: '/bilibili',
      name: 'bilibili',
      component: () => import('../views/Bilibili.vue')
    },
    {
      path: '/videoclip',
      name: 'videoclip',
      component: () => import('../views/VideoClip.vue')
    }
  ]
})

export default router