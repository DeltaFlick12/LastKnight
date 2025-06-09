<template>
  <div class="background-container" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="dark-overlay"></div>
    <div class="water-effect"></div>
    <div class="fog-layer"></div>
    <div class="dialog-box" v-if="showDialog">
      <p>{{ displayedText }}</p>
      <div class="dialog-actions" v-if="!typing">
        <button @click="atravessar">Tentar Atravessar</button>
        <button @click="voltar">Voltar para o mapa</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import bgImage from '@/assets/backviews/rio-bg.gif';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/game.js';

const router = useRouter();
const showDialog = ref(true);
const displayedText = ref('');
const typing = ref(false);

const line =
  'Ao chegar à margem do Rio das Almas Perdidas, uma névoa gélida e espessa envolve teus pés. As águas negras parecem observar-te... famintas.';

const playerHealth = computed(() => gameState.player.health);
const playerLives = computed(() => gameState.player.lives);
const currentArea = computed(() => gameState.currentArea);
const hasBlessing = computed(() => {
  console.log('hasBlessing computed:', gameState.player.hasRiverBlessing); // Debug
  return gameState.player.hasRiverBlessing;
});

function typeText() {
  typing.value = true;
  displayedText.value = '';
  let i = 0;
  const interval = setInterval(() => {
    if (i < line.length) {
      displayedText.value += line[i];
      i++;
    } else {
      clearInterval(interval);
      typing.value = false;
    }
  }, 45);
}

function atravessar() {
  console.log('Atravessar called, hasBlessing:', hasBlessing.value); // Debug
  if (!hasBlessing.value) {
    const damage = 35;
    actions.takeDamage(damage);
    if (gameState.player.health > 0) {
      alert(`As águas negras gelam seus ossos! Você sente sua vitalidade diminuir... Saúde atual: ${playerHealth.value}. Vidas restantes: ${playerLives.value}`);
    } else if (playerLives.value > 0) {
      alert(`Você foi consumido pelo rio, mas revive! Saúde restaurada: ${playerHealth.value}. Vidas restantes: ${playerLives.value}`);
    } else {
      alert("Sua alma foi reivindicada pelo rio... Todas as vidas foram perdidas.");
      actions.gameOver();
      router.push('/gameover');
    }
  } else {
    alert('A bênção protege você das profundezas sombrias. Você atravessou o rio!');
    actions.completeLevel('rio');
    actions.setCurrentArea('proxima_area');
    router.push('/proxima_area');
  }
}

function voltar() {
  actions.setCurrentArea('map');
  router.push('/map');
}

onMounted(() => {
  gameState.currentArea = 'Rio das Almas Perdidas';
  console.log('onMounted, hasRiverBlessing:', gameState.player.hasRiverBlessing); // Debug
  typeText();
});
</script>

<style scoped>
.background-container {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-image: url('/assets/backviews/rio-bg.gif');
  overflow: hidden;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(5, 0, 10, 0.35);
  pointer-events: none;
  z-index: 1;
}

.fog-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, rgba(40, 40, 50, 0.6), rgba(10, 10, 15, 0.8) 65%, rgba(0, 0, 5, 0.95) 100%);
  opacity: 0.92;
  pointer-events: none;
  z-index: 2;
}

.water-effect {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 12, 0) 0%,
    rgba(5, 8, 12, 0.5) 40%,
    rgba(8, 10, 15, 0.8) 75%,
    rgba(10, 12, 18, 0.95) 100%
  );
  opacity: 0.9;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 3;
}

.dialog-box {
  background-color: rgba(0, 0, 0, 0.842);
  padding: 25px;
  border: 2px solid #a07c4f;
  border-radius: 8px;
  text-align: center;
  max-width: 650px;
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  font-size: 24px;
  color: #ffffff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

.dialog-actions button {
  margin: 0 12px;
  padding: 12px 24px;
  background: linear-gradient(to bottom, #5a3a1f, #2a1408);
  color: #c5b08a;
  font-family: 'Uncial Antiqua', serif;
  font-size: 17px;
  border: 2px solid #8a6c4a;
  border-radius: 6px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5) inset, 0 0 8px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s, box-shadow 0.2s, background 0.3s;
}

.dialog-actions button:hover {
  transform: scale(1.03);
  background: linear-gradient(to bottom, #6b4a2f, #3b2418);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.7) inset, 0 0 12px #b49f67;
  color: #f0e0b8;
  z-index: 10;
}
</style>