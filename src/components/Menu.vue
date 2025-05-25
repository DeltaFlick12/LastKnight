<<<<<<< Updated upstream
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
=======
<script setup>
>>>>>>> Stashed changes
import { useRouter } from 'vue-router'

const router = useRouter()

function goTo(route) {
  router.push(`/${route}`)
}

const goToStory = () => {
  const hasClass = localStorage.getItem('playerClass')
  if (hasClass) {
    router.push('/story') // Vai direto pro jogo
  } else {
    router.push('/class') // Vai escolher a classe primeiro
  }
}
<<<<<<< Updated upstream

let clickSound
onMounted(() => {
  clickSound = new Audio('/audio/click.ogg')
  clickSound.volume = 0.4
})

function playClick() {
  if (clickSound) clickSound.play()
}
=======
>>>>>>> Stashed changes
</script>

<template>
  <audio src="/audio/musica-menu.ogg" autoplay loop :volume="0.3"></audio>


  <div class="menu-container">
    <img src="@/assets/menu-bg.jpg" alt="Background" class="background-image" />
    <img src="@/assets/Menu.png" alt="Menu" class="menu-image" />
    <img src="@/assets/rio.gif" alt="Rio" class="background-image" />

    <!-- Botões invisíveis -->
    <div class="btn story" @click="goToStory('story')"></div>
    <div class="btn endless" @click="goTo('endless')"></div>
    <div class="btn options" @click="goTo('options')"></div>
  </div>
</template>

<style scoped>
.menu-container {
  position: cover;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
}

/* CSS das imagems */
.background-image {
  position:fixed;
  width: 100%;
  height: 100%;
  object-fit:cover;
  z-index: -2;
  filter: blur(1px);
  overflow: hidden;
  overflow-y: hidden;
  margin-left: -7px;
  margin-top: -7px;
}

.menu-image {
  position: absolute;
  width: 60%;
  top: 20%;
  left: 23%;
  z-index: -1;
  overflow: hidden;
  overflow-y: hidden;
}

/* Estilo dos botões */
.btn {
  position: absolute;
  width: 275px;
  height: 81px;
  cursor: pointer;
  overflow-y: hidden;
}

/* Posições dos botões */
.story, .endless, .options {
  left: 43.2%;
}

.story {
  top: 45.7%;
}

.endless {
  top: 55.4%;
}

.options {
  top: 65.3%;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
