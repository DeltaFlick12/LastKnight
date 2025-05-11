import { createRouter, createWebHistory } from 'vue-router'
import Menu from '@/Menu.vue'
import Story from '@/router/story.vue'

const routes = [
  { path: '/story', component: Story },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
