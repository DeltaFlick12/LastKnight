import { createRouter, createWebHistory } from 'vue-router'
import Menu from '@/components/Menu.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import Options from '@/components/Options.vue'
import Endless from '@/components/Endless.vue'
import GameView from '@/components/GameView.vue'
import Map from '@/components/Map.vue'
import Credits from '@/components/Credits.vue'
import Tutorial from '@/components/Tutorial.vue'
import FlorestaView from '@/components/views/FlorestaView.vue'
import CavernaView from '@/components/views/CavernaView.vue'
import move_albadia from '@/components/move_albadia.vue'

const routes = [
  { path: '/', component: Menu },
  { path: '/story', component: GameView },
  { path: '/class', component: ClassSelect },
  { path: '/endless', component: Endless },
  { path: '/options', component: Options },
  { path: '/credits', component: Credits },
  { path: '/map', component: Map },
  { path: '/tutorial', component: Tutorial },
  { path: '/level/floresta', component: FlorestaView },
  { path: '/level/caverna', component: CavernaView },
  { path: '/move_albadia', component: move_albadia },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
