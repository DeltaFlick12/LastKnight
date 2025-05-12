<<<<<<< Updated upstream
=======
import { createRouter, createWebHistory } from 'vue-router'
import Menu from '@/components/Menu.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import Options from '@/components/Options.vue'
import GameView from '@/components/GameView.vue'

const routes = [
  { path: '/menu', component: Menu },
  { path: '/story', component: GameView },
  { path: '/class', component: ClassSelect },
  { path: '/options', component: Options },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
>>>>>>> Stashed changes
