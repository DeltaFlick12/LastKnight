<template>
  <div class="tutorial-screen">
    <!-- Diálogo com Bartolomeu Dummy -->
      <img src="@/assets/bartolomeu.png" alt="Bartolomeu" class="bartolomeu-image" />
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog">Continuar</button>
    </div>

    <!-- Combate simulado -->
    <div v-if="combatStarted && !enemyDefeated" class="combat-box">
      <p>Dummy de Treino - Vida: {{ enemyHp }}/{{ enemyMaxHp }}</p>
      <button @click="attackEnemy">Atacar</button>
      <button @click="usePotion" :disabled="potions <= 0">Usar Poção</button>
    </div>

    <!-- Vitória -->
    <div v-if="enemyDefeated" class="victory-box">
      <p>Você derrotou o Dummy de Treino!</p>
      <button @click="router.push('/map')">Ir para o Mapa</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import typingSound from '@/assets/bartolomeu-voz.mp3'

const router = useRouter()

// Estados do diálogo
const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Olá, jovem guerreiro! Eu sou Bartolomeu... O dummy falante!',
  'Você vai aprender a atacar e usar poções comigo.',
  'Vamos treinar com um dummy de treino (não me acerte, por favor).',
  'Prepare-se...'
]
const displayedText = ref('')
const typing = ref(false)

// Som
let audio = new Audio(typingSound)

// Digitação
const typeLine = async () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0

  // Toca o áudio da fala
  try {
    audio.pause()
    audio.currentTime = 0
    await audio.play()
  } catch (e) {
    console.warn('Não foi possível tocar o som:', e)
  }

  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index]
      index++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40) // Velocidade da digitação
}

const nextDialog = () => {
  if (typing.value) return // Ignora cliques enquanto está digitando
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    combatStarted.value = true
  }
}

// Iniciar digitação na montagem
onMounted(() => {
  typeLine()
})

// Combate
const combatStarted = ref(false)
const enemyHp = ref(30)
const enemyMaxHp = 30
const enemyDefeated = ref(false)

const health = ref(100)
const potions = ref(3)

const attackEnemy = () => {
  const damage = Math.floor(Math.random() * 10 + 5)
  enemyHp.value -= damage
  if (enemyHp.value <= 0) {
    enemyHp.value = 0
    enemyDefeated.value = true
  }
}

const usePotion = () => {
  if (potions.value > 0) {
    health.value = Math.min(100, health.value + 30)
    potions.value--
  }
}
</script>

<style scoped>
.tutorial-screen {
  background-image: url('@/assets/tutorial-background.png');
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog-box,
.combat-box,
.victory-box {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #8b5e3c;
  border-radius: 10px;
  text-align: center;
  max-width: 500px;
  z-index: 1; /* Garante que o diálogo fique acima da imagem */
}

.bartolomeu-image {
  width: 600px;
  margin-bottom: -400px;
  margin-left: -900px;
}

button {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>