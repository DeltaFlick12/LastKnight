import { createRouter, createWebHistory } from 'vue-router';
import { useGameState } from '@/stores/gameState';

// Componentes
import Menu from '@/components/Menu.vue';
import Options from '@/components/Options.vue';
import Map from '@/components/Map.vue';
import Tutorial from '@/components/Tutorial.vue';
import Gameover from '@/components/GameOver.vue';
import FinalBossBattle from '@/components/FinalBossBattle.vue';
import EndingScene from '@/components/EndingScene.vue';
import ClassSelect from '@/components/ClassSelect.vue';
import CreditsScreen from '@/components/CreditsScreen.vue';
import Credits from '@/components/Credits.vue';
import Endless from '@/components/Endless.vue';
import PracaView from '@/components/views/reino_albadia/PracaView.vue';
import FlorestaView from '@/components/views/niveis/FlorestaView.vue';
import FerreiroView from '@/components/views/interiors/FerreiroView.vue';
import Bruxa from '@/components/views/interiors/BruxaView.vue';
import Igreja from '@/components/views/interiors/IgrejaView.vue';
import RioView from '@/components/views/niveis/RioView.vue';
import RuinasView from '@/components/views/niveis/RuinasView.vue';
import CavernaView from '@/components/views/niveis/CavernaView.vue';
import MontanhaView from '@/components/views/niveis/MontanhaView.vue';
import CasteloView from '@/components/views/CasteloView.vue';

const routes = [
  { path: '/', name: 'Menu', component: Menu },
  { path: '/options', name: 'Options', component: Options },
  { path: '/endless', name: 'Endless', component: Endless },
  { path: '/gameover', name: 'Gameover', component: Gameover },
  { path: '/credits/:type?', name: 'Credits', component: Credits },
  { path: '/map', name: 'Map', component: Map },
  { path: '/tutorial', name: 'Tutorial', component: Tutorial },
  { path: '/creditsScreen', name: 'CreditsScreen', component: CreditsScreen },
  { path: '/battle', name: 'FinalBossBattle', component: FinalBossBattle },
  { path: '/ending/:type', name: 'EndingScene', component: EndingScene },
  { path: '/class', name: 'ClassSelect', component: ClassSelect },
  { path: '/level/albadia', name: 'PracaView', component: PracaView },
  { path: '/interior/ferreiro', name: 'FerreiroView', component: FerreiroView },
  { path: '/interior/bruxa', name: 'Bruxa', component: Bruxa },
  { path: '/interior/igreja', name: 'Igreja', component: Igreja },
  { path: '/level/floresta', name: 'FlorestaView', component: FlorestaView },
  { path: '/level/rio', name: 'RioView', component: RioView },
  { path: '/level/ruinas', name: 'RuinasView', component: RuinasView },
  { path: '/level/caverna', name: 'CavernaView', component: CavernaView },
  { path: '/level/montanha', name: 'MontanhaView', component: MontanhaView },
  { path: '/level/castelo', name: 'CasteloView', component: CasteloView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const gameState = useGameState();

  if (!gameState) {
    console.error('GameState store não está disponível no momento da navegação.', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    next({ name: 'Menu' });
    return;
  }

  console.log(`Navegando de ${from.name || 'inicio'} para ${to.name} em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);

  // Log do estado atual para depuração
  console.log('Estado do gameState:', {
    playerClasse: gameState.player?.classe,
    playerKeys: gameState.player?.keys,
    bossHealth: gameState.boss?.health,
  });


  // Bloqueia acesso ao Castelo sem as 3 chaves
  if (
    to.name === 'CasteloView' &&
    (!gameState.player?.keys?.ancestral ||
      !gameState.player?.keys?.ice ||
      !gameState.player?.keys?.fire)
  ) {
    alert('Você precisa das 3 chaves dos dragões para entrar no castelo!');
    console.log('Redirecionando para Map: Chaves faltando para o Castelo.');
    next({ name: 'Map' }); // Considerar redirecionar para um local mais apropriado que 'Map'
    return;
  }

  // Bloqueia acesso ao final ou créditos sem derrotar Magnus (boss.health === 0)
  if (
    (to.name === 'EndingScene' || to.name === 'Credits') &&
    gameState.boss?.health > 0
  ) {
    console.log('Redirecionando para Map: Magnus não foi derrotado.');
    next({ name: 'Map' }); // Considerar redirecionar para um local mais apropriado que 'Map'
    return;
  }

  // Se passou por todas as verificações, permite a navegação
  next();
});

export default router;

