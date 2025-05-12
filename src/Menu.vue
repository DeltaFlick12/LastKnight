<script setup>
import { useRouter } from 'vue-router'
import bgSound from '@/assets/musica.ogg'

const router = useRouter()

function goTo(route) {
  router.push(`/${route}`)
}
</script>

<template>
  <audio :src="bgSound" autoplay loop :volume="0.3"></audio>

  <div class="menu-container">
    <img src="@/assets/Background.png" alt="Background" class="background-image" />
    <img src="@/assets/Menu.png" alt="Menu" class="menu-image" />
    <img src="@/assets/rio.gif" alt="Rio" class="background-image" />

    <!-- Botões invisíveis -->
    <div class="btn story" @click="goTo('story')"></div>
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
