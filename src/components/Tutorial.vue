<template>
  <div class="tutorial-screen">
    <img src="@/assets/bartolomeu.png" alt="Bartolomeu" class="bartolomeu-image" v-if="showDialog" />

    <!-- Caixa de diálogo -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog">Continuar</button>
    </div>

    <!-- Simulação de batalha -->
    <div v-if="combatStarted && !enemyDefeated" class="combat-area">
      <div class="battle-sprites">
        <img src="@/assets/sprites/player/idle.png" alt="Você" class="player-sprite" />
        <!-- <img src="@/assets/sprites/enemies/dummy.png" alt="Dummy" class="enemy-sprite" /> -->
      </div>

      <div class="status-bars">
        <div class="status">
          <span>Você</span>
          <div class="bar">
            <div class="hp" :style="{ width: health + '%' }"></div>
          </div>
          <small>HP: {{ health }}/100 | Poções: {{ potions }}</small>
        </div>

        <div class="status">
          <span>Dummy de Treino</span>
          <div class="bar">
            <div class="hp" :style="{ width: (enemyHp / enemyMaxHp) * 100 + '%' }"></div>
          </div>
          <small>HP: {{ enemyHp }}/{{ enemyMaxHp }}</small>
        </div>
      </div>

      <div class="combat-controls">
        <button @click="attackEnemy">⚔️ Atacar</button>
        <button @click="usePotion" :disabled="potions <= 0">🧪 Usar Poção</button>
      </div>
    </div>

    <!-- Vitória -->
    <div v-if="enemyDefeated" class="victory-box">
      <p>Você derrotou o Dummy de Treino!</p>
      <button @click="router.push('/map')">Ir para o Mapa</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import typingSound from '@/assets/bartolomeu-voz.mp3'
// import attackSound from '@/assets/sfx/attack.mp3'
// import potionSound from '@/assets/sfx/potion.mp3'

const router = useRouter()

// Diálogo
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

let audio = new Audio(typingSound)

const typeLine = async () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0

  try {
    audio.pause()
    audio.currentTime = 0
    await audio.play()
  } catch {}

  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++]
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    combatStarted.value = true
  }
}

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

  // new Audio(attackSound).play()
}

const usePotion = () => {
  if (potions.value > 0) {
    health.value = Math.min(100, health.value + 30)
    potions.value--
    // new Audio(potionSound).play()
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  flex-direction: column;
}

.dialog-box,
.victory-box {
  background: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  max-width: 500px;
  text-align: center;
  margin-top: 20px;
}

.bartolomeu-image {
  position: absolute;
  width: 600px;
  margin-bottom: -400px;
  margin-left: -900px;
}

.combat-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.battle-sprites {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 600px;
}

.player-sprite,
.enemy-sprite {
  width: 100px;
  image-rendering: pixelated;
}

.status-bars {
  display: flex;
  justify-content: space-around;
  gap: 40px;
  width: 100%;
  max-width: 600px;
  font-size: 12px;
}

.status .bar {
  width: 100px;
  height: 10px;
  background: #555;
  border: 1px solid #000;
  margin: 4px 0;
}

.status .hp {
  height: 100%;
  background: #ff4040;
  transition: width 0.3s ease;
}

.combat-controls {
  display: flex;
  gap: 20px;
}

button {
  padding: 10px 18px;
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background-color: #a46d45;
}

button:disabled {
  background-color: #444;
  cursor: not-allowed;
}
</style>
