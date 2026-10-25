# AtommUI

Bibliothèque versionnée de composants **Vue 3, Vuetify et TypeScript** pour les interfaces de générateurs atomm. Le package `@timotf/atomm-ui` fournit des composants, une base et un profil compact de style, ainsi qu’un thème importable depuis Node. Les calculs métier et le SDK restent dans les applications ; l’entrée optionnelle `/three` fournit l’aperçu 3D partagé.

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

Pour une nouvelle application, installer la version publiée avec `npm install https://github.com/TimotF/AtommUI/releases/download/v0.13.0/timotf-atomm-ui-0.13.0.tgz` et déclarer les versions compatibles de Vue et Vuetify. Cette première installation crée le lockfile qui épingle l’archive ; après avoir enregistré `package.json` et le lockfile, utiliser `npm ci` pour les installations suivantes. Dédupliquer `vue` et `vuetify` dans le bundler pour partager une seule instance.

```ts
import { createApp } from 'vue';
import { createAtommVuetify } from '@timotf/atomm-ui';
import '@timotf/atomm-ui/style.css';
import '@timotf/atomm-ui/compact.css'; // profil optionnel
import App from './App.vue';

createApp(App).use(createAtommVuetify('fr')).mount('#app');
```

Encadrer l'interface avec `AuRoot`, puis utiliser `AuLayout` et ses slots `lead`, `stage`, `parameters`. `AuRoot profile="compact"` active les champs de 28 px, les actions de 32 px, les cartes de rayon 8 px et les segments compacts ; il faut aussi importer `compact.css`. Les menus et aides AtommUI téléportés reçoivent automatiquement le profil. Pour les menus, dialogues et tooltips Vuetify créés directement par l’application, ajouter `content-class="au-overlay au-profile-compact"`. L’application fournit le contenu de scène et d’export ; `AuLayout standard` fournit la disposition officielle commune. `AuRoot` transmet la direction RTL aux composants Vuetify. Les titres abrégés des onglets conservent leur nom accessible complet.

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

`AuLayout standard` active la disposition officielle : panneau de paramètres de 320 px, empilement sous 960 px de largeur de conteneur et export collant. Utiliser les classes publiques `au-parameters-header`, `au-parameters-content`, `au-parameters-footer`, `au-preview-header`, `au-preview-views`, `au-preview-help` et `au-preview-footer` dans les slots. `lead-collapsed` masque un panneau gauche absent. Les compositions historiques sans `standard` conservent leur disposition : aucune application existante ne migre automatiquement. `AuRoot` hérite de la direction du document, ou accepte une direction explicite ; les dessins restent LTR.

Le thème peut être importé côté Node sans feuille CSS : `import { atommTheme } from '@timotf/atomm-ui/theme'`.

## Contrats des composants

Trente et un composants : `AuRoot`, `AuLayout`, `AuButton`, `AuIcon`, `AuCard`, `AuHelp`, `AuNumericField`, `AuSelect`, `AuCheckbox`, `AuSlider`, `AuTabs`, `AuAlert`, `AuProgress`, `AuSwatches`, `AuSummary`, `AuExampleCard`, `AuSegmentedControl`, `AuPanelHeader`, `AuFieldNote`, `AuSwitch`, `AuSvgViewport`, `AuColorField`, `AuZoomControls`, `AuTooltip`, `AuTextField`, `AuFieldGroups`, `AuFieldGroup`, `AuSceneControls`, `AuHistoryControls`, `AuOnboardingCard`, `AuOnboarding`.

