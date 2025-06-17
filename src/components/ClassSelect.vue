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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gameState';
import { useLanguageStore } from '@/stores/language';

const playerName = ref('');
const clickSound = ref(null);
const router = useRouter();
const gameState = useGameState();
const languageStore = useLanguageStore();
const { texts } = languageStore;

onMounted(() => {
  try {
    console.log('GameState actions:', gameState); // Debug: Log all actions
    if (typeof gameState.initializePlayerName === 'function') {
      gameState.initializePlayerName();
      console.log('Player name initialized:', gameState.player.name);
    } else {
      console.error('initializePlayerName is not a function in gameState');
    }
    if (gameState.player.name) {
      playerName.value = gameState.player.name;
    }
  } catch (error) {
    console.error('Error in onMounted:', error);
  }
});

function confirmarClasse() {
  console.log('Nome digitado:', playerName.value);

  if (!playerName.value.trim()) {
    console.warn('Nome vazio, não prossegue.');
    return;
  }

  if (clickSound.value) {
    try {
      clickSound.value.play();
    } catch (e) {
      console.error('Erro ao tocar som:', e);
    }
  } else {
    console.warn('Elemento de som não encontrado');
  }

  const nome = playerName.value.trim();

  if (typeof gameState.setPlayerName === 'function') {
    gameState.setPlayerName(nome);
  } else {
    console.error('setPlayerName não é uma função');
  }

  if (typeof gameState.setPlayerClass === 'function') {
    gameState.setPlayerClass('guerreiro');
  } else {
    console.error('setPlayerClass não é uma função');
  }

  try {
    router.push('/cutscene');
  } catch (err) {
    console.error('Erro ao redirecionar:', err);
  }
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