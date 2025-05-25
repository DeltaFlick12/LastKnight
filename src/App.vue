<template>
  <audio ref="bgm" src="/audio/musica-menu.ogg" autoplay loop></audio>
  <router-view />
</template>

<script setup>
import { onMounted, ref } from 'vue'

const bgm = ref(null)

onMounted(() => {
  if (!window.gameAudio) {
    const savedMusicVolume = Number(localStorage.getItem("musicVolume")) || 50
    const savedSfxVolume = Number(localStorage.getItem("sfxVolume")) || 50

    window.gameAudio = {
      music: bgm.value,
      sfx: new Audio("/audio/click.ogg")
    }

    window.gameAudio.music.volume = savedMusicVolume / 100
    window.gameAudio.sfx.volume = savedSfxVolume / 100
  } else {
    bgm.value = window.gameAudio.music
  }
})
</script>


<style>
body {
  margin: 0;
  font-family: 'Press Start 2P', cursive;
  background-color: black;
}
</style>