<template>
  <div class="castelo-view" :style="castleBackgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }} - {{ currentCastleSection }}</p>
      <p>Chaves: {{ getCollectedKeysStatus() }}</p>
    </div>

    <div class="castle-content">
      <h2>{{ currentCastleSection }}</h2>

      <!-- Conteúdo dinâmico baseado na seção atual -->
      <div v-if="currentCastleSection === 'Salão Principal'">
        <p>Você entra no imponente, porém decadente, Salão Principal do castelo. Ecos sinistros ressoam nas altas abóbadas. Há várias portas e passagens.</p>
        <div class="interactions">
          <p><strong>Inimigos:</strong> Placeholder para Capangas de Magnus (x2)</p>
          <p><strong>Interação:</strong> Uma grande porta ornamentada ao norte (trancada?), uma passagem escura a leste, uma escadaria a oeste.</p>
          <button @click="moveToSection('Corredor Leste')">Ir para Leste</button>
          <button @click="moveToSection('Escadaria Oeste')">Subir Escadaria Oeste</button>
          <button @click="tryOpenNorthDoor">Tentar Abrir Porta Norte</button>
        </div>
      </div>

      <div v-else-if="currentCastleSection === 'Corredor Leste'">
        <p>Um corredor úmido e mal iluminado. O chão está coberto de detritos.</p>
        <div class="interactions">
          <p><strong>Inimigos:</strong> Placeholder para Morcegos Gigantes (x3)</p>
          <p><strong>Puzzle:</strong> Uma alavanca enferrujada na parede. Parece emperrada.</p>
          <p><strong>Item:</strong> Um brilho sutil sob uma pilha de entulho (Placeholder: Chave Pequena?)</p>
          <button @click="interactWithLever">Puxar Alavanca</button>
          <button @click="searchDebris">Vasculhar Entulho</button>
          <button @click="moveToSection('Salão Principal')">Voltar para Salão Principal</button>
        </div>
      </div>

      <div v-else-if="currentCastleSection === 'Escadaria Oeste'">
        <p>Uma escadaria em espiral leva para cima. Alguns degraus estão quebrados.</p>
        <div class="interactions">
          <p><strong>Inimigos:</strong> Placeholder para Esqueleto Arqueiro (x1) no topo.</p>
          <button @click="moveToSection('Ponte Sobre Espinhos')">Continuar Subindo</button>
          <button @click="moveToSection('Salão Principal')">Descer para Salão Principal</button>
        </div>
      </div>

      <div v-else-if="currentCastleSection === 'Ponte Sobre Espinhos'">
        <p>Você chega a uma plataforma estreita. Abaixo, um fosso repleto de espinhos afiados. Uma ponte instável de madeira atravessa o abismo.</p>
        <div class="interactions">
          <p><strong>Puzzle:</strong> Atravessar a ponte requer cuidado. (Placeholder: QTE? Teste de habilidade?)</p>
          <p><strong>Inimigos:</strong> Placeholder para Gárgulas Animadas (x2) do outro lado.</p>
          <button @click="tryCrossBridge">Tentar Atravessar a Ponte</button>
          <button @click="moveToSection('Escadaria Oeste')">Voltar</button>
        </div>
      </div>

      <div v-else-if="currentCastleSection === 'Antecamara Final'">
        <p>Após a ponte, você entra em uma antecâmara silenciosa. Uma porta maciça e imponente bloqueia o caminho adiante. Ela pulsa com uma energia sombria e possui três entalhes: um floco de neve, uma chama e um crânio antigo.</p>
        <div class="interactions">
          <p><strong>Puzzle:</strong> A porta está selada magicamente. As três chaves dos dragões (Gelo, Fogo, Ancestral) parecem ser necessárias para abrir os entalhes.</p>
          <p><strong>Item:</strong> Placeholder para Poção de Cura Maior.</p>
          <button @click="tryOpenFinalDoor">Usar Chaves na Porta Final</button>
          <button @click="moveToSection('Ponte Sobre Espinhos')">Voltar pela Ponte</button>
        </div>
      </div>

      <!-- Adicionar mais seções conforme necessário -->
      <div v-else>
        <p>Seção desconhecida.</p>
        <button @click="moveToSection('Salão Principal')">Voltar ao Início</button>
      </div>

      <!-- Caixa de Diálogo para feedback -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>
    </div>

    <div class="navigation-placeholder">
      <!-- Poderia ter um mini-mapa ou apenas botões direcionais -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gamestate.js'; // Correct import
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();
const gameState = useGameState(); // Initialize the Pinia store

// Estado local para a seção atual dentro do castelo
const currentCastleSection = ref('Salão Principal');
const showFeedback = ref(false);
const feedbackMessage = ref('');

// Estado local para puzzles e itens (placeholders)
const leverPulled = ref(gameState.castleState?.leverPulled || false);
const foundSmallKey = ref(gameState.castleState?.foundSmallKey || false);
const crossedBridge = ref(gameState.castleState?.crossedBridge || false);
const finalDoorOpened = ref(gameState.castleState?.finalDoorOpened || false);

// Função para exibir chaves coletadas
const getCollectedKeysStatus = () => {
  let keys = [];
  if (gameState.player.keys?.ancestral) keys.push('Ancestral');
  if (gameState.player.keys?.ice) keys.push('Gelo');
  if (gameState.player.keys?.fire) keys.push('Fogo');
  return keys.length > 0 ? keys.join(', ') : 'Nenhuma';
};

