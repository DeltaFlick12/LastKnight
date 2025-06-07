<template>
  <div class="classe-screen">
    <div class="bg-texture"></div>

    <div class="content">
      <h1 class="title">Escolha seu herói e comece a aventura!</h1>

      <input
        v-model="playerName"
        type="text"
        placeholder="Digite o nome do seu herói..."
        class="name-input"
      />

      <div>
        <button
          class="start-btn"
          :disabled="!playerName.trim()"
          @click="confirmarClasse"
        >
          Iniciar Jornada
        </button>
      </div>
    </div>

    <footer class="footer">
      Versão 0.1.0 | © 2025
    </footer>

    <audio ref="clickSound" src="publi/sounds/click.wav" preload="auto"></audio>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const playerName = ref('')
const clickSound = ref(null)
const router = useRouter()

function confirmarClasse() {
  if (!playerName.value.trim()) return
  if (clickSound.value) clickSound.value.play()

  const nome = playerName.value.trim()
  localStorage.setItem('playerName', nome)
  localStorage.setItem('playerClass', 'guerreiro')
  router.push('/tutorial')
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

.footer {
  position: absolute;
  bottom: 10px;
  right: 20px;
  font-size: 0.85rem;
  color: #c9a93d;
  opacity: 0.8;
}
</style>
