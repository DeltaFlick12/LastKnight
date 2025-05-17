<template>
    <!-- :style="{ backgroundImage: 'url(@/assets/background.png)' }" -->
  <div class="game-view" >
    <div class="hud">
      <div class="stat-group">
        <div class="stat">
          ❤️ Vida: {{ health }}/100
        </div>
        <div class="stat">
          ⚡ Stamina: {{ stamina }}/100
        </div>
      </div>
      <div class="resources">
        <div>🪙 Ouro: {{ gold }}</div>
        <div>🧪 Poções: {{ potions }}</div>
      </div>
      <div class="area">📍 {{ currentArea }}</div>
    </div>

    <div class="game-content">
      <!-- Aqui vai o mapa, inimigos, NPCs, etc -->
      <p>Aqui começa sua aventura!</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Estado do jogador
const health = ref(100)
const stamina = ref(100)
const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Campo de Treinamento')
</script>

<style scoped>
.game-view {
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  font-family: 'Press Start 2P', cursive;
}

.hud {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  font-size: 16px;
}

.stat-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.resources {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.area {
  font-weight: bold;
  align-self: flex-end;
}

.game-content {
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.4);
}
</style>