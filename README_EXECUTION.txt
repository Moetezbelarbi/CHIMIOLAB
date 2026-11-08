CHIMIOLAB - FICHIERS GENERES

Ce dossier contient les 51 fichiers produits par build_chimiolab.sh.

Pour lancer localement :
1. Ouvrir un terminal dans ce dossier.
2. Lancer un serveur HTTP local (les modules ES et le service worker ne fonctionnent pas correctement via file://).
   Exemple avec Python : python -m http.server 8000
3. Ouvrir http://localhost:8000 dans le navigateur.

IMPORTANT - VERIFICATION
Le script source fourni ne genere pas tous les modules centraux references par le projet.
Le test Node echoue actuellement car js/i18n.js est absent (et d'autres modules centraux peuvent egalement manquer).
L'archive contient l'integralite des fichiers effectivement generes par le script, mais le projet ne doit pas etre considere comme valide ou entierement executable tant que ces dependances ne sont pas ajoutees et que les tests ne passent pas.