- Les champs numériques transmettent une **chaîne brute** : une saisie vide ou incomplète reste visible. L'application fournit la validation. Le clic édite le texte ; le glissement horizontal l'ajuste selon `step`. Un ajustement décimal exact est fourni, et `adjust` permet de le remplacer. Aucun nombre invalide n'est converti implicitement en zéro.
- Les sélecteurs transmettent uniquement une option existante et disponible. `UiOption.color` ajoute un petit aperçu de couleur au choix et à la liste ; les valeurs autres qu’un hexadécimal complet ne produisent aucun aperçu. Les boutons ordinaires restent des actions ; `active` est réservé aux boutons bascule.
- Les curseurs bornent les valeurs finies ; une plage invalide désactive le contrôle et expose cet état au lecteur d'écran.
- Les aides utilisent un vrai `VBadge` Vuetify « ? » en exposant, un bouton accessible et le curseur d’aide. Seul le bouton déclenche l’aide au survol, au focus, au clic et au toucher ; le libellé conserve son comportement normal. Le popover peut être survolé et se ferme avec Échap, une action extérieure ou lorsque le bouton sort du panneau. Ce contrat est aussi testé dans un menu téléporté. Textes et métadonnées sont interpolés et échappés.
- `AuNumericField` et `AuSwitch` acceptent un slot `help` pour une aide illustrée. Il fournit le contenu du popover existant, sans remplacer son bouton, ses interactions ni le libellé du contrôle. `AuHelp` expose ce même contenu par son slot `content` ; son slot par défaut reste le libellé voisin. Sans contenu personnalisé, la propriété `help` continue de rendre le texte échappé comme auparavant. L’application fournit ses images, leurs descriptions et le texte traduit ; aucun HTML brut n’est interprété depuis une chaîne.
- `AuExampleCard` fournit une carte d’action illustrée par un slot, sans format de fichier ni logique métier imposés. `layout="tile"`, valeur par défaut, offre un aperçu sur toute la largeur et une courte légende en bas. `layout="row"` place l’illustration à côté du titre. Le chargement et la sélection restent pilotés par l’application. Les transitions de survol sont supprimées avec `prefers-reduced-motion`.
- `AuSegmentedControl` reçoit `modelValue`, `items: readonly UiOption[]`, `label` et `disabled`. Il émet uniquement une option disponible. Le groupe expose des radios, une seule étape de tabulation, les flèches adaptées à RTL, ainsi que Début/Fin. Les choix indisponibles sont ignorés.
- `AuTabs` accepte un titre abrégé optionnel pour les scènes étroites et conserve le nom accessible complet.
- `AuPanelHeader` fournit une rangée d’en-tête avec un slot libre pour titre et actions. `AuFieldNote` rend une note secondaire sous forme de paragraphe ; les deux sont utilisés dans Sliceform et la galerie.
- La progression possède des identifiants uniques et devient indéterminée si son avancement est inconnu. L'annulation est un événement vers l'application.
- Les couleurs acceptent uniquement un hexadécimal complet. La bibliothèque n'injecte aucun HTML fourni par l'utilisateur.

## Options et vue SVG

`AuSwitch` reçoit `id`, `label`, `modelValue: boolean`, `disabled`, `loading`, `help` et `helpLabel`. Il émet `update:modelValue`. Le libellé reste associé au switch ; le bouton d’aide est séparé et ne change pas la valeur. Le clavier et le toucher utilisent les interactions natives Vuetify. Pendant `loading`, le switch est désactivé et expose `aria-busy`. Le consommateur fournit tous les textes traduits.

`AuSvgViewport` reçoit `bounds: {x,y,width,height}` en millimètres, `label` (description accessible avec les gestes), `displayUnit` (`mm` ou `in`), `locale` et `grid` (vrai par défaut). Les dimensions doivent être finies et positives ; des bornes invalides utilisent un cadre sûr de 100 × 100 mm. Le parent donne une hauteur au conteneur. Le slot principal contient des éléments SVG de production, sans HTML brut ; le slot nommé `overlay` reçoit éventuellement les repères d’analyse. La bibliothèque ne calcule aucune pièce et ne produit pas l’export métier.

```vue
<AuSwitch id="grid" v-model="grid" :label="t('showGrid')" :help="t('gridHelp')" />
<AuSvgViewport ref="drawing" :bounds="boundsMm" :label="t('svgControls')" :grid="grid" :display-unit="unit" :locale="locale">
  <path :d="result.path" data-operation="cut" />
  <template #overlay><!-- repères éventuels, propres à l’aperçu --></template>
</AuSvgViewport>
```

