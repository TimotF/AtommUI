# AtommUI

Bibliothèque locale de composants **Vue 3, Vuetify et TypeScript** pour les interfaces de générateurs atomm. Dépôt Git indépendant, voisin de `SliceformPuzzle`. Aucun calcul de géométrie, viewer 3D ou SDK dans ce package.

La direction visuelle reprend la sobriété des deux références fournies : scène dominante, cartes blanches discrètes, intitulés courts, contrôles compacts et détails dans l'aide contextuelle. Les couleurs, hauteurs et espacements suivent le guide atomm. Les couleurs des objets restent propres à chaque application.

## Installer et vérifier

Depuis ce dossier, avec Node 22.22 :

```sh
npm ci
npm run build
npm test
npm run build:gallery
npm run test:browser
npm run dev
```

La galerie locale utilise le port 4174 pour les contrôles Chrome. Le build distribue les composants, leur feuille de style et leurs déclarations TypeScript dans `dist/`. Vue et Vuetify sont des dépendances partagées avec l'application ; elles ne sont pas embarquées dans le bundle de la bibliothèque. Aucun CDN, police distante ou ressource d'icône distante n'est nécessaire.

Le vérificateur de composants `vue-tsc` 3.3.12 utilise TypeScript 6.0.3 : son API n'est pas compatible avec le compilateur natif TypeScript 7. Le cœur de Sliceform conserve son propre compilateur TypeScript 7.

## Utiliser dans une application

Déclarer `"@local/atomm-ui": "file:../AtommUI"`, ainsi que Vue et Vuetify, dans les dépendances de l'application. Construire la bibliothèque avant l'application. Dédupliquer `vue` et `vuetify` dans le bundler pour partager une seule instance.

```ts
import { createApp } from 'vue';
import { createAtommVuetify } from '@local/atomm-ui';
import '@local/atomm-ui/style.css';
import App from './App.vue';

createApp(App).use(createAtommVuetify('fr')).mount('#app');
```

Encadrer l'interface avec `AuRoot`, puis utiliser `AuLayout` et ses slots `lead`, `stage`, `parameters`. `AuRoot` transmet aussi la direction RTL aux composants Vuetify. Les sélecteurs de style sont limités à `.au-root` et `.au-overlay`. `AuLayout` garde les panneaux sur les côtés de la scène à toutes les largeurs vérifiées : 320 px à 1280 px, puis des largeurs compactes jusqu’à 144/184 px à 600 px. Les champs deviennent verticaux dans les panneaux étroits et leurs contenus défilent en interne ; aucun panneau ne passe sous la scène. Les titres abrégés des onglets conservent leur nom accessible complet. La direction RTL inverse les côtés logiques.

## Contrats des composants

Seize composants : `AuRoot`, `AuLayout`, `AuButton`, `AuIcon`, `AuCard`, `AuHelp`, `AuNumericField`, `AuSelect`, `AuCheckbox`, `AuSlider`, `AuTabs`, `AuAlert`, `AuProgress`, `AuSwatches`, `AuSummary`, `AuExampleCard`.

- Les champs numériques transmettent une **chaîne brute** : une saisie vide ou incomplète reste visible. L'application fournit validation, formatage et fonction d'ajustement. Aucun nombre invalide n'est converti implicitement en zéro.
- Les sélecteurs transmettent uniquement une option existante et disponible. Les boutons ordinaires restent des actions ; `active` est réservé aux boutons bascule.
- Les curseurs bornent les valeurs finies ; une plage invalide désactive le contrôle et expose cet état au lecteur d'écran.
- Les aides utilisent un vrai `VBadge` Vuetify « ? » en exposant, un bouton accessible et le curseur d’aide. Elles fonctionnent au survol, au clavier, au clic et au toucher, se ferment avec Échap, une action extérieure ou lorsque leur ancre sort du panneau. Textes et métadonnées sont interpolés et échappés.
- `AuExampleCard` fournit une carte d’action illustrée par un slot, sans format de fichier ni logique métier imposés. Le chargement et la sélection restent pilotés par l’application.
- `AuTabs` accepte un titre abrégé optionnel pour les scènes étroites et conserve le nom accessible complet.
- La progression possède des identifiants uniques et devient indéterminée si son avancement est inconnu. L'annulation est un événement vers l'application.
- Les couleurs acceptent uniquement un hexadécimal complet. La bibliothèque n'injecte aucun HTML fourni par l'utilisateur.

Chaque changement se vérifie par sa boucle ciblée : contrat → cas positif et négatif → composants compilés → interactions Chrome et rendu à 1280, 960, 885, 600 px / RTL → correction → contrôles précédents. Les tests de rendu serveur utilisent les composants réellement distribués ; la CSS est vérifiée dans Chrome, pas dans un substitut DOM. La galerie reste une démonstration de composants.

Licence du code : MIT. Dépôt local uniquement ; publication du package et intégration SDK à traiter séparément.
