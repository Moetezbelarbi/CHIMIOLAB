# DECISIONS.md

1. Nom retenu : Chimiolab. Variante de secours : Physilab.
2. Couleur : #1565C0 (contraste AA).
3. Titrage pH : bilan de charges exact, pas de Henderson-Hasselbalch avec log 0.
4. Spectro : eps*l stocke en L/mol ; C toujours converti en mol/L avant multiplication. Le facteur 1e-3 de l'audit est teste.
5. Lentille : a OA = -f', affichage "image a l'infini", pas de nombre, pas de trace.
6. Archimede : fluide choisi par l'eleve ; rho_glace = 917 ; flottabilite testee par comparaison.
7. Doppler : fronts centres sur les positions d'emission successives.
8. Venturi : Bernoulli complet ; test D1=10, D2=5, v1=1 -> v2=4 ; dP ~ 7485 Pa.
9. Valeurs "a verifier" listees dans DONNEES.md et RAPPORT_FINAL.md.
10. i18n : test Node verifiant absence de cle manquante et absence de valeur identique FR/EN hors liste blanche.
11. PWA : CACHE_VERSION incremente a chaque livraison.
12. Pas de dependance externe, pas de build, mobile d'abord.
13. Les icones PNG livrees sont des placeholders 1x1 valides ; a remplacer par de vraies icones.
