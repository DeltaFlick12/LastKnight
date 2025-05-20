<template>
  <div class="options-screen">
    <h1>⚙️ Opções</h1>

    <div class="option-group">
      <label for="musicVolume">🎵 Volume da Música</label>
      <input
        type="range"
        id="musicVolume"
        v-model.number="musicVolume"
        min="0"
        max="100"
        @input="updateVolume('music')"
      />
      <span>{{ musicVolume }}%</span>
    </div>

    <div class="option-group">
      <label for="sfxVolume">🔊 Volume dos Efeitos</label>
      <input
        type="range"
        id="sfxVolume"
        v-model.number="sfxVolume"
        min="0"
        max="100"
        @input="updateVolume('sfx')"
      />
      <span>{{ sfxVolume }}%</span>
    </div>

    <div class="option-group">
      <label for="language">🌐 Idioma</label>
      <select id="language" v-model="language">
        <option value="pt">Português</option>
        <option value="en">Inglês</option>
      </select>
    </div>

    <div class="buttons">
      <button @click="saveSettings">💾 Salvar</button>
      <button @click="goBack">⬅️ Voltar</button>
    </div>

    <p v-if="saved" class="saved-msg">✔️ Configurações salvas!</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const musicVolume = ref(50)
const sfxVolume = ref(50)
const language = ref('pt')
const saved = ref(false)

onMounted(() => {
  musicVolume.value = Number(localStorage.getItem('musicVolume')) || 50
  sfxVolume.value = Number(localStorage.getItem('sfxVolume')) || 50
  language.value = localStorage.getItem('language') || 'pt'

  // Exemplo: aplicar volumes a áudio global
  updateVolume('music')
  updateVolume('sfx')
})

const saveSettings = () => {
  localStorage.setItem('musicVolume', musicVolume.value)
  localStorage.setItem('sfxVolume', sfxVolume.value)
  localStorage.setItem('language', language.value)
  saved.value = true
  setTimeout(() => (saved.value = false), 1500)
}

const goBack = () => {
  router.push('/')
}

// ⚙️ Simula aplicação do volume
const updateVolume = (type) => {
  const value = type === 'music' ? musicVolume.value : sfxVolume.value
  // Exemplo: aplicar volume a um objeto global de áudio (se existir)
  if (window.gameAudio && window.gameAudio[type]) {
    window.gameAudio[type].volume = value / 100
  }
}
</script>

<style scoped>
.options-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #121212;
  color: white;
  height: 100vh;
  padding: 40px 20px;
  font-family: 'Press Start 2P', cursive;
  position: relative;
}

h1 {
  margin-bottom: 30px;
}

.option-group {
  display: flex;
  flex-direction: column;
  width: 300px;
  margin-bottom: 20px;
}

label {
  margin-bottom: 8px;
}

input[type='range'],
select {
  width: 100%;
  padding: 5px;
  background: #1e1e1e;
  color: white;
}

span {
  margin-top: 5px;
  text-align: center;
  font-size: 12px;
}

.buttons {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

button {
  padding: 10px 30px;
  font-size: 14px;
  background-color: #8b5e3c;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.saved-msg {
  margin-top: 20px;
  color: #9fff9f;
  font-size: 14px;
}
</style>