La vue fournit la grille/règles de référence Family Tree, le glissement, le zoom sous la molette, les flèches, +/−, 0 pour cadrer et Échap pour annuler le glissement. Le pinch du trackpad (`wheel` avec `ctrlKey`) reçoit un gain ×10, comme la vue 3D ; la sensibilité de la molette ordinaire reste inchangée et le zoom garde son ancrage sous le pointeur. Le focus clavier des aperçus SVG et 3D utilise une ombre intérieure très légère, sans contour. Elle expose `fit()`, `setZoom(percent)` et `zoom(factor)` (facteur inférieur à 1 pour rapprocher), et émet `zoomchange(percent)`. Grille, règles et overlays restent propres à l’aperçu : exporter le résultat du moteur, jamais le DOM de ce composant. Les contours par défaut sont sans remplissage, rouges `#FE0002` et d’épaisseur constante à l’écran. Aucun texte français ni seuil de fabrication n’est imposé dans le composant.

Avant tout autre composant manquant ou extension de rendu, présenter le besoin et l’impact aux consommateurs et attendre la décision de l’utilisateur. La procédure et les limites du produit restent dans son dépôt.

## Couleur libre

`AuColorField` fournit une rangée compacte avec un échantillon de couleur, une palette et une saisie hexadécimale sur une seule ligne « HEX », comme dans le générateur de nœud papillon. Propriétés requises : `id`, `label`, `modelValue`, `hexLabel` et `invalidMessage` ; options : `disabled`, `help`, `helpLabel`. Les libellés accessibles et messages appartiennent au consommateur et doivent être traduits ; « HEX » est la notation visible du code couleur. L’événement `update:modelValue` fournit uniquement un hexadécimal opaque complet `#rrggbb`.

La saisie conserve les valeurs incomplètes et affiche `invalidMessage` sans modifier la couleur valide. Le choix dans la palette applique immédiatement une couleur valide. Fermer puis rouvrir rétablit la dernière couleur valide. L’activateur est un bouton nommé, le popover un dialogue ; Échap ferme la palette et rend le focus au bouton. L’aide est séparée de l’activateur. Le menu hérite automatiquement du profil compact et reste dans la largeur de l’écran. Les couleurs injectées dans la CSS passent par `safeHexColor`.

```vue
<AuColorField id="preview-color" v-model="color" :label="t('color')" :hex-label="t('hexColor')" :invalid-message="t('hexColorError')" />
```

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

Licence du code : propriétaire à partir de 0.16.0 ; voir [LICENSE](LICENSE). Les versions jusqu’à 0.15.8 et les droits MIT déjà accordés restent inchangés. Les dépendances et textures conservent leurs licences : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [ASSET_LICENSES.md](ASSET_LICENSES.md). Une archive accessible ne donne pas un droit de réutilisation du code. Source : https://github.com/TimotF/AtommUI.

## Zoom et infobulles sur un activateur complet

`AuZoomControls` reçoit `percent`, `label`, `zoomInLabel`, `zoomOutLabel`, `recenterLabel`, et en option `min` (10), `max` (4000), `presets` ([25,50,100,150,200]), `disabled`. Il émet `zoom` (facteur .88 ou 1.12), `setZoom` (pourcentage) et `recenter`. Le consommateur reste propriétaire de la caméra. Les valeurs non finies ou bornes invalides désactivent les actions ; les préréglages hors limites sont exclus. Le menu se ferme avec Échap et rend le focus au bouton.

