<template>
  <div class="options-container slide-down">
    <div class="options-box">
      <h1 class="options-title">{{ texts[language].title }}</h1>
      <div class="options-content">
        <div class="option-group">
          <label for="musicVolume">🎵 {{ texts[language].musicVolume }}</label>
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
          <label for="language">🌐 {{ texts[language].language }}</label>
          <select id="language" v-model="language">
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
          </select>
        </div>

        <div class="option-group">
          <label>✨ {{ texts[language].shaders }}</label>
          <div class="toggle-container" @click="toggleShaders">
            <div class="toggle-switch" :class="{ 'active': shadersEnabled }">
              <div class="toggle-button"></div>
            </div>
            <span class="toggle-label">{{ shadersEnabled ? texts[language].on : texts[language].off }}</span>
          </div>
        </div>

        <div class="buttons">
          <div class="menu-button" @click="saveSettings">{{ texts[language].save }}</div>
          <div class="menu-button" @click="goBack">{{ texts[language].back }}</div>
          <div class="menu-button danger-button" @click="resetProgress">
            {{ texts[language].reset }}
          </div>
        </div>
      </div>

      <p :class="['saved-msg', { show: saved }]">✔️ {{ texts[language].savedMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useGameState } from '@/stores/gameState.js';

const emit = defineEmits(["close"]); // ✅ movido aqui para funcionar em goBack

const router = useRouter();
const gameState = useGameState();

const texts = {
  pt: {
    title: "OPÇÕES",
    musicVolume: "Volume da Música",
    language: "Idioma",
    save: "SALVAR",
    back: "VOLTAR",
    reset: "RESETAR PROGRESSO",
    savedMsg: "Configurações salvas!",
    shaders: "Efeitos de Luz",
    on: "Ligado",
    off: "Desligado",
    confirmReset: "Tem certeza que deseja resetar todo o progresso?"
  },
  en: {
    title: "OPTIONS",
    musicVolume: "Music Volume",
    language: "Language",
    save: "SAVE",
    back: "BACK",
    reset: "RESET PROGRESS",
    savedMsg: "Settings saved!",
    shaders: "Light Effects",
    on: "On",
    off: "Off",
    confirmReset: "Are you sure you want to reset all progress?"
  }
};

const musicVolume = ref(50);
const language = ref("pt");
const shadersEnabled = ref(true);
const saved = ref(false);
let clickSound;

onMounted(() => {
  const storedMusicVolume = localStorage.getItem("musicVolume");
  musicVolume.value = storedMusicVolume !== null ? Number(storedMusicVolume) : 50;

  const storedLanguage = localStorage.getItem("language");
  language.value = storedLanguage && ['pt', 'en'].includes(storedLanguage) ? storedLanguage : "pt";

  shadersEnabled.value = gameState.shaders !== undefined ? gameState.shaders : true;

  clickSound = new Audio("/sounds/click.wav");
  clickSound.volume = 0.4;

  updateVolume("music");
});

watch(language, (newLang) => {
  localStorage.setItem("language", newLang);
});

const resetProgress = () => {
  playClick();
  if (confirm(texts[language.value].confirmReset)) {
    localStorage.clear();
    location.reload();
  }
};

const saveSettings = () => {
  playClick();
  localStorage.setItem("musicVolume", musicVolume.value);
  localStorage.setItem("language", language.value);
  gameState.shaders = shadersEnabled.value;
  gameState.saveState();
  updateVolume("music");
  saved.value = true;
  setTimeout(() => (saved.value = false), 1500);
};

const toggleShaders = () => {
  playClick();
  shadersEnabled.value = !shadersEnabled.value;
};

const goBack = () => {
  playClick();
  emit("close"); // ✅ agora realmente fecha o overlay
};

const updateVolume = (type) => {
  const value = type === "music" ? musicVolume.value : 0;
  if (window.gameAudio?.music) {
    window.gameAudio.music.volume = value / 100;
  }
};

function playClick() {
  if (clickSound) clickSound.play();
}
</script>

<style scoped>
.options-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3); /* fundo escurecido translúcido */
  backdrop-filter: blur(2px); /* leve desfoque do que está atrás */
  z-index: 100;
}

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

.options-box {
  background: #e0a867;
  border: 4px solid #5c2c1d;
  padding: 30px;
  border-radius: 12px;
  min-width: 400px;
  box-shadow: 0 0 10px #000;
}

.options-title {
  font-size: 40px;
  color: #5c2c1d;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 2px 2px #d17844;
}

.options-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #e0a867;
  font-size: 18px;
  text-align: left;
  margin-bottom: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

label {
  font-size: 20px;
  color: #5c2c1d;
  margin-bottom: 8px;
}

input[type="range"] {
  width: 100%;
  height: 20px;
  background: #d17844;
  border: 2px solid #5c2c1d;
  border-radius: 5px;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb,
input[type="range"]::-moz-range-thumb {
  width: 30px;
  height: 30px;
  background: #5c2c1d;
  border: 2px solid #ffcb8e;
  border-radius: 5px;
  cursor: pointer;
}

span {
  margin-top: 5px;
  text-align: center;
  font-size: 16px;
  color: #5c2c1d;
}

select {
  width: 100%;
  padding: 10px;
  background: #d17844;
  border: 2px solid #5c2c1d;
  border-radius: 5px;
  font-size: 16px;
  color: #5c2c1d;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%235c2c1d" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
  appearance: none;
}

select:focus {
  outline: none;
  background-color: #ffcb8e;
}

.toggle-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 5px;
}

.toggle-switch {
  position: relative;
  width: 60px;
  height: 30px;
  background: #d17844;
  border: 2px solid #5c2c1d;
  border-radius: 15px;
  transition: all 0.3s;
}

.toggle-switch.active {
  background: #5c2c1d;
}

.toggle-button {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 26px;
  height: 26px;
  background: #ffcb8e;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-switch.active .toggle-button {
  left: 32px;
}

.toggle-label {
  margin-left: 10px;
  font-size: 18px;
  font-weight: bold;
}

.buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.menu-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 10px 40px;
  width: 200px;
  height: 50px;
  font-size: 24px;
  text-align: center;
  cursor: pointer;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
}

.menu-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
}

.menu-button:active {
  transform: translateY(2px);
}

.danger-button {
  background-color: #b22222;
  color: #fff2cc;
  border-color: #7e1a1a;
  box-shadow: inset -6px -6px #8b0000, inset 6px 6px #ff4040;
}

.danger-button:hover {
  background-color: #9b1d1d;
}

.danger-button:active {
  transform: translateY(2px);
}

.saved-msg {
  position: absolute;
  bottom: 11px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff2cc;
  padding: 8px 16px;
  border-radius: 8px;
  color: #5c2c1d;
  font-size: 18px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.saved-msg.show {
  opacity: 1;
}

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

:global(html, body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
}
</style>