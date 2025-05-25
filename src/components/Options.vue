<template>
<<<<<<< Updated upstream
  <img src="@/assets/menu-bg.jpg" class="background-image" alt="Background" />
  <div class="options-container slide-down">
    <div class="options-box">
      <h1 class="options-title">OPÇÕES</h1>
      <div class="options-content">
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
          <div class="menu-button" @click="saveSettings">SALVAR</div>
          <div class="menu-button" @click="goBack">VOLTAR</div>
        </div>

        <p v-if="saved" class="saved-msg">✔️ Configurações salvas!</p>
      </div>
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const musicVolume = ref(50);
const sfxVolume = ref(50);
const language = ref("pt");
const saved = ref(false);

let clickSound;
onMounted(() => {
  musicVolume.value = Number(localStorage.getItem("musicVolume")) || 50;
  sfxVolume.value = Number(localStorage.getItem("sfxVolume")) || 50;
  language.value = localStorage.getItem("language") || "pt";

  clickSound = new Audio("/audio/click.ogg");
  clickSound.volume = 0.4;

  updateVolume("music");
  updateVolume("sfx");
});

const saveSettings = () => {
  playClick();
  localStorage.setItem("musicVolume", musicVolume.value);
  localStorage.setItem("sfxVolume", sfxVolume.value);
  localStorage.setItem("language", language.value);
  saved.value = true;
  setTimeout(() => (saved.value = false), 1500);
};
=======
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
>>>>>>> Stashed changes

const goBack = () => {
  router.push('/')
}

// ⚙️ Simula aplicação do volume
const updateVolume = (type) => {
<<<<<<< Updated upstream
  const value = type === "music" ? musicVolume.value : sfxVolume.value;
  if (window.gameAudio && window.gameAudio[type]) {
    window.gameAudio[type].volume = value / 100;
=======
  const value = type === 'music' ? musicVolume.value : sfxVolume.value
  // Exemplo: aplicar volume a um objeto global de áudio (se existir)
  if (window.gameAudio && window.gameAudio[type]) {
    window.gameAudio[type].volume = value / 100
>>>>>>> Stashed changes
  }
}
</script>

<style scoped>
<<<<<<< Updated upstream
.background-image {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  filter: blur(1px);
}

/* Animação de descida */
.slide-down {
  animation: slideDown 1s ease-out;
}
@keyframes slideDown {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Container */
.options-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
}

/* Caixa de opções */
.options-box {
  background: #e0a867;
  border: 6px solid #5c2c1d;
  border-radius: 10px;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
=======
.options-screen {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  color: black;
  font-size: 16px;
  text-align: center;
}

/* Barra de rolagem */
.options-content::-webkit-scrollbar {
  width: 10px;
}
.options-content::-webkit-scrollbar-track {
  background: #d17844;
}
.options-content::-webkit-scrollbar-thumb {
  background: #5c2c1d;
  border-radius: 5px;
}

/* Garante que o scroll lateral não apareça */
:global(html, body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
=======
  margin-top: 20px;
  color: #9fff9f;
  font-size: 14px;
>>>>>>> Stashed changes
}

/* Mensagem de salvamento posicionada sem causar scroll */
.saved-msg {
  color: black;
  font-size: 16px;
  text-align: center;
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
}

</style>