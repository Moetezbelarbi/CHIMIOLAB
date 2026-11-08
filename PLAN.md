# PLAN.md - Chimiolab

Application statique (GitHub Pages), sans build, sans dependance externe, mobile d'abord.

## 26 activites

### Premiere - Matiere
- pmat01 : dosage par etalonnage spectro
- pmat02 : dosage par etalonnage conducto
- pmat03 : titrage colorimetrique
- pmat04 : titrage pH-metrique
- pmat05 : titrage conductimetrique
- pmat06 : dissolution et dilution

### Premiere - Mouvement
- pmou02 : Boyle-Mariotte
- pmou04 : chute libre avec frottements

### Premiere - Ondes
- pond01 : diffraction
- pond02 : interferences (Young)
- pond03 : effet Doppler
- pond04 : lentille mince
- pond05 : lunette astronomique

### Terminale - Matiere
- tmat01 : pH acide faible (Ka)
- tmat02 : solution tampon
- tmat03 : pile (fem)
- tmat04 : cinetique (suivi temporel)
- tmat05 : decroissance radioactive

### Terminale - Mouvement
- tmou01 : 2e loi de Newton (Euler)
- tmou02 : champ electrique uniforme

### Terminale - Energie
- tene01 : circuit RC
- tene02 : transferts thermiques

### Terminale - Ondes
- tond01 : effet photoelectrique
- tond02 : ondes sonores
- tond03 : effet Venturi
- tond04 : poussee d'Archimede

## Architecture
- index.html, manifest.webmanifest, sw.js, styles.css
- js/config.js, i18n.js, registry.js, router.js, pwa.js, graph.js, measure.js, progress.js, report.js, main.js
- js/components/svg-library.js
- js/activities/{matiere,mouvement,energie,ondes}/*.js
- tests/*.mjs (Node, sans dependance)