`AuTooltip` fournit un slot `activator` avec les props à transmettre à la carte ou au bouton existant : `<template #activator="{props}"><AuButton v-bind="props">…</AuButton></template>`. Le texte vient de `text` ou du slot par défaut ; options : `disabled`, `contentClass`. Survol et focus affichent l’aide. F1 l’ouvre sans activer le bouton, Échap la ferme. Sur écran tactile, un appui long (450 ms) ouvre l’aide et bloque le clic correspondant ; un déplacement ou une annulation avant ce délai laisse le défilement normal. Le clic court conserve l’action du bouton. Pour l’aide séparée d’un réglage, utiliser `AuHelp`. Tous les textes sont traduits par le consommateur.

`AuTextField` (0.6.0) reçoit `id`, `label`, `modelValue: string`, `error`, `disabled`, `readOnly`, `help`, `helpLabel` et `placeholder`. Il émet `update:modelValue` sans normaliser ni tronquer le texte. Le label, l’erreur et l’aide sont associés au champ ; la validation appartient au consommateur. Sa présentation empilée laisse toute la largeur aux textes longs. Aucun composant existant ne change.

`AuNumericField` expose aussi le slot optionnel `prepend-inner` pour placer une indication ou une action dans le champ. Sans ce slot, le rendu reste identique. Les actions de cet emplacement ne déclenchent pas le glissement numérique ; leur libellé, leur aide et leur logique restent à la charge du consommateur.


## Compositions et guide réutilisable (0.8.0)

La démonstration `/?harmonisation` montre les cartes groupées, les vignettes, le zoom, l’éclatement et le guide. Les composants existants gardent leur rendu hors de ces compositions.

### Cartes groupées

`AuFieldGroups` gère le padding commun et l’écart de 24 px entre sections. `AuFieldGroup` reprend la présentation de Plant Stakes : sous-titre, règle discrète et champs alignés. Il reçoit `title`, et en option `id`, `icon`, `caption`, `help`, `helpLabel`, `collapsible`, `initialOpen`. Le repli facultatif expose un bouton accessible indépendant de l’aide. Les IDs sont uniques même sans `id` fourni. Les textes sont échappés. Un groupe peut contenir champs, vignettes, switchs ou contenu d’application ; les valeurs et leur validation restent chez le consommateur.

```vue
<AuCard id="settings" :title="t('settings')">
  <AuFieldGroups>
    <AuFieldGroup :title="t('dimensions')">
      <AuNumericField id="width" v-model="widthDraft" :label="t('width')" suffix="mm" />
    </AuFieldGroup>
    <AuFieldGroup :title="t('appearance')">
      <!-- AuExampleCard et AuColorField avec le catalogue du consommateur -->
    </AuFieldGroup>
  </AuFieldGroups>
</AuCard>
```

### Commandes de scène

`AuSceneControls` compose `AuZoomControls` et, uniquement si `explode` et `explodeLabel` sont fournis, un `AuSlider` de 0 à 100 %. Les propriétés de zoom et les événements `zoom`, `setZoom`, `recenter` sont identiques à `AuZoomControls`. `update:explode` transmet un pourcentage ; le consommateur adapte cette valeur à son viewer. `explodeHelp`, `explodeHelpLabel`, `explodeDisabled` sont facultatifs. `disabled` bloque tous les contrôles. Le slot `extra` accueille les outils propres à une application. Les commandes passent sur plusieurs lignes dans un espace étroit. Aucun calcul ou déplacement de pièce n’est inclus.

Chaque vue garde son propre pourcentage réel, mis à jour par le viewer, y compris à la molette. `zoom(factor)` multiplie la distance de caméra : .88 rapproche et 1.12 éloigne. Le réglage absolu est fourni par `setZoom(percent)`. 100 % correspond au cadrage de référence ; les limites restent adaptées au viewer. Recentrer ne modifie pas l’éclatement.

### Onboarding

`AuOnboardingCard` reprend la carte de conseil de Sliceform : icône, titre, texte ou slot, fermer, compris et masquer. Elle reçoit les libellés traduits (`label`, `closeLabel`, `nextLabel`, `hideLabel`) et émet `close`, `next`, `hide`. C’est un dialogue non modal qui laisse les contrôles de l’application utilisables.

