import { createRouter, createWebHistory } from 'vue-router'
import Menu from '@/components/Menu.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import Options from '@/components/Options.vue'
import GameView from '@/components/GameView.vue'
import Map from '@/components/Map.vue'
import Credits from '@/components/Credits.vue'
import Tutorial from '@/components/Tutorial.vue'
import FlorestaView from '@/components/views/FlorestaView.vue'
import CavernaView from '@/components/views/CavernaView.vue'

const routes = [
  { path: '/', component: Menu },
  { path: '/story', component: GameView },
  { path: '/class', component: ClassSelect },
  { path: '/options', component: Options },
  { path: '/credits', component: Credits },
  { path: '/map', component: Map },
  { path: '/tutorial', component: Tutorial },
  { path: '/level/floresta', component: FlorestaView },
  { path: '/level/caverna', component: CavernaView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
