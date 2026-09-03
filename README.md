# Graphenaton TDS Generator

Interface web pour générer les Technical Data Sheets (PDF A4) des films ABF à partir d'un formulaire, avec aperçu en direct.

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

- Les 5 produits de la base (ABF400 film/alu, ABF800 film/alu, ABF80 plâtre) sont préchargés depuis `src/schema.js`.
- Les modifications sont sauvegardées dans le navigateur (localStorage). « Exporter la base » télécharge un JSON à partager avec un collègue, « Importer » le recharge.
- Les champs vides sortent en « N/A » rouge sur le PDF, et un bandeau les liste dans l'éditeur.
- Le PDF est généré dans le navigateur (@react-pdf/renderer), aucun serveur nécessaire.

## Logo, pied de page, mention légale

Onglet « Logo et mentions » dans l'éditeur : charger un PNG ou JPG (fond transparent conseillé, ~800 px de large), régler la hauteur, éditer l'adresse, le site et le texte légal. Tout est mémorisé dans le navigateur et appliqué à l'aperçu et aux PDF. Sans logo chargé, le bloc « G GRAPHENATON LABS SAS » est dessiné en vectoriel.

Pour un logo par défaut intégré au déploiement : placer `logo.png` dans `public/` et mettre `logo: '/logo.png'` dans `DEFAULT_BRAND` (`src/schema.js`).

## Modifier le gabarit

- Ajouter / retirer une ligne du tableau : `SPEC_FIELDS` dans `src/schema.js` (`dual: true` pour 230/240 V, `aluOnly: true` pour les versions laminées).
- Texte légal, pied de page : `DISCLAIMER` et `FOOTER` dans `src/schema.js`.
- Mise en page PDF : `src/TdsPdf.jsx`. Aperçu HTML : `src/Preview.jsx` + `.sheet` dans `src/styles.css`.
- Schéma coté : `src/drawing.js` (partagé entre aperçu et PDF).
- Polices : `public/fonts/inter-*.ttf` (Inter, licence OFL).