onMounted(() => {
  gameState.setCurrentArea('Castelo de Magnus');
  playAudio('music_castle_exploration', { loop: true });
  // Inicializar estado do castelo se não existir
  if (!gameState.castleState) {
    gameState.castleState = reactive({ leverPulled: false, foundSmallKey: false, crossedBridge: false, finalDoorOpened: false });
  }
  // Inicializar estado das chaves se não existir
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
});

// Estilo de fundo (placeholder)
const castleBackgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real do castelo
  return { backgroundColor: '#3a3a4a' }; // Cinza-azulado escuro
});

// Funções de Navegação e Interação (Placeholders)
const moveToSection = (sectionName) => {
  playAudio('sfx_footsteps_stone');
  currentCastleSection.value = sectionName;
  // TODO: Adicionar lógica de encontro com inimigos ao entrar na seção
};

const tryOpenNorthDoor = () => {
  playAudio('sfx_door_try_open_heavy');
  if (foundSmallKey.value) {
    feedbackMessage.value = 'Placeholder: A chave pequena destranca a porta norte! (Leva para onde?)';
    // moveToSection('Nova Seção Norte');
  } else {
    feedbackMessage.value = 'Placeholder: A porta está trancada.';
  }
  showFeedback.value = true;
};

const interactWithLever = () => {
  if (!leverPulled.value) {
    playAudio('sfx_lever_pull_rusty');
    feedbackMessage.value = 'Placeholder: A alavanca range, mas se move! Um barulho distante de pedra se movendo é ouvido.';
    leverPulled.value = true;
    gameState.castleState.leverPulled = true; // Salva estado
    // TODO: Adicionar consequência real (abrir passagem, desativar armadilha)
  } else {
    playAudio('sfx_lever_already_pulled');
    feedbackMessage.value = 'Placeholder: A alavanca já foi puxada.';
  }
  showFeedback.value = true;
};

const searchDebris = () => {
  playAudio('sfx_searching_debris');
  if (!foundSmallKey.value) {
    feedbackMessage.value = 'Placeholder: Você encontra uma pequena chave de ferro enferrujada!';
    foundSmallKey.value = true;
    gameState.castleState.foundSmallKey = true; // Salva estado
    // TODO: Adicionar a chave ao inventário do jogador (via store)
  } else {
    feedbackMessage.value = 'Placeholder: Você não encontra mais nada de útil aqui.';
  }
  showFeedback.value = true;
};

const tryCrossBridge = () => {
  playAudio('sfx_bridge_creak');
  if (Math.random() > 0.3) { // 70% chance de sucesso
    feedbackMessage.value = 'Placeholder: Você atravessa a ponte com cuidado!';
    crossedBridge.value = true;
    gameState.castleState.crossedBridge = true; // Salva estado
    moveToSection('Antecamara Final');
  } else {
    playAudio('sfx_bridge_snap_fall');
    feedbackMessage.value = 'Placeholder: A ponte cede! Você cai...';
    gameState.takeDamage(20);
    if (gameState.player.health <= 0) {
      router.push('/game-over'); // Navigate to game over screen
    } else {
      // Volta para seção anterior se sobreviver
      moveToSection('Escadaria Oeste');
    }
  }
  showFeedback.value = true;
};

const tryOpenFinalDoor = () => {
  playAudio('sfx_door_try_open_magic');
  // Verifica se o jogador possui as 3 chaves dos dragões
  const hasAllKeys = gameState.player.keys?.ancestral && gameState.player.keys?.ice && gameState.player.keys?.fire;

  if (hasAllKeys) {
    feedbackMessage.value = 'As três chaves ressoam com a porta. O selo mágico se dissipa! Você pode entrar.';
    finalDoorOpened.value = true;
    gameState.castleState.finalDoorOpened = true; // Salva estado
    playAudio('sfx_magic_seal_break');
    gameState.completeLevel('castelo'); // Marcar nível como completo
    // Navegar para a batalha final
    router.push({ name: 'FinalBattle' });
  } else {
    feedbackMessage.value = 'A porta permanece selada. Os entalhes parecem corresponder às chaves dos dragões... Você precisa encontrar todas as três.';
  }
  showFeedback.value = true;
};
</script>

<style scoped>
.castelo-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: white;
  font-family: 'Press Start 2P', cursive;
  background-size: cover;
  background-position: center;
}

.game-hud-placeholder {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  font-size: 12px;
}

.castle-content {
  flex-grow: 1;
  padding: 30px;
  background-color: rgba(0, 0, 0, 0.5);
  margin: 20px;
  border-radius: 8px;
  overflow-y: auto;
}

.castle-content h2 {
  margin-top: 0;
  color: #ffd700;
}

.interactions {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #555;
}

.interactions p {
  margin-bottom: 10px;
}

.interactions strong {
  color: #aaa;
}

.feedback-box {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid #ccc;
  padding: 20px;
  margin-top: 20px;
  width: 80%;
  max-width: 600px;
  border-radius: 5px;
  text-align: center;
  color: white;
  z-index: 2;
}

button {
  margin: 5px;
  padding: 8px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: #5c5c5c;
  color: white;
  border: 1px solid #ccc;
}

button:hover {
  background-color: #777;
}

.navigation-placeholder {
  height: 50px; /* Espaço para futuros controles de navegação */
  background-color: rgba(0, 0, 0, 0.3);
}
</style>