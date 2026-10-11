# AtommUI

Bibliothèque versionnée de composants **Vue 3, Vuetify et TypeScript** pour les interfaces de générateurs atomm. Le package `@timotf/atomm-ui` fournit 19 composants, une base et un profil compact de style, ainsi qu’un thème importable depuis Node. Aucun calcul de géométrie, viewer 3D ou SDK n’y est inclus.

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

La galerie locale utilise le port 4174 pour les contrôles Chrome. Le build distribue les composants, `style.css`, `compact.css`, le thème JavaScript et leurs déclarations TypeScript dans `dist/`. Vue et Vuetify sont des dépendances partagées avec l'application ; elles ne sont pas embarquées dans le bundle de la bibliothèque. Aucun CDN, police distante ou ressource d'icône distante n'est nécessaire.

Le vérificateur de composants `vue-tsc` 3.3.12 utilise TypeScript 6.0.3 : son API n'est pas compatible avec le compilateur natif TypeScript 7. Le cœur de Sliceform conserve son propre compilateur TypeScript 7.

## Utiliser dans une application

Pour une nouvelle application, installer la version publiée avec `npm install https://github.com/TimotF/AtommUI/releases/download/v0.2.0/timotf-atomm-ui-0.2.0.tgz` et déclarer les versions compatibles de Vue et Vuetify. Cette première installation crée le lockfile qui épingle l’archive ; après avoir enregistré `package.json` et le lockfile, utiliser `npm ci` pour les installations suivantes. Dédupliquer `vue` et `vuetify` dans le bundler pour partager une seule instance.

```ts
import { createApp } from 'vue';
import { createAtommVuetify } from '@timotf/atomm-ui';
import '@timotf/atomm-ui/style.css';
import '@timotf/atomm-ui/compact.css'; // profil optionnel
import App from './App.vue';

createApp(App).use(createAtommVuetify('fr')).mount('#app');
```

Encadrer l'interface avec `AuRoot`, puis utiliser `AuLayout` et ses slots `lead`, `stage`, `parameters`. `AuRoot profile="compact"` active les champs de 28 px, les actions de 32 px, les cartes de rayon 8 px et les segments compacts ; il faut aussi importer `compact.css`. Les menus et aides AtommUI téléportés reçoivent automatiquement le profil. Pour les menus, dialogues et tooltips Vuetify créés directement par l’application, ajouter `content-class="au-overlay au-profile-compact"`. Le placement de la scène, l’export et le responsive métier restent dans l’application. `AuRoot` transmet la direction RTL aux composants Vuetify. Les titres abrégés des onglets conservent leur nom accessible complet.

Un consommateur minimal peut rendre les trois régions sans aucun code Sliceform :

```vue
<script setup lang="ts">
import { AuRoot, AuLayout, AuPanelHeader, AuCard, AuNumericField, AuButton } from '@timotf/atomm-ui';
import { ref } from 'vue';
const amount = ref('2,5');
</script>

<template>
  <AuRoot profile="compact" direction="ltr" class="my-generator">
    <AuLayout lead-label="Exemples" stage-label="Aperçu" parameters-label="Réglages">
      <template #lead><AuPanelHeader>Exemples</AuPanelHeader></template>
      <template #stage><div class="my-stage">Aperçu</div></template>
      <template #parameters>
        <AuCard id="settings" title="Réglages">
          <AuNumericField id="amount" v-model="amount" label="Écart" suffix="mm" />
          <AuButton id="apply" primary>Appliquer</AuButton>
        </AuCard>
      </template>
    </AuLayout>
  </AuRoot>
</template>

<style>
html, body, #app { height: 100%; margin: 0; }
.my-generator { height: 100%; }
</style>
```

`AuLayout` fournit les régions accessibles, les rails et la scène avec les largeurs configurables `--au-lead-width` et `--au-parameters-width`. L’application définit la hauteur du conteneur, la mise en colonne éventuelle sous un seuil adapté à son contenu, le défilement, le footer collant et le placement des outils sur la scène. Sliceform compose ces régions avec la scène en premier sous 960 px ; cette règle appartient à Sliceform et n’est pas imposée aux autres générateurs.

Le thème peut être importé côté Node sans feuille CSS : `import { atommTheme } from '@timotf/atomm-ui/theme'`.

## Contrats des composants

Dix-neuf composants : `AuRoot`, `AuLayout`, `AuButton`, `AuIcon`, `AuCard`, `AuHelp`, `AuNumericField`, `AuSelect`, `AuCheckbox`, `AuSlider`, `AuTabs`, `AuAlert`, `AuProgress`, `AuSwatches`, `AuSummary`, `AuExampleCard`, `AuSegmentedControl`, `AuPanelHeader`, `AuFieldNote`.

