# ASPHALT LEGENDS - Racing Game

Projet de jeu de course d'arcade developpe avec le moteur Babylon.js. Cette application offre une experience immersive alliant graphismes modernes, physique dynamique et environnement procedural.

---

## Fonctionnalites

- Physique de conduite realiste (acceleration, freinage, drift).
- Gestion du boost et de l'onde de choc (Nitro/Shockwave).
- Environnement urbain genere proceduralement.
- Adversaires geres par une intelligence artificielle (IA Bots) avec systeme de Takedown.
- Interface utilisateur moderne utilisant le glassmorphism.
- Audio procedural synchronise avec la vitesse du vehicule.

---

## Repartition du travail

Le projet a ete realise en cooperation etroite avec une repartition equitable de la charge de travail (50-50).

### Rahmouni Mohamed Khalil (50%)
- Initialisation de la structure globale du projet (squelette).
- Developpement du moteur physique de la voiture.
- Implementation du systeme audio procedural.
- Modelisation et integration du vehicule principal.

### Riham El Rifai (50%)
- Finalisation et polissage de la structure du projet.
- Conception et developpement du circuit procedural.
- Mise en place de l'environnement, des batiments et de la ligne d'arrivee.
- Finalisation de l'interface utilisateur et des visuels.

---

## Difficultes rencontrees et solutions

### Coordination du son et de la vitesse
L'un des plus grands defis a ete de synchroniser les frequences sonores du moteur avec la vitesse de pointe de la voiture pour eviter les decalages audio.
- **Solution** : Utilisation de formules mathematiques pour calculer le RPM relatif et application de filtres passe-bas dynamiques via Babylon's Audio Manager.

### Stabilisation de la camera
Maintenir une camera fluide lors des virages a haute vitesse sans provoquer de mal de mer a ete complexe.
- **Solution** : Implementation d'une cible de camera stable (TransformNode) separee de la rotation propre au chassis de la voiture pour lisser les mouvements brusques.

### Generation de la route procedurale
L'alignement parfait des segments de route incurves avec les barriere de securite demandait une precision mathematique rigoureuse.
- **Solution** : Developpement d'une fonction utilitaire de calcul de trajectoire basee sur la coordonnee Z pour synchroniser tous les elements de l'environnement.

---

## Justification des choix

Le choix d'un jeu de course automobile a ete motive par le desir de relever un defi technique complet. Un tel projet necessite de maitriser simultanement plusieurs domaines : la physique 3D, la gestion de la vitesse, la performance du rendu sur navigateur et l'UX. 

Contrairement a un jeu statique, la course impose un rythme effrene qui met a l'epreuve la robustesse du code et l'efficacite de la gestion memoire. Ce projet est egalement un hommage aux classiques de l'arcade (Asphalt, Burnout), tout en restant accessible directement via un simple navigateur Web.

---

## Contexte Academique

Ce projet a ete developpe dans le cadre du cursus scolaire par :
- Rahmouni Mohamed Khalil
- Riham El Rifai

Il demontre les capacites techniques acquises en developpement Web3D et en programmation JavaScript modulaire.

---

## Commandes

| Touche | Action |
| :--- | :--- |
| Fleche Haut | Accelerer |
| Fleche Bas | Freiner / Reculer |
| Fleches Gauche/Droite | Tourner |
| Espace | Activer le Boost / Nitro |
| Double Espace | Activer la Shockwave |
| F | Activer le mode Drift |
| Bouton Photo | Prendre un screenshot |