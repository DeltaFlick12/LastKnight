<template>
  <div class="background-container" :style="{ backgroundImage: `url(${bgImage})` }">
    <!-- Overlay Sombrio Intensificado -->
    <div class="dark-overlay"></div>

    <!-- Efeito de Água Sombria -->
    <div class="water-effect"></div>

    <!-- Névoa Densa -->
    <div class="fog-layer"></div>

    <!-- Partículas Fantasmagóricas -->
    <div class="particle" v-for="n in 12" :key="`particle-${n}`" :style="randomParticleStyle()"></div>

    <!-- HUD -->
    <Hud
    />

    <!-- Caixa de diálogo (z-index garante que fique acima dos efeitos) -->
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
import bgImage from '@/assets/backviews/rio-bg.gif'; // Mantém o GIF original
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Hud from '@/components/Hud.vue';
// Assume que gameState e actions estão em @/stores/game.js
import { gameState, actions } from '@/stores/game.js'; 

const router = useRouter();
const fps = ref(0);
let frameCount = 0;
let lastTime = performance.now();

const showDialog = ref(true);
const displayedText = ref('');
const typing = ref(false);

const line =
  'Ao chegar à margem do Rio das Almas Perdidas, uma névoa gélida e espessa envolve teus pés. As águas negras, quase imóveis, parecem observar-te... famintas.';

// --- Reatividade com gameState ---
const playerHealth = computed(() => gameState.player.health);
const playerStamina = computed(() => gameState.player.stamina);
const playerGold = computed(() => gameState.player.gold);
const playerPotionsCount = computed(() => {
  const healthPotions = gameState.player.inventory.find(item => item.itemId.includes('potion_health'));
  return healthPotions ? healthPotions.quantity : 0;
});
const currentArea = computed(() => gameState.currentArea);
const hasBlessing = computed(() => gameState.player.hasRiverBlessing);
// --------------------------------

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
  }, 45); // Ainda mais lento
}

function atravessar() {
  if (!hasBlessing.value) {
    const damage = 35; // Dano ligeiramente aumentado
    actions.takeDamage(damage);
    alert(`As águas negras gelam seus ossos! Você sente sua vitalidade diminuir... Saúde atual: ${playerHealth.value}`);
    if (playerHealth.value <= 0) {
       alert("Sua alma foi reivindicada pelo rio...");
       // actions.gameOver(); router.push('/gameover');
    }
  } else {
    alert('A bênção protege você das profundezas sombrias. Você atravessou o rio!');
    // actions.completeArea('rio'); actions.changeArea('proxima_area'); router.push('/proxima_area');
  }
}

function voltar() {
  // actions.changeArea('map'); 
  router.push('/map');
}

onMounted(() => {
  gameState.currentArea = 'Rio das Almas Perdidas';
  updateFPS();
  typeText();
});

// FPS Tracker
function updateFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    fps.value = frameCount;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
}

// Estilo de partículas (mais sombrio/fantasmagórico)
function randomParticleStyle() {
  const top = Math.random() * 100;
  const left = Math.random() * 100;
  const duration = 12 + Math.random() * 8; // Mais lentas
  const delay = Math.random() * 10;
  const size = 8 + Math.random() * 8; // Menores

  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    // Usar uma partícula diferente se disponível, senão ajustar a atual
    // backgroundImage: 'url(\'/assets/particles/ghostly_particle.png\')',
  };
}
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-image: url('/assets/backviews/rio-bg.gif'); 
  overflow: hidden;
  /* Filtro intensificado para clima sombrio */
  filter: brightness(0.6) contrast(1.05) saturate(0.6) grayscale(0.1);
}

/* Overlay sombrio mais forte */
.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(5, 0, 10, 0.35); /* Mais escuro e roxo */
  pointer-events: none;
  z-index: 1;
}

/* Efeito de água escura e quase parada */
.water-effect {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%; /* Ligeiramente mais alto */
  background: linear-gradient(
    180deg, /* Direção ajustada */
    rgba(5, 8, 12, 0) 0%,
    rgba(5, 8, 12, 0.5) 40%,
    rgba(8, 10, 15, 0.8) 75%,
    rgba(10, 12, 18, 0.95) 100% /* Cores bem escuras */
  );
  opacity: 0.9;
  mix-blend-mode: multiply; /* Modo de mesclagem mais escuro */
  pointer-events: none;
  z-index: 4; 
  /* Animação removida ou muito sutil para água parada */
  /* animation: waterFlow 45s linear infinite alternate; */ 
}

/* Névoa mais densa */
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
  animation: fogDrift 70s linear infinite alternate; /* Mais lenta */
}

@keyframes fogDrift {
  from {
    transform: translateX(-4%);
  }
  to {
    transform: translateX(4%);
  }
}

/* Partículas fantasmagóricas */
.particle {
  position: absolute;
  /* Idealmente, usar uma imagem de partícula mais adequada */
  background-image: url('/assets/particles/particle.png'); 
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.15; /* Bem sutis */
  z-index: 3;
  animation: floatUp ease-in-out infinite; /* Movimento mais suave */
  filter: grayscale(0.5) blur(1.5px); /* Cinza e desfocado */
}

@keyframes floatUp {
  from {
    transform: translateY(0px) scale(0.8) rotate(-5deg);
    opacity: 0.15;
  }
  50% {
      opacity: 0.05;
      transform: translateY(-70px) scale(1) rotate(0deg);
  }
  to {
    transform: translateY(-160px) scale(1.3) rotate(10deg);
    opacity: 0;
  }
}

/* Caixa de diálogo permanece clara */
.dialog-box {
  background-color: rgba(10, 5, 15, 0.9); 
  padding: 25px;
  border: 2px solid #a07c4f; 
  border-radius: 8px;
  text-align: center;
  max-width: 650px;
  position: absolute;
  top: 60%; 
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10; /* Garante que fique acima dos efeitos */
  font-size: 24px; 
  color: #e0d8c0; 
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
  transition: transform 0.2s, box-shadow 0.2s, background 0.3s;
}

.dialog-actions button:hover {
  transform: scale(1.03);
  background: linear-gradient(to bottom, #6b4a2f, #3b2418);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.7) inset, 0 0 12px #b49f67;
  color: #f0e0b8;
}
</style>