`AuOnboarding` ajoute la bulle repère, la surbrillance de la cible, le positionnement dans la fenêtre, le suivi du défilement/redimensionnement et le retour au focus précédent lorsque nécessaire. Fournir `root`, `step`, `open` et les mêmes libellés ; relier `update:open`, `next`, `hide`, `reactivate`. Le guide s’efface lorsqu’une cible est absente, masquée ou hors écran, ainsi que pendant un menu ou dialogue. `blocked` permet aussi une suspension explicite. Une durée `autoCloseMs` positive active une fermeture différée, suspendue pendant le survol/focus ; par défaut la lecture n’est pas chronométrée. Échap ferme la carte et conserve son repère. `hidden`, `hiddenMessage`, `reactivateLabel` permettent la notification réversible « conseils masqués ». Le thème et la direction RTL suivent `AuRoot`. Le focus entre dans la carte sans y être piégé ; un bouton marqué `data-onboarding-trigger` fournit aussi un retour de focus de secours.

`useOnboarding(steps, options)` accepte un tableau, un `computed` ou un getter d’étapes `{id,target,title,text,available?,complete?}`. Les conditions de disponibilité et d’achèvement sont définies par l’application. Le retour expose `current`, `open`, `hidden`, `completed`, `storageError`, et les actions `restart`, `next`, `hide`, `resume`. `next` acquitte une étape ; fermer sa carte ne la termine pas. `autoStart` est facultatif, désactivé par défaut. Avec `storageKey`, seules les préférences du guide sont conservées dans un format versionné ; une clé distincte par application évite les interférences. Un stockage indisponible ou corrompu laisse le guide utilisable. `storage` permet d’injecter un adaptateur ou `null` pour désactiver la persistance.

```ts
const guide = useOnboarding(computed(() => [
  { id: 'size', target: '#settings', title: t('dimensions'), text: t('sizeTip') },
  { id: 'view', target: '#scene-controls', title: t('zoom'), text: t('zoomTip') },
]), { storageKey: 'my-generator.guide.v1' });
```

```vue
<AuButton @click="guide.restart">{{ t('guide') }}</AuButton>
<AuOnboarding :root="appRoot" :step="guide.current.value" :open="guide.open.value"
  :hidden="guide.hidden.value" :label="t('tip')" :close-label="t('close')"
  :next-label="t('gotIt')" :hide-label="t('hideTips')"
  @update:open="guide.open.value = $event" @next="guide.next" @hide="guide.hide" />
```

Les parcours, textes, conditions et événements métier de Sliceform ne font pas partie du package. Aucune application existante n’a besoin de changer pour utiliser cette version du package ; chaque migration reste explicite et conserve son moteur et ses exports.

## Aperçu 3D optionnel (0.9.0)

L’entrée `@timotf/atomm-ui/three` exporte `PreviewStage`, `previewMeshes`, `PreviewMeshData` et `springStep`. Elle est indépendante de l’entrée UI : les applications sans 3D ne chargent pas Three.js. Installer le peer optionnel `three` à la version compatible et ses types pour TypeScript.

`previewMeshes({path, engraving?, thickness})` reçoit les contours du même résultat que l’export, en mm, Y vers le bas. Il utilise `SVGLoader.parse()` puis `ShapePath.toShapes()` et l’extrusion. Dans Three.js r186, `SVGLoader.createShapes()` délègue à `toShapes()` en émettant un avertissement de dépréciation ; l’appel direct conserve l’algorithme officiel sans avertissement. Un DOM XML limité aux chemins générés permet aussi cette conversion dans un Worker. Il ne s’agit pas d’un importeur de documents SVG arbitraires.

Créer `new PreviewStage(host, onZoom, onLimits?)`, appeler `setContent(meshes,{width,height,thickness})`, `setAppearance({material,color})`, `setActive(active)`, puis `dispose()` au démontage. Les commandes sont `zoom(factor)`, `setZoom(percent)` et `fit()`. Le callback de limites fournit les pourcentages réellement accessibles par la caméra. Le host porte la classe `au-three-viewport`, un nom accessible, le focus clavier et les raccourcis fournis par l’application.

