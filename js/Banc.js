// Banc.js — classe du banc de poissons (p5.js)

class Banc {
  constructor(n, imagePoisson, vitesseMax, forceDeDeplacementMax, objectifDeSeparation, distanceDInfluence) {
    this.imagePoisson = imagePoisson;
    console.log('Banc → image width =', this.imagePoisson && this.imagePoisson.width); // check qu'on a recu l'image
    this.vitesseMax = vitesseMax;                   // pixels par frame
    this.forceDeDeplacementMax = forceDeDeplacementMax;
    this.objectifDeSeparation = objectifDeSeparation;
    this.distanceDInfluence   = distanceDInfluence;

    this.capGlobal = createVector(-1, 0);           // cap moyen initial (vers la gauche)
    this.intensiteCap = 0.3 * this.forceDeDeplacementMax; // intensité de l'influence globale
    this.tNoise = random(1000);                     // base perlin par banc

    // Interactivité
    this.cible = null;               // p5.Vector ou null
    this.poidsCible = 2;             // > capGlobal pour dominer quand cible existe
    this.rayonArrivee = 30;
    this.proportionSeuil = 0.10;     // 10% du banc près de la cible -> on relâche
    this.framesSeuil = 20;           // nombre de frames consécutives requis
    this.compteurFramesOk = 0;

    // Grille de voisinage
    this.tailleCellule = max(this.objectifDeSeparation, this.distanceDInfluence);
    this.grille = new Grille(this.tailleCellule);

    // Création du banc
    this.poissons = [];
    const xInit = width  / 2 + random(-500, 500);
    const yInit = height / 2 + random(-500, 500);
   for (let i = 0; i < n; i++) {
  const p = new Poisson(
    xInit, yInit,
    this.imagePoisson,
    this.vitesseMax,
    this.forceDeDeplacementMax,
    this.capGlobal,
    this.objectifDeSeparation,
    this.distanceDInfluence
  );

  // 🔍 Vérifie que chaque poisson a bien reçu son image
  console.log('Poisson ctor → image width =', p.imagePoisson && p.imagePoisson.width);
  if (!p.imagePoisson) {
    console.warn('⚠️ Poisson sans image à l’index', i);
  }

  this.poissons.push(p);
}

  }

  // Mise à jour + affichage du banc
  run() {
    // Légère dérive globale (wander) autour du cap moyen
    this.tNoise += 0.01;
    const wander = p5.Vector.fromAngle(noise(this.tNoise) * TWO_PI); // norme 1
    const cap = this.capGlobal.copy().lerp(wander, 0.95);             // 95% wander
    cap.setMag(this.intensiteCap);

    // Gestion de la cible (interactivité)
    if (this.cible !== null) {
      let proches = 0;
      for (const f of this.poissons) {
        if (p5.Vector.dist(f.position, this.cible) < this.rayonArrivee) proches++;
      }
      const ratio = proches / this.poissons.length;

      if (ratio >= this.proportionSeuil) {
        this.compteurFramesOk++;
        if (this.compteurFramesOk >= this.framesSeuil) {
          this.cible = null;          // on lâche l'affaire
          // efface le rond côté sketch
          if (typeof cibleCliquee !== 'undefined') cibleCliquee = null;
          this.compteurFramesOk = 0;
        }
      } else {
        this.compteurFramesOk = 0;
      }
    }

    // Rebuild de la grille (O(N)) — une fois par frame
    this.grille.rebuild(this.poissons);

    // Boucle de mise à jour des poissons
    for (let i = 0; i < this.poissons.length; i++) {
      const f = this.poissons[i];

      // Force globale (cap)
      f.appliqueLaForce(cap);

      // Attraction vers la cible si présente
      if (this.cible !== null) {
        const versLaCible = f.pointeVers(this.cible);
        versLaCible.mult(this.poidsCible);
        f.appliqueLaForce(versLaCible);
      }

      // Mise à jour locale avec grille (séparation / alignement / cohésion)
      f.runAvecGrille(this.grille, this.poissons, i);
      // Ancienne version: f.run(this.poissons);
    }
  }

  definirCible(p) {
    this.cible = p.copy();
    this.compteurFramesOk = 0;
  }
}