- Les champs numériques transmettent une **chaîne brute** : une saisie vide ou incomplète reste visible. L'application fournit la validation. Le clic édite le texte ; le glissement horizontal l'ajuste selon `step`. Un ajustement décimal exact est fourni, et `adjust` permet de le remplacer. Aucun nombre invalide n'est converti implicitement en zéro.
- Les sélecteurs transmettent uniquement une option existante et disponible. `UiOption.color` ajoute un petit aperçu de couleur au choix et à la liste ; les valeurs autres qu’un hexadécimal complet ne produisent aucun aperçu. Les boutons ordinaires restent des actions ; `active` est réservé aux boutons bascule.
- Les curseurs bornent les valeurs finies ; une plage invalide désactive le contrôle et expose cet état au lecteur d'écran.
- Les aides utilisent un vrai `VBadge` Vuetify « ? » en exposant, un bouton accessible et le curseur d’aide. Seul le bouton déclenche l’aide au survol, au focus, au clic et au toucher ; le libellé conserve son comportement normal. Le popover peut être survolé et se ferme avec Échap, une action extérieure ou lorsque le bouton sort du panneau. Ce contrat est aussi testé dans un menu téléporté. Textes et métadonnées sont interpolés et échappés.
- `AuExampleCard` fournit une carte d’action illustrée par un slot, sans format de fichier ni logique métier imposés. `layout="tile"`, valeur par défaut, offre un aperçu sur toute la largeur et une courte légende en bas. `layout="row"` place l’illustration à côté du titre. Le chargement et la sélection restent pilotés par l’application. Les transitions de survol sont supprimées avec `prefers-reduced-motion`.
- `AuSegmentedControl` reçoit `modelValue`, `items: readonly UiOption[]`, `label` et `disabled`. Il émet uniquement une option disponible. Le groupe expose des radios, une seule étape de tabulation, les flèches adaptées à RTL, ainsi que Début/Fin. Les choix indisponibles sont ignorés.
- `AuTabs` accepte un titre abrégé optionnel pour les scènes étroites et conserve le nom accessible complet.
- `AuPanelHeader` fournit une rangée d’en-tête avec un slot libre pour titre et actions. `AuFieldNote` rend une note secondaire sous forme de paragraphe ; les deux sont utilisés dans Sliceform et la galerie.
- La progression possède des identifiants uniques et devient indéterminée si son avancement est inconnu. L'annulation est un événement vers l'application.
- Les couleurs acceptent uniquement un hexadécimal complet. La bibliothèque n'injecte aucun HTML fourni par l'utilisateur.

## Saisie numérique et glissement

`AuNumericField` accepte `step`, `min`, `max`, `readOnly`, `disabled`, `drag` et `dragPixelsPerStep` (8 par défaut). `min`/`max` bornent les gestes et raccourcis ; ils ne modifient jamais silencieusement la frappe. `input-mode="numeric"` limite les ajustements aux entiers et conserve les brouillons saisis pour leur validation par l'application. `:drag="false"` désactive le glissement.

Le geste démarre après 6 pixels et seulement si le mouvement est nettement horizontal. Un mouvement vertical laisse défiler le panneau sur écran tactile. Le champ prend la capture du pointeur pendant le geste ; Échap, l'annulation tactile et la perte de capture restaurent exactement le texte initial. Une valeur externe nouvelle ou le démontage arrête le geste. Un champ désactivé ou en lecture seule ne change pas.

Maj + flèche Haut/Bas ajuste de dix pas, Maj + Alt de 0,1 pas. Pendant le glissement, Maj multiplie le pas par dix et Alt par 0,1. Les directions gauche/droite arrondissent symétriquement. Le clic court garde l'édition et la sélection de texte.

Deux helpers publics évitent le bruit des additions flottantes :

```ts
import { adjustNumericDraft, decimalStepDelta } from '@timotf/atomm-ui';

adjustNumericDraft('0,1', 0.01, { min: 0, max: 10 }); // '0,11'
decimalStepDelta(3, 0.1); // 0.3
```

`adjustNumericDraft(text, delta, { min?, max?, decimalSeparator? })` et `decimalStepDelta(steps, step, multiplier?)` renvoient `null` si les paramètres sont invalides. L'arithmétique décimale interne conserve la précision. Le helper accepte les virgules ou points complets ; une virgule présente est conservée, sinon `decimalSeparator` définit le séparateur du résultat. Une application imposant une langue doit valider cette langue dans son callback `adjust` avant d'appeler le helper. Les brouillons vides, `-`, `0,` ou non finis ne sont pas ajustés.

Chaque changement se vérifie par sa boucle ciblée : contrat → cas positif et négatif → composants compilés → interactions Chrome et rendu à 1280, 960, 885, 600 px / RTL → correction → contrôles précédents. Les tests de rendu serveur utilisent les composants réellement distribués ; la CSS est vérifiée dans Chrome, pas dans un substitut DOM. La galerie reste une démonstration de composants.

Licence du code : MIT. Source : https://github.com/TimotF/AtommUI.
