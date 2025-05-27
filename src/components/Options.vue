<template>
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
    </div>
  </div>
</template>

<script setup>
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

const goBack = () => {
  playClick();
  router.push("/");
};

const updateVolume = (type) => {
  const value = type === "music" ? musicVolume.value : sfxVolume.value;
  if (window.gameAudio && window.gameAudio[type]) {
    window.gameAudio[type].volume = value / 100;
  }
};

function playClick() {
  if (clickSound) clickSound.play();
}
</script>

<style scoped>
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
  display: flex;
  flex-direction: column;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  image-rendering: pixelated;
}

/* Título */
.options-title {
  font-size: 40px;
  color: #5c2c1d;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 2px 2px #d17844;
}

/* Conteúdo */
.options-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  color: #5c2c1d;
  font-size: 18px;
  text-align: left;
  margin-bottom: 20px;
}

/* Grupo de opções */
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
  -webkit-appearance: none;
  appearance: none;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 30px;
  height: 30px;
  background: #5c2c1d;
  border: 2px solid #ffcb8e;
  border-radius: 5px;
  cursor: pointer;
}

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
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%235c2c1d" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
}

select:focus {
  outline: none;
  background-color: #ffcb8e;
}

/* Botões */
.buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 10px;
}

.menu-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 10px 40px;
  width: 200px;
  height: 30px;
  font-size: 30px;
  text-align: center;
  cursor: pointer;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.menu-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.menu-button:active {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}

/* Mensagem de salvamento */
.saved-msg {
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