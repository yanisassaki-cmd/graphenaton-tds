# Graphenaton TDS Generator

Interface web pour générer les Technical Data Sheets (PDF A4) des films ABF à partir d'un formulaire, avec aperçu en direct.

Sur ordinateur : trois colonnes (produits, formulaire, aperçu). Sur téléphone (moins de 700 px de large) : sélecteur de produit en haut, formulaire sur une colonne et onglet « Aperçu » qui affiche la fiche à l'échelle de l'écran ; la génération du PDF est identique.

## Déployer sur Vercel

1. Pousser ce dossier sur un repo GitHub (ou glisser le dossier dans Vercel > Add New Project).
2. Vercel détecte Vite automatiquement : Build command `npm run build`, Output `dist`. Rien à configurer.
3. Déployer.

## En local

```
npm install
npm run dev
```

## Fonctionnement

- Fiche bilingue : sélecteur EN / FR dans l'en-tête de l'éditeur. Les valeurs sont partagées, seuls les libellés changent (`src/i18n.js` : specs, titres de sections, en-tête, texte légal EN et FR éditables dans « Logo et mentions »). Le PDF prend le suffixe `_EN` ou `_FR` ; « Télécharger tous les PDF » génère la langue sélectionnée.
- « Importer un Excel » (sidebar) charge la base `Base_TDS_GRAPHENATON` : onglet « Produits » (ligne « CHAMP », un produit par colonne, un champ par ligne) et onglet « Courbes » (points temps / température et bornes des axes). Le mapping libellé Excel → clé de l'app est l'objet `FIELD_MAP` de `src/excelImport.js` ; les cellules « À COMPLÉTER » deviennent vides ; les libellés non reconnus sont listés dans la console.
- Page 2 optionnelle par produit (case « Ajouter une page 2 ») : applications en cartes avec pictogramme (« Titre : description » par ligne, pictogramme choisi d'après le titre dans `src/page2.js` / `src/icons.js`), intégration et conformité en listes à coches avec badges CE / RoHS / REACH, stockage, conditions d'essai, tableau des spécifications mécaniques (longueur, largeur, surface active, épaisseur, poids, construction), notes. Contenus par défaut selon la version dans `page2Defaults()` (`src/schema.js`), sections vides masquées, même en-tête et pied de page. L'éditeur prévient si la page 2 déborde.
- Courbe de température : « Aucune » (pas de section), « Image chargée » ou « Générée depuis les points » (tableau temps / température + bornes, tracé SVG partagé aperçu / PDF dans `src/curve.js`).

- Les 5 produits de la base (ABF400 film/alu, ABF800 film/alu, ABF80 plâtre) sont préchargés depuis `src/schema.js`.
- Les modifications sont sauvegardées dans le navigateur (localStorage). « Exporter la base » télécharge un JSON à partager avec un collègue, « Importer » le recharge.
- Les champs vides sortent en « N/A » rouge sur le PDF, et un bandeau les liste dans l'éditeur (y compris le schéma et la courbe manquants).
- Chaque produit porte deux images chargées depuis l'onglet Produit : le schéma de dimensions (cadre « DIMENSIONS ») et la courbe de montée en température (cadre « TEMPERATURE RISE CURVE »). PNG ou JPG, redimensionnées à 1400 px de large max et encodées en JPEG (qualité 0,85) pour tenir dans le localStorage ; elles font partie de l'export / import JSON. Sans image, un cadre pointillé « à charger » apparaît dans l'aperçu (cadre vide dans le PDF). Les cotes en mm restent saisissables mais sont optionnelles.
- Si le stockage du navigateur est plein, un message l'indique : exporter la base en JSON pour conserver les images.
- Le PDF est généré dans le navigateur (@react-pdf/renderer), aucun serveur nécessaire.

## Logo, pied de page, mention légale

Onglet « Logo et mentions » dans l'éditeur : nom de la société affiché dans l'en-tête (sous « TECHNICAL DATASHEET »), charger un PNG ou JPG (fond transparent conseillé, ~800 px de large, affiché en haut à droite au-dessus du nom du produit), régler la hauteur, éditer l'adresse, le site et le texte légal. Tout est mémorisé dans le navigateur et appliqué à l'aperçu et aux PDF. Sans logo chargé, le bloc « G GRAPHENATON LABS SAS » est dessiné en vectoriel.

Pour un logo par défaut intégré au déploiement : placer `logo.png` dans `public/` et mettre `logo: '/logo.png'` dans `DEFAULT_BRAND` (`src/schema.js`).

## Modifier le gabarit

- Ajouter / retirer une ligne du tableau : `SPEC_FIELDS` dans `src/schema.js` (`dual: true` pour 230/240 V, `aluOnly: true` pour les versions laminées).
- Texte légal, pied de page : `DISCLAIMER` et `FOOTER` dans `src/schema.js`.
- Mise en page PDF : `src/TdsPdf.jsx`. Aperçu HTML : `src/Preview.jsx` + `.sheet` dans `src/styles.css`.
- Hauteurs max des images dans le PDF (190 pt chacune si les deux sont présentes, une page A4) : `FIG_PT` dans `src/TdsPdf.jsx`, miroir `FIG_PX` dans `src/Preview.jsx`.
- Ancien schéma coté généré à partir des cotes en mm : `src/drawing.js`, conservé mais plus utilisé par défaut.
- Polices : `public/fonts/inter-*.ttf` (Inter, licence OFL).
