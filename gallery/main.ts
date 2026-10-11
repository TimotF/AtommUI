import { createApp } from 'vue';
import { createAtommVuetify } from '@timotf/atomm-ui';
import '@timotf/atomm-ui/style.css';
import '@timotf/atomm-ui/compact.css';
import Gallery from './Gallery.vue';
import './style.css';
createApp(Gallery).use(createAtommVuetify()).mount('#app');
