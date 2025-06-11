import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Certifique-se de que o Pinia está instalado
import App from './App.vue';
import router from './router/index.js'; // Ajuste o caminho se necessário

const app = createApp(App);

// Use Pinia
const pinia = createPinia();
console.log('Pinia initialized:', pinia); // Log para verificar inicialização
app.use(pinia);

// Use Router
app.use(router);

// Mount the app
app.mount('#app');