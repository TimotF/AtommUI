# Distribuer AtommUI

La source canonique est ce dépôt. `@timotf/atomm-ui` est distribué comme une vraie archive npm `.tgz` attachée à une GitHub Release publique ; aucun compte ou jeton npm n'est nécessaire pour l'installer. Vue et Vuetify restent des dépendances partagées avec l'application.

## Version et archive

Les commits suivent Conventional Commits. Incrémenter `package.json` et `package-lock.json` selon SemVer, puis contrôler le changement dans la galerie et les applications consommatrices. Pour `0.2.0`, construire et tester localement :

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
mkdir -p /tmp/atomm-ui-package-check
npm pack --pack-destination /tmp/atomm-ui-package-check
node scripts/smoke-tarball.mjs /tmp/atomm-ui-package-check/timotf-atomm-ui-0.2.0.tgz
```

Le test de l'archive vérifie le JS, les deux feuilles CSS, les types, la licence et une installation `npm ci` dans un consommateur temporaire sans lien vers la source. La CI de branche rejoue cette boucle courte. Les tests de navigateur ciblés contrôlent les changements visuels ou d'interaction avant le tag.

Après validation du commit exact, pousser le tag annoté `v0.2.0`. Le workflow de tag vérifie que le tag et la version concordent, reconstruit l'archive, la teste dans un consommateur propre et crée la GitHub Release avec l'archive et `SHA256SUMS`. Il refuse de remplacer une release existante. Contrôler ensuite le téléchargement public et son empreinte.

Une application peut figer cette version dans `package.json` :

```json
"@timotf/atomm-ui": "https://github.com/TimotF/AtommUI/releases/download/v0.2.0/timotf-atomm-ui-0.2.0.tgz"
```

Régénérer et commiter `package-lock.json`, puis prouver `npm ci` dans un checkout propre. Le lockfile contient l'intégrité de l'archive et détecte un changement de contenu à URL inchangée. Les consommateurs n'ont pas besoin de compiler la bibliothèque ni d'accéder à son dépôt source. Utiliser toujours l'URL de la version exacte, jamais `latest`.

La publication reste pilotée par un tag validé au lieu d'installer `semantic-release` : l'archive doit être confrontée aux applications consommatrices et à la revue visuelle avant d'obtenir une URL figée. Ce choix garde la CI courte et évite la création automatique d'une version non vérifiée. Les messages Conventional Commits et SemVer restent la convention pour décider du prochain numéro.
