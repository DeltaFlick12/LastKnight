<template>
  <audio src="/audio/musica-menu.ogg" autoplay loop></audio>

  <div class="menu-container fade-in">
    <img src="@/assets/menu-bg.jpg" class="background-image" alt="Background" />

    <!-- LOGO ANIMADA -->
    <img src="@/assets/Logo.png" alt="Logo Last Knight" class="game-logo" />

    <!-- BOTÕES -->
    <div class="menu">
      <div class="menu-button story" @click="goToStory">STORY</div>
      <div class="menu-button endless" @click="goTo('endless')">ENDLESS</div>
      <div class="menu-button options" @click="goTo('options')">OPTIONS</div>
      <div class="menu-button credits" @click="goTo('credits')">CREDITS</div>
    </div>

    <!-- BOTÃO FULLSCREEN -->
    <div class="btn-fullscreen" @click="toggleFullscreen">
      <img src="@/assets/fullscreen-icon.png" alt="Fullscreen" class="fullscreen-icon" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goTo(route) {
  playClick()
  router.push(`/${route}`)
}

const goToStory = () => {
  playClick()
  const hasClass = localStorage.getItem('playerClass')
  router.push(hasClass ? '/story' : '/class')
}

function toggleFullscreen() {
  playClick()
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Erro ao entrar em tela cheia: ${err.message}`)
    })
  } else {
    document.exitFullscreen().catch(err => {
      console.error(`Erro ao sair do tela cheia: ${err.message}`)
    })
  }
}

let clickSound
onMounted(() => {
  clickSound = new Audio('/audio/click.ogg')
  clickSound.volume = 0.4
})

function playClick() {
  if (clickSound) clickSound.play()
}
</script>

<style scoped>
/* FADE */
.fade-in {
  animation: fadeIn 1.5s ease-in;
}
@keyframes fadeIn {
  0% { opacity: 0; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}

/* CONTAINER */

.menu-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* BACKGROUND */
.background-image {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  filter: blur(1px);
}

.river-image {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.4;
  pointer-events: none;
}

/* LOGO ANIMADA */
.game-logo {
  width: 450px;
  margin: 20px auto 20px;
  display: block;
  animation: pulseGlow 3s ease-in-out infinite;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
}

@keyframes pulseGlow {
  0% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
    overflow: hidden;
  }
  50% {
    transform: scale(1.05) rotate(2deg);
    filter: brightness(1.2) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 10px rgba(249, 231, 159, 0.7));
    overflow: hidden;
  }
  100% {
    transform: scale(1) rotate(0d eg);
    filter: brightness(1) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
    overflow: hidden;
  }
}

/* BOTÕES */
.menu {
  display: grid;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
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
  position: relative;
  image-rendering: pixelated;
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

/* BOTÃO FULLSCREEN */
.btn-fullscreen {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #e0a867;
  border: 3px solid #5c2c1d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
  z-index: 10;
}

.btn-fullscreen:hover {
  background-color: #f4b76a;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1;
}

.btn-fullscreen:active {
  transform: translateY(2px);
  box-shadow: inset -2px -2px #d17844, inset 2px 2px #ffcb8e;
}

.fullscreen-icon {
  width: 24px;
  height: 24px;
}
</style>