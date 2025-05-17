<template>
  <div class="options-screen">
    <h1>Opções</h1>

    <div class="option-group">
      <label for="musicVolume">Volume da Música</label>
      <input type="range" id="musicVolume" v-model="musicVolume" min="0" max="100" />
    </div>

    <div class="option-group">
      <label for="sfxVolume">Volume dos Efeitos</label>
      <input type="range" id="sfxVolume" v-model="sfxVolume" min="0" max="100" />
    </div>

    <div class="option-group">
      <label for="language">Idioma</label>
      <select id="language" v-model="language">
        <option value="pt">Português</option>
        <option value="en">Inglês</option>
      </select>
    </div>

    <button @click="saveSettings">Salvar</button>
    <button @click="goBack">Voltar</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Valores de configuração
const musicVolume = ref(localStorage.getItem('musicVolume') || 50)
const sfxVolume = ref(localStorage.getItem('sfxVolume') || 50)
const language = ref(localStorage.getItem('language') || 'pt')

const saveSettings = () => {
  localStorage.setItem('musicVolume', musicVolume.value)
  localStorage.setItem('sfxVolume', sfxVolume.value)
  localStorage.setItem('language', language.value)
  alert('Configurações salvas!')
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.options-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: #1e1e1eaa;
  color: white;
  height: 100vh;
  padding: 40px;
  backdrop-filter: blur(5px);
}

.option-group {
  display: flex;
  flex-direction: column;
  width: 300px;
}

label {
  margin-bottom: 5px;
}

input[type="range"],
select {
  width: 100%;
  padding: 5px;
}

button {
  padding: 10px 30px;
  font-size: 16px;
  background-color: #8b5e3c;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}
</style>
