import { createRouter, createWebHistory } from 'vue-router';
import Menu from '@/components/Menu.vue';
import Options from '@/components/Options.vue';
import Map from '@/components/Map.vue';
import Tutorial from '@/components/Tutorial.vue';
import FinalBossBattle from '@/components/FinalBossBattle.vue';
import EndingScene from '@/components/EndingScene.vue';
import ClassSelect from '@/components/ClassSelect.vue';
import CreditsScreen from '@/components/CreditsScreen.vue';
import Credits from '@/components/Credits.vue';

import LojaMagicaView from '@/components/views/reino_albadia/LojaMagicaView.vue';
import PracaView from '@/components/views/reino_albadia/PracaView.vue';
import FlorestaView from '@/components/views/FlorestaView.vue';
import FerreiroView from '@/components/views/interiors/FerreiroView.vue';
import RioView from '@/components/views/niveis/RioView.vue';
import RuinasView from '@/components/views/niveis/RuinasView.vue';
import CavernaView from '@/components/views/niveis/CavernaView.vue';
import CasteloView from '@/components/views/CasteloView.vue';


const routes = [
  { path: '/', component: Menu },
  { path: '/options', component: Options },
  { path: '/map', component: Map },
  { path: '/tutorial', component: Tutorial },
  { path: '/creditsScreen', component: CreditsScreen },
  { path: '/battle', component: FinalBossBattle },
  { path: '/ending/:type', component: EndingScene },
  { path: '/class', component: ClassSelect },
  { path: '/credits/:type?', component: Credits },
  { path: '/level/albadia', component: PracaView },
  { path: '/level/albadia/loja', component: LojaMagicaView },
  { path: '/interior/ferreiro', component: FerreiroView },
  { path: '/level/floresta', component: FlorestaView },
  { path: '/level/rio', component:  RioView },
  { path: '/level/ruinas', component: RuinasView },
  { path: '/level/caverna', component: CavernaView },
  { path: '/level/castelo', component: CasteloView },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// // --- Guardas de Navegação (Exemplos) ---
// router.beforeEach((to, from, next) => {
//   console.log(`Navegando de ${from.name || 'inicio'} para ${to.name}`);

//   // Exemplo: Não pode ir para níveis sem selecionar classe (exceto intro/menu)
//   if (to.name !== 'MainMenu' && to.name !== 'IntroCutscene' && to.name !== 'ClassSelect' && !gameState.player.classe) {
//     console.log('Redirecionando para ClassSelect: Classe não selecionada.');
//     next({ name: 'ClassSelect' });
//   } 
//   // Exemplo: Não pode ir para o Castelo sem as 3 chaves
//   else if (to.name === 'Castelo' && (!gameState.player.keys?.ancestral || !gameState.player.keys?.ice || !gameState.player.keys?.fire)) {
//       console.log('Redirecionando para Mapa: Chaves faltando para o Castelo.');
//       // Idealmente, mostrar uma mensagem ao invés de só redirecionar
//       alert("Você precisa das 3 chaves dos dragões para entrar no castelo!");
//       next({ name: 'Map' }); 
//   }
//   // Exemplo: Não pode ver o final sem derrotar Magnus
//   else if ((to.name === 'EndingScene' || to.name === 'CreditsScreen') && !gameState.magnusDefeated) {
//       console.log('Redirecionando para Mapa: Magnus não foi derrotado.');
//       next({ name: 'Map' });
//   }
//   // Adicionar mais guardas conforme necessário (ex: verificar levelsCompleted)
//   else {
//     next(); // Permite a navegação
//   }
// });

export default router;

