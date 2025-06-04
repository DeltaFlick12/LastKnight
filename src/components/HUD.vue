<template>
  <div class="main-hud">
    <!-- Painel com vida e energia -->
    <div class="panel-frame">
      <!-- Vida -->
      <div class="stat vida">
        <div class="icon-container">
          <img src="/icons/life-icon.png" alt="Vida" class="icon" />
        </div>
        <div class="bar-container">
          <div
            class="bar"
            :style="{
              width: (gameState.player.health / gameState.player.maxHealth) * 100 + '%',
            }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.health }}/{{ gameState.player.maxHealth }}
          </span>
        </div>
      </div>

      <!-- Energia -->
      <div class="stat energia">
        <div class="icon-container">
          <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
        </div>
        <div class="bar-container">
          <div
            class="bar"
            :style="{
              width: (gameState.player.stamina / gameState.player.maxStamina) * 100 + '%',
            }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.stamina }}/{{ gameState.player.maxStamina }}
          </span>
        </div>
      </div>
    </div>

    <!-- Ouro no canto inferior direito -->
    <div class="gold-display">
      <img src="/icons/gold-icon.png" alt="Ouro" class="gold-icon" />
      <span class="gold-value">{{ gameState.player.gold }}</span>
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
import { ref } from "vue";
import { useGameState } from "@/stores/gameState";
import { useRouter } from "vue-router";
import Inventory from "@/components/Inventory.vue";

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
</script>

<style scoped>
.main-hud {
  position: fixed;
  bottom: 10px;
  left: 5px;
  z-index: 1000;
  font-size: 16px;
  letter-spacing: 0.5px;
}

/* Painel de vida e energia */
.panel-frame {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-container {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.bar-container {
  position: relative;
  width: 180px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #333;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
}

.bar {
  height: 100%;
  transition: width 0.3s ease-in-out;
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

/* Ouro no canto inferior direito */
.gold-display {
  position: fixed;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.gold-icon {
  width: 74px;
  height: 74px;
  image-rendering: pixelated;
}

.gold-value {
  font-size: 48px;
  color: #fff9d6;
  text-shadow: 2px 2px 0 #000;
  font-weight: bold;
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
  width: 82px;
  height: 82px;
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
  width: 82px;
  height: 82px;
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
