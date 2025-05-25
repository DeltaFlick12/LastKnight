<<<<<<< Updated upstream
import { createRouter, createWebHistory } from 'vue-router'

import Menu from '@/components/Menu.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import Options from '@/components/Options.vue'
import Endless from '@/components/Endless.vue'
import AlbadiaView from '@/components/views/AlbadiaView.vue'
import Map from '@/components/Map.vue'
import Credits from '@/components/Credits.vue'
import Tutorial from '@/components/Tutorial.vue'
import FlorestaView from '@/components/views/FlorestaView.vue'
import CavernaView from '@/components/views/CavernaView.vue'
import FerreiroView from '@/components/views/interiors/FerreiroView.vue' // Novo import

const routes = [
  { path: '/', component: Menu },
  { path: '/story', component: AlbadiaView },
  { path: '/class', component: ClassSelect },
  { path: '/endless', component: Endless },
  { path: '/options', component: Options },
  { path: '/credits', component: Credits },
  { path: '/map', component: Map },
  { path: '/tutorial', component: Tutorial },
  { path: '/level/floresta', component: FlorestaView },
  { path: '/level/caverna', component: CavernaView },
  { path: '/interior/ferreiro', component: FerreiroView }, // Nova rota
]
=======
import { createRouter, createWebHistory } from 'vue-router';
import { gameState } from '@/store/gfame.js';

// --- Componentes Principais e Hubs ---
import MainMenu from '@/components/MainMenu.vue';
import CutscenePlayer from '@/components/CutscenePlayer.vue';
import ClassSelect from '@/components/ClassSelect.vue';
import MapView from '@/components/Map.vue';
import Options from '@/components/Options.vue';

// --- Hubs Reino Albadia ---
import CampoTreinoView from '@/components/views/reino_albadia/CampoTreinoView.vue';
import ForjaView from '@/components/views/reino_albadia/ForjaView.vue';
import LojaMagicaView from '@/components/views/reino_albadia/LojaMagicaView.vue';
import IgrejaView from '@/components/views/reino_albadia/IgrejaView.vue';
import PracaView from '@/components/views/reino_albadia/PracaView.vue';

// --- Níveis ---
import FlorestaView from '@/components/views/FlorestaView.vue';
import RioView from '@/components/views/niveis/RioView.vue';
import RuinasView from '@/components/views/niveis/RuinasView.vue';
import AcampamentoView from '@/components/views/niveis/AcampamentoView.vue';
import MontanhaView from '@/components/views/niveis/MontanhaView.vue';
import CavernaView from '@/components/views/niveis/CavernaView.vue';
import PonteView from '@/components/views/PonteView.vue'; // Verificar localização correta
import CasteloView from '@/components/views/CasteloView.vue';

// --- Finais ---
import FinalBossBattle from '@/components/FinalBossBattle.vue';
import EndingScene from '@/components/EndingScene.vue';
import CreditsScreen from '@/components/CreditsScreen.vue';


// import Inventory from '@/components/Inventory.vue';