Le contenu est centré dans un groupe avec une seule inversion Y ; un rig parent conserve le léger mouvement et le ressort à travers les reconstructions. La caméra et le pan ne sont pas réinitialisés lors d’un changement de paramètres. Le rendu utilise RoomEnvironment/PMREM, ACES, des faces et chants distincts et des textures photographiques CC0 de contreplaqué clair et de placage noyer, partagées avec leurs vignettes (photos de source 4K, couleur 2K et détails 1K sur des tuiles d’aperçu de 90 mm pour le contreplaqué clair et de 180 mm pour le noyer), avec des cartes de normale et de rugosité séparées. Les dimensions nulles sont ignorées ; les réapparitions et redimensionnements conservent l’état. Les ressources de chaque reconstruction sont libérées séparément des ressources partagées, libérées au démontage. `prefers-reduced-motion` désactive les mouvements et l’inertie.

`data-preview-diagnostics` expose uniquement les compteurs de rendu et de ressources, la caméra et le zoom pour les contrôles navigateur. Aucun paramètre métier ni texte utilisateur n’y est stocké. Le consommateur temporise les reconstructions sur 100–200 ms et conserve ses validations et exports.

Le guide utilise les couches 2 et 3, sans animation pulsée permanente. Les applications en review restent sur leur archive verrouillée.

## Couches visuelles facultatives (0.10.0)

`PreviewStage.setOverlay(object: THREE.Object3D | null)` attache un objet ou un groupe propre au consommateur, dans le même espace SVG (millimètres, origine en haut à gauche, Y vers le bas, Z centré dans l’épaisseur). La couche suit le centrage et le mouvement du modèle et reste attachée lors de `setContent()`. Elle permet des accessoires et diagnostics visuels sans inclure leur calcul dans AtommUI.

Le consommateur possède ces objets et leurs ressources : appeler `setOverlay(null)` avant de remplacer ou libérer ses géométries, matériaux et textures. `dispose()` du stage les détache sans les détruire. Ne jamais y placer de contrôles de caméra, de source d’éclairage ou d’élément d’export. Sans appel à cette méthode, le comportement de 0.9.0 est conservé.

## Assemblages interactifs (0.11.0)

`PreviewStage` accepte un quatrième argument facultatif `{up, direction, onFrame}`. Les vecteurs définissent le repère de caméra ; `onFrame` permet de mettre à jour une annotation pendant le mouvement du rig. Le consommateur peut limiter la fréquence de ce callback.

`setAssembly(object, bounds)` reçoit un `THREE.Object3D` et une `THREE.Box3` dans le même espace monde. Le cadrage initial tient compte de la perspective et du conteneur ; les appels suivants conservent la caméra, le pan et le rig. Des bornes comprenant la course d’ouverture permettent de réserver cet espace au cadrage. Le consommateur reste responsable des objets et de leur libération ; `setOverlay(null)` les détache avant remplacement ou démontage. `setAssembly` détache tout overlay précédent, et `setContent` revient au mode SVG.

`project(point, relativeTo?)` donne les pixels relatifs au host et la profondeur normalisée ; `relativeTo` suit aussi les transformations du rig. `raycast(clientX,clientY,objects,recursive?)` retourne les intersections Three.js. La sélection et la signification de chaque pièce appartiennent à l’application. `materials.face` et `materials.edge` peuvent être référencés par les pièces sans être détruits par le consommateur. `geometryFromPreview(data)` crée en revanche une géométrie appartenant au consommateur. `assemblyFrame` expose le calcul de cadrage, utilisable sans contexte WebGL. Les usages SVG existants gardent leurs valeurs par défaut.

### Annuler / rétablir

