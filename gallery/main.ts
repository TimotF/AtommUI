import { createApp } from 'vue';
import { createAtommVuetify } from '@local/atomm-ui';
import '@local/atomm-ui/style.css';
import Gallery from './Gallery.vue';
import './style.css';
createApp(Gallery).use(createAtommVuetify()).mount('#app');