const routes = [
  // Rota Inicial - Menu Principal
  { path: '/', name: 'MainMenu', component: MainMenu },

  // Cutscene Inicial (Chamada pelo Menu)
  {
    path: '/intro',
    name: 'IntroCutscene',
    component: CutscenePlayer,
    props: { sceneKey: 'inicio' } // Passa a chave da cena inicial
  },

  // Reino Albadia (Hubs)
  {
    path: '/treino',
    name: 'CampoTreino',
    component: CampoTreinoView,
    // meta: { requiresClassSelected: true } // Exemplo de guarda
  },
  {
    path: '/classe',
    name: 'ClassSelect',
    component: ClassSelect,
    // meta: { requiresTutorialComplete: true }
  },
  {
    path: '/mapa',
    name: 'Map',
    component: MapView,
    // meta: { requiresClassSelected: true }
  },
  {
    path: '/forja',
    name: 'Forja',
    component: ForjaView,
    // meta: { requiresClassSelected: true }
  },
  {
    path: '/loja-magica',
    name: 'LojaMagica',
    component: LojaMagicaView,
    // meta: { requiresClassSelected: true }
  },
  {
    path: '/igreja',
    name: 'Igreja',
    component: IgrejaView,
    // meta: { requiresClassSelected: true }
  },
  {
    path: '/praca',
    name: 'Praca',
    component: PracaView,
    // meta: { requiresClassSelected: true }
  },

  // Níveis (Ordem do Enredo)
  {
    path: '/floresta',
    name: 'Floresta',
    component: FlorestaView,
    // meta: { requiresClassSelected: true }
  },
  {
    path: '/rio',
    name: 'Rio',
    component: RioView,
    // meta: { requiresLevelComplete: 'floresta' }
  },
  {
    path: '/ruinas',
    name: 'Ruinas',
    component: RuinasView,
    // meta: { requiresLevelComplete: 'rio' }
  },
  {
    path: '/acampamento',
    name: 'Acampamento',
    component: AcampamentoView,
    // meta: { requiresLevelComplete: 'ruinas' }
  },
  {
    path: '/montanha',
    name: 'Montanha',
    component: MontanhaView,
    // meta: { requiresLevelComplete: 'acampamento' }
  },
  {
    path: '/caverna',
    name: 'Caverna',
    component: CavernaView,
    // meta: { requiresLevelComplete: 'montanha' }
  },
  // Rota da Ponte - Onde ela se encaixa no fluxo? O enredo menciona após Rio.
  // Se for uma escolha após o Rio:
  // { path: '/ponte', name: 'Ponte', component: PonteView, meta: { requiresLevelComplete: 'rio' } },
  // Ajustar navegação em RioView e PonteView se for uma escolha.
  // Se for parte de outro nível, remover rota separada.

  // Nível Final
  {
    path: '/castelo',
    name: 'Castelo',
    component: CasteloView,
    // meta: { requiresLevelComplete: 'caverna' } // Ou requer as 3 chaves?
  },

  // Batalha Final e Encerramento
  {
    path: '/batalha-final',
    name: 'FinalBattle',
    component: FinalBossBattle,
    // meta: { requiresLevelComplete: 'castelo' }
  },
  {
    path: '/final/:endingType',
    name: 'EndingScene',
    component: EndingScene,
    props: true // Passa 'endingType' como prop ('Sacrificio' ou 'Tragico')
    // meta: { requiresMagnusDefeated: true }
  },
  {
    path: '/creditos/:endingType',
    name: 'CreditsScreen',
    component: CreditsScreen,
    props: true
    // meta: { requiresEndingSeen: true }
  },

  // Outras Rotas
  { path: '/opcoes', name: 'Options', component: Options },

  // Rota Catch-all (404)
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundComponent },
];
>>>>>>> Stashed changes

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- Guardas de Navegação (Exemplos) ---
router.beforeEach((to, from, next) => {
  console.log(`Navegando de ${from.name || 'inicio'} para ${to.name}`);

  // Exemplo: Não pode ir para níveis sem selecionar classe (exceto intro/menu)
  if (to.name !== 'MainMenu' && to.name !== 'IntroCutscene' && to.name !== 'ClassSelect' && !gameState.player.classe) {
    console.log('Redirecionando para ClassSelect: Classe não selecionada.');
    next({ name: 'ClassSelect' });
  } 
  // Exemplo: Não pode ir para o Castelo sem as 3 chaves
  else if (to.name === 'Castelo' && (!gameState.player.keys?.ancestral || !gameState.player.keys?.ice || !gameState.player.keys?.fire)) {
      console.log('Redirecionando para Mapa: Chaves faltando para o Castelo.');
      // Idealmente, mostrar uma mensagem ao invés de só redirecionar
      alert("Você precisa das 3 chaves dos dragões para entrar no castelo!");
      next({ name: 'Map' }); 
  }
  // Exemplo: Não pode ver o final sem derrotar Magnus
  else if ((to.name === 'EndingScene' || to.name === 'CreditsScreen') && !gameState.magnusDefeated) {
      console.log('Redirecionando para Mapa: Magnus não foi derrotado.');
      next({ name: 'Map' });
  }
  // Adicionar mais guardas conforme necessário (ex: verificar levelsCompleted)
  else {
    next(); // Permite a navegação
  }
});

export default router;