`AuHistoryControls` mutualise uniquement les deux boutons : icônes, libellés visibles, ordre, espacement et états désactivés. Les propriétés `label` (groupe), `undoLabel` et `redoLabel` sont traduites par le consommateur ; `canUndo` et `canRedo` valent `false` par défaut. `disabled` bloque les deux actions. Les événements `undo` et `redo` n’emportent aucun modèle. `undoId` et `redoId` sont facultatifs ; fournir des IDs distincts pour plusieurs instances.

```vue
<AuHistoryControls
  :label="`${t('undo')} / ${t('redo')}`"
  :undo-label="t('undo')" :redo-label="t('redo')"
  :can-undo="past.length > 0" :can-redo="future.length > 0"
  @undo="undo" @redo="redo"
/>
```

L’application garde ses snapshots ou commandes, ses transactions, ses limites, ses brouillons et sa persistance. Le composant n’installe aucun raccourci global : l’application reste responsable de Ctrl/Cmd+Z, Maj+Ctrl/Cmd+Z ou Ctrl/Cmd+Y, notamment pour préserver l’annulation native dans les champs. Tab, Entrée et Espace suivent le comportement des boutons natifs. Les icônes sont inversées en RTL. Aucun bouton ne soumet un formulaire. Ne pas ajouter d’historique à une application qui n’en a pas besoin.

## Vignettes de matériaux d’aperçu

`AuMaterialPicker` possède la grille de trois colonnes et compose les cartes et
`AuMaterialThumbnail` carrées. Ne pas recopier leur SVG ou leur grille dans une
application. Les titres traduits et les valeurs persistées restent chez le consommateur :

```vue
<AuMaterialPicker v-model="material" :label="t('material')" :color="color"
  :items="[
    {value:'pine', material:'pine', title:t('pine')},
    {value:'walnut', material:'walnut', title:t('walnut')},
    {value:'solid', material:'solid', title:t('solid')}
  ]"/>
<AuColorField v-if="material==='solid'" v-model="color" id="preview-color"
  :label="t('color')" :hex-label="t('hexColor')" :invalid-message="t('hexColorError')"/>
```

Chaque option accepte `disabled` et une couleur propre facultative ; la composition
accepte aussi `disabled`. Les valeurs ne sont pas réécrites : une application peut
mapper sa valeur historique `Bicolore` sur `material:'pine'`. Une valeur absente des
options ne sélectionne rien et n’est jamais corrigée silencieusement. Les images
sont décoratives, les boutons portent le titre et l’état sélectionné, les motifs
SVG ont des identifiants propres à chaque instance. `AuMaterialThumbnail` peut
également être utilisé seul. Ces choix concernent l’apparence d’aperçu ; une liste
métier de matériaux physiques peut rester un contrôle distinct.


### Outils et passes visuelles dans la scène partagée

`stage.installExtension(context => extension)` branche un outil d’orientation ou des couches propres à une app sans recréer de caméra, renderer ou OrbitControls. `context` expose `scene`, `camera`, `canvas`, `prepare(object,current)` (préparation annulable des shaders) et `navigation`. Les objets ajoutés et leurs ressources restent à la charge du consommateur.

`navigation.target()` retourne une copie ; `focus(point)` recentre la cible en conservant l’angle et la distance. `setEnabled(false)` suspend et déconnecte le geste de navigation durant une manipulation ; `setPanEnabled(false)` interdit le panoramique ; `setMotionEnabled(false)` suspend le mouvement ambiant pendant une orientation précise. Le mode inactif et les préférences de mouvement restent respectés.

L’extension fournit `dispose()` et, facultativement, `beforeRender()`, `resize(width,height,pixelRatio)` et `render(renderer,scene,camera)` pour une passe visuelle comme l’occlusion. La passe doit restaurer les états du renderer qu’elle modifie. Elle reçoit exclusivement le renderer du stage ; aucun renderer supplémentaire n’est nécessaire. `prepare()` doit recevoir une fonction de validité qui devient fausse lors de l’abandon du calcul.

