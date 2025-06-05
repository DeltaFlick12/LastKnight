<template>
 <img src="@/assets/menu-bg.jpg" class="background-image" alt="Background" />
  <div class="credits-container slide-down">
    <div class="credits-box">
      <h1 class="credits-title">CRÉDITOS</h1>
      <div class="credits-content">
        <h2>Equipe de Desenvolvimento</h2>
        <p>- Leonardo Fratoni</p>
        <p>- Eduardo Viana</p>
        <p>- Pedro Lucas</p>
        <p>- Matheus Costa</p>
        <p>- Lucas Leonardo</p>

        <h2>Agradecimentos Especiais</h2>
        <p>Prof. Hugo Fumero</p>
        <p>Univesidade Unicesumar</p>

        <h2>Ferramentas e Tecnologias</h2>
        <p>Framework: Vue.js</p>
        <p>Motor de Áudio: Howler.js</p>
        <p>Gráficos e sprites: ChatGPT</p>
        <p>Código: ChatGPT</p>
      </div>
      <div class="menu-button back-button" @click="goToMenu">MENU</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

let clickSound
onMounted(() => {
  clickSound = new Audio('/audio/click.ogg')
  clickSound.volume = 0.4
})

function playClick() {
  if (clickSound) clickSound.play()
}

function goToMenu() {
  playClick()
  router.push('/')
}
</script>

<style scoped>
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

/* Estilo do container */

.background-image {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  filter: blur(1px);
}

.credits-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7); /* Fundo semi-transparente */
  z-index: 100;
}

/* Caixa de créditos */
.credits-box {
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
.credits-title {
  font-size: 40px;
  color: #5c2c1d;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 2px 2px #d17844;
}

/* Conteúdo rolável */
.credits-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  color: #5c2c1d;
  font-size: 18px;
  text-align: left;
  margin-bottom: 20px;
}

.credits-content h2 {
  font-size: 24px;
  margin: 15px 0 10px;
  color: #3e1e14;
  border-bottom: 2px solid #5c2c1d;
}

.credits-content p {
  margin: 5px 0;
}

/* Estilo da barra de rolagem */
.credits-content::-webkit-scrollbar {
  width: 10px;
}
.credits-content::-webkit-scrollbar-track {
  background: #d17844;
}
.credits-content::-webkit-scrollbar-thumb {
  background: #5c2c1d;
  border-radius: 5px;
}

/* Botão de voltar */
.back-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 10px 40px;
  width: 200px;
  height: 30px;
  font-size: 30px;
  text-align: center;
  cursor: pointer;
  margin: 0 auto;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.back-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.back-button:active {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}
</style>