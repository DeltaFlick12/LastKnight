import { createRouter, createWebHistory } from 'vue-router'
import Menu from '@/components/Menu.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import Options from '@/components/Options.vue'
import GameView from '@/components/GameView.vue'
import Map from '@/components/Map.vue'
import Tutorial from '../components/Tutorial.vue'

const routes = [
  { path: '/', component: Menu },
  { path: '/story', component: GameView },
  { path: '/class', component: ClassSelect },
  { path: '/options', component: Options },
  { path: '/map', component: Map },
  { path: '/tutorial', component: Tutorial },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

