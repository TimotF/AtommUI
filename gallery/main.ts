import { createApp } from 'vue';
import { createAtommVuetify } from '@timotf/atomm-ui';
import '@timotf/atomm-ui/style.css';
import '@timotf/atomm-ui/compact.css';
import Gallery from './Gallery.vue';
import Harmonisation from './Harmonisation.vue';
import './style.css';
createApp(new URLSearchParams(location.search).has('harmonisation') ? Harmonisation : Gallery).use(createAtommVuetify()).mount('#app');
