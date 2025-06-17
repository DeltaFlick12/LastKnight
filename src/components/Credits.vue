<template>
  <div class="credits-screen" :style="creditsBackgroundStyle">
    <div class="credits-scroll-container" ref="scrollContainer">
      <div class="credits-content">
        <!-- Logo Placeholder -->
        <h1 class="game-title">LastKnight</h1>
        <div class="spacer"></div>

        <!-- Créditos -->
        <div class="credit-section">
          <h2>Desenvolvimento</h2>
          <p><span>Diretor Criativo:</span> [Seu Nome / Nome do Estúdio]</p>
          <p><span>Programador Líder:</span> [Seu Nome / Nome do Programador]</p>
          <p><span>Artista Líder:</span> [Nome do Artista]</p>
          <p><span>Designer de Som:</span> [Nome do Designer]</p>
          <p><span>Roteirista:</span> [Nome do Roteirista]</p>
        </div>

        <div class="credit-section">
          <h2>Arte</h2>
          <p><span>Pixel Art:</span> [Nome do Artista]</p>
          <p><span>Arte Conceitual:</span> [Nome do Artista]</p>
          <p><span>Animação:</span> [Nome do Animador]</p>
        </div>

        <div class="credit-section">
          <h2>Música</h2>
          <p><span>Compositor:</span> [Nome do Compositor]</p>
          <p><span>Trilha Sonora Adicional:</span> [Nomes Adicionais]</p>
        </div>

        <div class="credit-section">
          <h2>Agradecimentos Especiais</h2>
          <p>[Nome Playtester 1]</p>
          <p>[Nome Playtester 2]</p>
          <p>Família e Amigos</p>
          <p>Comunidade Vue.js</p>
          <p>Você, por jogar!</p>
        </div>

        <div class="credit-section">
          <h2>Ferramentas</h2>
          <p>Vue 3</p>
          <p>Vite</p>
          <p>[Software de Arte]</p>
          <p>[Software de Áudio]</p>
        </div>

        <div class="spacer"></div>
        <p class="copyright">© {{ currentYear }} [Seu Nome / Nome do Estúdio]. Todos os direitos reservados.</p>
        <div class="spacer"></div>
        <div class="spacer"></div>
      </div>
    </div>
    <button class="skip-button" @click="goToMainMenu">Voltar ao Menu</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { playAudio, stopAudio } from '@/utils/audioManager.js'; // Ajuste o caminho

const route = useRoute();
const router = useRouter();

const scrollContainer = ref(null);
const currentYear = new Date().getFullYear();
const endingType = ref(route.params.type || '3'); // Default to true ending if type is missing

let scrollInterval = null;
let clickSound = null; // Instância para o som de clique

// Mapeamento de estilos e música por final
const endingStyles = {
  1: { // Sacrifício
    background: 'linear-gradient(to bottom, #5a5a7a, #a0a0c0)', // Céu melancólico com sol nascente
    music: 'credits_ending_sacrifice'
  },
  2: { // Trágico
    background: 'linear-gradient(to bottom, #1a1a2e, #404050)', // Tempestade escura
    music: 'credits_ending_tragic'
  },
  3: { // Verdadeiro
    background: 'linear-gradient(to bottom, #87ceeb, #c0b0a0)', // Céu claro sobre reino reconstruído
    music: 'credits_ending_true'
  }
};

const creditsBackgroundStyle = computed(() => {
  const style = endingStyles[endingType.value] || endingStyles['3'];
  return { background: style.background };
});

onMounted(() => {
  const style = endingStyles[endingType.value] || endingStyles['3'];
  playAudio(style.music, { loop: true });

  // Inicializar o som de clique
  clickSound = new Audio('/sounds/click.wav');
  clickSound.volume = 0.4;

  // Iniciar a rolagem
  const container = scrollContainer.value;
  if (container) {
    let scrollTop = 0;
    const scrollSpeed = 1; // Pixels por frame (ajustar)
    const contentHeight = container.scrollHeight;
    const containerHeight = container.clientHeight;

    scrollInterval = setInterval(() => {
      scrollTop += scrollSpeed;
      container.scrollTop = scrollTop;
      // Parar quando o conteúdo sair da tela
      if (scrollTop >= contentHeight - containerHeight) {
        // clearInterval(scrollInterval);
        // Opcional: voltar ao menu automaticamente ou parar a rolagem
        // goToMainMenu();
      }
    }, 16); // Aproximadamente 60fps
  }
});

onUnmounted(() => {
  stopAudio(); // Para toda a música ao sair
  clearInterval(scrollInterval);
  if (clickSound) {
    clickSound.pause();
    clickSound = null; // Limpa a instância
  }
});

const goToMainMenu = () => {
  if (clickSound) {
    clickSound.currentTime = 0; // Reseta o áudio para o início
    clickSound.play().catch((error) => {
      console.error('Erro ao reproduzir o som de clique:', error);
    });
  }
  router.push('/');
};
</script>

<style scoped>
/* Estilo permanece inalterado */
.credits-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Press Start 2P', cursive; /* Ou outra fonte pixelada */
  overflow: hidden;
  position: relative;
}

.credits-scroll-container {
  width: 80%;
  max-width: 700px;
  height: 80%;
  overflow-y: hidden; /* A rolagem é feita via JS */
  position: relative;
  border: 3px solid #ccc; /* Borda estilizada */
  background-color: rgba(0, 0, 0, 0.5); /* Fundo semi-transparente para legibilidade */
  padding: 0 20px;
}

.credits-content {
  text-align: center;
  padding-top: 100%; /* Começa fora da tela em cima */
  padding-bottom: 50px;
}

.game-title {
  font-size: 3rem;
  margin-bottom: 40px;
  color: #ffd700; /* Dourado */
}

.credit-section {
  margin-bottom: 40px;
}

.credit-section h2 {
  font-size: 1.5rem;
  color: #aaa;
  margin-bottom: 15px;
}

.credit-section p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 5px;
}

.credit-section p span {
  color: #ccc; /* Destaca a função */
  margin-right: 10px;
}

.copyright {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 50px;
}

.spacer {
  height: 50px;
}

.skip-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid white;
  z-index: 10;
}
</style>