<template>
  <div class="game-view">
    <!-- HUD -->
    <div class="hud">
      <div class="stat-group">
        <div class="stat">❤️ Vida: {{ health }}/100</div>
        <div class="stat">⚡ Stamina: {{ stamina }}/100</div>
      </div>
      <div class="resources">
        <div>🪙 Ouro: {{ gold }}</div>
        <div>🧪 Poções: {{ potions }}</div>
      </div>
      <div class="area">📍 {{ currentArea }}</div>
    </div>

    <!-- Botões fixos -->
    <button class="map-button" @click="router.push('/map')">🗺️ Mapa</button>
    <button class="bag-button" @click="toggleBag">🎒 Mochila</button>

    <!-- Inventário (mochila) -->
    <div v-if="bagOpen" class="bag-modal">
      <h2>🎒 Mochila</h2>
      <ul>
        <li>🧪 Poções: {{ potions }}</li>
        <li>🗡️ Espada de Treinamento</li>
        <li>🔑 Chave da Floresta (item de missão)</li>
      </ul>
      <button @click="toggleBag">Fechar</button>
    </div>

    <div class="game-content">
    </div>
  </div>


</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()


// Estado do jogador
const health = ref(100)
const stamina = ref(100)
const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Campo de Treinamento')

// Mochila
const bagOpen = ref(false)
const toggleBag = () => {
  bagOpen.value = !bagOpen.value
}
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

.map-button {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  z-index: 1000;
}

.bag-button {
  position: absolute;
  left: 20px;
  top: 60%;
  transform: translateY(-50%);
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  z-index: 1000;
}

.bag-modal {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1e1e1e;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  padding: 20px 30px;
  color: white;
  z-index: 9999;
}

.bag-modal h2 {
  margin-top: 0;
}

.bag-modal ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.bag-modal li {
  margin-bottom: 8px;
}

</style>