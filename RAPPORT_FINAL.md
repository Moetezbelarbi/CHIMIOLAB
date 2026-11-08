# RAPPORT_FINAL.md - Chimiolab

## Livre
- 26 activites couvrant Premiere et Terminale.
- Socle : navigation, i18n FR/EN, PWA (manifest + SW + bannieres), graphes Canvas DPR, mesures realistes, compte rendu, progression.
- Bibliotheque SVG : burette, becher, fiole, pipette, balance, spectro, banc optique, laser+fente+ecran, dynamometre, tubes piezo, seringue+capteur, agitateur, pH-metre, cellule conductimetrique.
- Tests Node : run, i18n, precache, matiere, mouvement_ondes, terminale, accessibilite, clic.

## A verifier par vous
### Valeurs "a verifier" (DONNEES.md)
1. eps*l spectro : KMnO4 2300, CuSO4 12,5, Betadine 900.
2. lambda ioniques (liste complete dans DONNEES.md).
3. pKa : CH3COOH 4,75 ; NH4+ 9,25.
4. E0 standard (Cu, Zn, Ag, Fe, H).
5. Masses volumiques : fer 7870, glace 917, eau 998, eau salee 1025, mercure 13600.
6. c_son = 331,3 + 0,606*theta.
7. Indicateurs : helianthine, BBT, phenolphtaleine.
8. Masses molaires CuSO4, CuSO4.5H2O, KMnO4, sel de Mohr.

### Choix de DECISIONS.md
- Modele pH exact par bilan de charges.
- Lentille : OA = -f' -> image a l'infini, pas de nombre.
- Archimede : fluide choisi, rho_glace = 917.
- Doppler : fronts centres sur positions d'emission.

### Points visuels
1. Icones PNG : placeholders 1x1, a remplacer.
2. Banniere d'installation PWA sur mobile.
3. Banniere de mise a jour apres increment CACHE_VERSION.
4. Rendu tactile des graphes (redimensionnement OK).
5. Contraste des statuts.

## Commandes de test