Une seule extension est active par stage : le remplacement et le démontage libèrent l’ancienne, rétablissent la navigation et détachent ses outils via `dispose()`. Le dispose retourné est idempotent et ne libère pas une extension installée ensuite. Les contrôles partagés, les matériaux et les assemblages existants restent compatibles.

## Matériaux d’assemblages personnalisés (0.18.1)

L’entrée publique `@timotf/atomm-ui/three` exporte aussi `PreviewMaterialLibrary`,
`materialSurfaces`, le type `WoodKind` (`pine | walnut`) et `plywoodEdgeTexture`.
Un consommateur peut ainsi utiliser les mêmes textures photographiques que le
stage sur plusieurs familles de pièces, sans créer un second renderer.
Créer une bibliothèque par scène, appeler `get(kind)` pour obtenir les textures
de couleur, normale et rugosité, attendre `ready`, puis libérer la bibliothèque
avec la scène. Les matériaux du consommateur ne possèdent pas ces textures.
Leur échelle en millimètres est déjà portée par les textures ; `materialSurfaces`
fournit la couleur de secours et l’amplitude de normale. Cette API ne modifie
ni le rendu ni le comportement des consommateurs existants.

## Dialogue partagé (0.15.0)

`AuDialog` fournit la fenêtre modale et reprend le profil compact de `AuRoot`.
`v-model` contrôle l’ouverture, `title` donne le nom accessible et `text` la description
facultative. Les slots par défaut et `actions` acceptent du contenu et des boutons
`AuButton` traduits par le consommateur. `maxWidth` vaut 420 px. `persistent` vaut
`false` : Échap et le fond ferment la fenêtre. Le consommateur décide du sens d’une
fermeture et des choix ; aucune donnée n’est écrite par le composant.
La fenêtre maintient le focus à l’intérieur et le rend au déclencheur à la fermeture
via `VDialog`. Pour un choix obligatoire, utiliser `persistent` et fournir des actions.

```vue
<AuDialog v-model="open" :title="t('resumeTitle')" :text="t('resumeText')">
 <template #actions>
  <AuButton @click="startNew">{{t('newProject')}}</AuButton>
  <AuButton primary @click="resume">{{t('resume')}}</AuButton>
 </template>
</AuDialog>
```

Les textures de cet essai sont embarquées dans le package et chargées à la demande, sans requête externe. Une teinte de secours reste visible si le décodage échoue. Les changements rapides de matériau et le démontage ignorent les décodages devenus obsolètes ; les textures restent partagées entre les reconstructions et sont libérées avec la scène. Voir [les sources et licences](ASSET_LICENSES.md).

La valeur historique `pine` conserve sa compatibilité et affiche désormais un contreplaqué clair sans gros nœud. Les chants et parois des trous échantillonnent les couches selon l’épaisseur locale ; les coordonnées des faces, le dessin et l’export restent indépendants. Le détail normal est atténué pour une surface brute lisse.

### Version 0.18.0 — préparation de conformité Atomm

Le profil `compact` rétablit la séparation et le registre typographique des en-têtes de cartes du modèle officiel ; la composition `standard` utilise un en-tête de paramètres sans barre de titre supplémentaire. Les applications conservent la responsabilité de ne pas ajouter leur propre titre supérieur et d’insérer le bouton SDK vide avec `data-atomm-export-button`.

Les six textures 3D sont désormais des ressources relatives incluses dans `dist/`, chargées uniquement pour le matériau demandé, plutôt que des données incorporées au JavaScript. Les consommateurs doivent conserver les ressources référencées par le bundle ; un bundler comme Vite les copie et recalcule leurs URL. Couleurs : 1024 px ; cartes de détail : 512 px. Aucune image n’est demandée à un service extérieur.

`previewMeshes({path, thickness, engraving, curveSegments: 24})` permet de réduire le coût de la triangulation d’aperçu. La valeur historique 96 reste la valeur par défaut pour les consommateurs existants. Le paramètre n’affecte jamais le SVG de production ; vérifier contours, contreformes et tailles représentatives avant de l’abaisser.
