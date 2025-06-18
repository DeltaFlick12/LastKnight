<template>
  <div class="classe-screen">
    <div class="bg-texture"></div>

    <div class="content">
      <h1 class="title">{{ texts.classTitle }}</h1>

      <input
        v-model="playerName"
        type="text"
        :placeholder="texts.placeholder"
        class="name-input"
      />

      <div>
        <button
          class="start-btn"
          :disabled="!playerName.trim()"
          @click="confirmarClasse"
        >
          {{ texts.start }}
        </button>
      </div>
    </div>

    <audio ref="clickSound" src="/public/sounds/click.wav" preload="auto"></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gameState';
import { useLanguageStore } from '@/stores/language';

const playerName = ref('');
const clickSound = ref(null);
const router = useRouter();
const gameState = useGameState();
const languageStore = useLanguageStore();
const { texts } = languageStore;

// Verifica se já completou a seleção de classe e redireciona se necessário
onMounted(() => {
  const hasCompletedClassSelection = localStorage.getItem('hasCompletedClassSelection');
  if (hasCompletedClassSelection === 'true') {
    router.push('/map').catch((err) => {
      console.error('Erro ao redirecionar para /map:', err);
    });
    return;
  }

  if (typeof gameState.initializePlayerName === 'function') {
    gameState.initializePlayerName();
  } else {
    console.warn('initializePlayerName is not defined in gameState');
  }

  // Se já houver um nome salvo, redireciona para /cutscene
  if (gameState.player.name && gameState.player.name.trim()) {
    router.push('/cutscene').catch((err) => {
      console.error('Erro ao redirecionar:', err);
    });
    return;
  }

  // Inicializa o input com o nome do gameState (se houver)
  playerName.value = gameState.player.name || '';
  console.log('Player name initialized:', gameState.player.name);
});

// Sincroniza o playerName com o gameState enquanto o usuário digita
watch(playerName, (newName) => {
  if (typeof gameState.setPlayerName === 'function') {
    gameState.setPlayerName(newName.trim());
    console.log('Player name updated in gameState:', newName);
  } else {
    console.warn('setPlayerName is not defined in gameState');
  }
});

function confirmarClasse() {
  const nome = playerName.value.trim();

  if (!nome) {
    console.warn('Nome vazio, não prossegue.');
    return;
  }

  // Reproduz o som de clique
  if (clickSound.value) {
    clickSound.value.play().catch((e) => console.error('Erro ao tocar som:', e));
  } else {
    console.warn('Elemento de som não encontrado');
  }

  // Define a classe do jogador
  if (typeof gameState.setPlayerClass === 'function') {
    gameState.setPlayerClass('guerreiro');
  } else {
    console.warn('setPlayerClass is not defined in gameState');
  }

  // Salva no localStorage que a seleção de classe foi concluída
  localStorage.setItem('hasCompletedClassSelection', 'true');

  // Redireciona para a próxima tela
  router.push('/cutscene').catch((err) => {
    console.error('Erro ao redirecionar:', err);
  });
}
</script>

<style scoped>
.classe-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fceabb;
  flex-direction: column;
}

.bg-texture {
  position: absolute;
  inset: 0;
  background-image: url('@/assets/class-bg.png');
  background-size: cover;
  background-position: center;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.content {
  z-index: 1;
  text-align: center;
  margin-top: -300px;
}

.title {
  font-size: 2.6rem;
  text-shadow: 2px 2px #000;
  margin-bottom: 20px;
}

.name-input {
  padding: 15px 40px;
  font-size: 1rem;
  border: 2px solid #e6b800;
  border-radius: 10px;
  width: 280px;
  text-align: center;
  background-color: #fff8dc;
  color: #2c1a00;
  margin-bottom: 35px;
  box-shadow: inset -3px -3px #e6b800, inset 3px 3px #fffbcc;
}

.start-btn {
  padding: 12px 50px;
  background: #e6b800;
  color: #2c1a00;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  box-shadow: 0 0 10px #fcd748;
}

.start-btn:hover {
  background: #ffd700;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>