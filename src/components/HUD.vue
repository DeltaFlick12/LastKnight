<template>
  <div class="main-hud">
    <!-- Painel com vida e energia -->
    <div class="panel-frame">
      <!-- Vida -->
      <div class="stat vida">
        <div class="icon-container">
          <img src="/icons/life-icon.png" alt="Vida" class="icon" />
          <span class="lives-count">{{ gameState.player.lives }}</span>
        </div>
        <div class="bar-container segmented">
          <div
            v-for="i in maxBarSegments"
            :key="'vida-' + i"
            class="segment"
            :class="{ filled: i <= filledHealthSegments }"
          ></div>
          <span class="bar-label">
            {{ Math.floor(gameState.player.health) }}/{{ Math.floor(gameState.player.maxHealth) }}
          </span>
        </div>
      </div>

      <!-- Energia -->
      <div class="stat energia">
        <div class="icon-container">
          <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
        </div>
        <div class="bar-container segmented">
          <div
            v-for="i in maxBarSegments"
            :key="'energia-' + i"
            class="segment"
            :class="{ filled: i <= filledStaminaSegments }"
          ></div>
          <span class="bar-label">
            {{ Math.floor(gameState.player.stamina) }}/{{ Math.floor(gameState.player.maxStamina) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Botões no lado direito central -->
    <div class="hud-buttons">
      <!-- Botão MAPA -->
      <button class="map-button" @click="handleMapClick">
        <img src="/icons/map-icon.png" alt="Mapa" class="button-icon" />
      </button>

      <!-- Botão MOCHILA -->
      <button class="bag-button" @click="toggleBag">
        <img src="/icons/bag-icon.png" alt="Mochila" class="button-icon" />
      </button>
    </div>

    <!-- Inventário: renderiza somente se aberto -->
    <Inventory v-if="inventoryOpen" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Inventory from "@/components/Inventory.vue";
import { useGameState } from "@/stores/gameState";

const gameState = useGameState();

const router = useRouter();
const inventoryOpen = ref(false);

const toggleBag = () => {
  inventoryOpen.value = !inventoryOpen.value;
};

const handleMapClick = () => {
  const tutorialDone = localStorage.getItem("tutorialCompleted");
  if (!tutorialDone) {
    localStorage.setItem("tutorialCompleted", "true");
    router.push("/tutorial");
  } else {
    router.push("/map");
  }
};

const maxBarSegments = 10;

const filledHealthSegments = computed(() => {
  return Math.round(
    (gameState.player.health / gameState.player.maxHealth) * maxBarSegments
  );
});

const filledStaminaSegments = computed(() => {
  return Math.round(
    (gameState.player.stamina / gameState.player.maxStamina) * maxBarSegments
  );
});
</script>

<style scoped>
.main-hud {
  position: fixed;
  bottom: 10px;
  left: 5px;
  z-index: 1000;
  font-size: 6px;
  letter-spacing: 0.5px;
}

/* Painel de vida e energia */
.panel-frame {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-container {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  margin-left: 20px;
  z-index: 100;
}

.lives-count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
  z-index: 101;
}

.bar-container {
  position: relative;
  width: 280px;
  height: 34px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #333;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
}

.bar {
  height: 100%;
}

.bar-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  color: #fff9d6;
  text-shadow: 2px 2px 0 #000;
  font-weight: bold;
  line-height: 24px;
  letter-spacing: 1px;
}

.bar-container.segmented {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5px;
  padding: 1px;
}

.segment {
  flex: none;
  width: 26px;
  height: 28px;
  background: rgba(0, 0, 0, 0.2);
  border: 0.2px solid #222;
  box-shadow: inset 0 0 3px #000;
}

.vida .segment.filled {
  background: linear-gradient(to bottom, #ff3333, rgb(106, 15, 15));
}

.energia .segment.filled {
  background: linear-gradient(to bottom, #33cc33, rgb(11, 112, 11));
}

/* Botões no lado direito */
.hud-buttons {
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-button,
.bag-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 122px;
  height: 122px;
}

.map-button:hover img,
.bag-button:hover img {
  transform: scale(1.1);
  transition: transform 0.2s;
}

.map-button:active img,
.bag-button:active img {
  transform: scale(0.95);
  transition: transform 0.1s;
}

.button-icon {
  width: 122px;
  height: 122px;
  image-rendering: pixelated;
}

/* Cores das barras */
.vida .bar {
  background: linear-gradient(to bottom, #ff3333, #cc0000);
}

.energia .bar {
  background: linear-gradient(to bottom, #33cc33, #009900);
}
</style>