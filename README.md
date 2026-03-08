# CourtMap (Badz Impact Metro revisité)

CourtMap est une déclinaison moderne de l’idée Badz : interface sombre Metro revisitée, terrain unique partagé et QR ScanProf optimisé pour les sports de raquette/filet (badminton, tennis de table, pickleball). L’app reste 100 % locale, tactile et utilisable sur iPad pendant un cours d’EPS.

## Structure
- `index.html` : onglets **Réglages / Analyse / Bilan**, carte Acteurs (type Joueurs/Équipes, prénoms, classe, sport) et modales QR.
- `style.css` : nouvelle palette CourtMap (#1F2A35, verts #2E7D32, accents cyan/orange), terrains personnalisés, impacts halo.
- `app.js` : logique interactive (Undo/Redo, scoreboard, radar Chart.js), configuration multi-sports (raquette/filet), rendu de terrains dédiés, QR ScanProf « CourtMap ».

## Utilisation
1. **Ouvrir** `index.html` dans Chrome ou Safari (iPad). Aucun serveur requis.
2. **Réglages** : choisir Joueurs ou Équipes, saisir les prénoms + classe, puis sélectionner le sport (Badminton, Tennis de table ou Pickleball). Le terrain reste identique (terrain CourtMap façon badminton) mais le contexte sport+atelier sera reflété dans les exports.
3. **Analyse** : utiliser les zones interactives pour enregistrer les impacts (3 zones gauche/droite, 3 zones avant/arrière ou 9 zones coins/fautes). Les boutons Undo/Redo/Reset gardent le fonctionnement original.
4. **Bilan & QR** : le radar et les compteurs s’actualisent automatiquement. L’interrupteur *Afficher la heatmap* (badminton, tennis de table, pickleball uniquement) superpose une carte thermique bleu→vert→jaune→rouge par-dessus le terrain pour visualiser les zones les plus jouées, sans masquer les impacts. Cliquer sur *QR Code Prof* pour afficher le QR ScanProf + le JSON formaté (deux lignes). *Copier données* ajoute ce JSON au presse-papiers.

## QR ScanProf & Format
- `appName` = `CourtMap`, `mode` = sport courant.
- Toujours **2 participants** (Acteur 1 & Acteur 2). `nom` = libellé (Joueur 1/Joueur 2 ou Équipe A/B), `prenom` = valeur saisie, `classe` = champ commun, `atelier` = libellé du mode terrain.
- Colonnes pédagogiques issues des impacts :
  - **Modes 3 zones** (`leftright`, `frontback`) → `centre`, `exterieur`.
  - **Mode 9 zones** (`4corners`) → `centre`, `coins`, `autres`, `fautes`.
- Tout dépassement JSON > 2800 caractères déclenche l’alerte « QR trop volumineux ».

```json
{
  "appName": "CourtMap",
  "mode": "badminton",
  "date": "2026-03-08",
  "participants": [
    {
      "nom": "Joueur 1",
      "prenom": "Lina",
      "classe": "4C",
      "atelier": "3 zones avant/arrière",
      "score": 12,
      "centre": 5,
      "exterieur": 7
    },
    {
      "nom": "Joueur 2",
      "prenom": "Noah",
      "classe": "4C",
      "atelier": "3 zones avant/arrière",
      "score": 9,
      "centre": 4,
      "exterieur": 5
    }
  ]
}
```

## Multi-sports ciblés
CourtMap se limite volontairement à trois sports pour garantir une expérience cohérente et stable :
- **Badminton**
- **Tennis de table**
- **Pickleball**

Tous partagent exactement le même terrain interactif. Le sélecteur de mode applique les trois découpages communs (gauche/droite, avant/arrière, 9 zones) afin que l’aperçu, les zones cliquables, les statistiques, la heatmap et le QR restent parfaitement alignés quel que soit le sport choisi.
