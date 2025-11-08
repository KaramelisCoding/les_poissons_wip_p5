// Poisson.js — classe d’un poisson (p5.js)

class Poisson {
  /**
   * @param {number} x
   * @param {number} y
   * @param {p5.Image} imagePoisson
   * @param {number} vitesseMax
   * @param {number} forceDeplacementMax
   * @param {p5.Vector} capGlobal
   * @param {number} objectifDeSeparation
   * @param {number} distanceDInfluence
   */
  constructor(x, y, imagePoisson, vitesseMax, forceDeplacementMax, capGlobal, objectifDeSeparation, distanceDInfluence) {
    // Etat cinématique
    this.position = createVector(x, y);
    this.imagePoisson = imagePoisson;
    this.vitesseMax = vitesseMax;
    this.forceDeDeplacementMax = forceDeplacementMax;
    this.capGlobal = capGlobal.copy();
    this.objectifDeSeparation = objectifDeSeparation;
    this.distanceDInfluence = distanceDInfluence;

    // Vitesse initiale : autour du cap global
    const base = this.capGlobal.heading();
    const a = base + random(-PI / 6, PI / 6);
    this.vitesse = p5.Vector.fromAngle(a);
    this.vitesse.setMag(random(0.5, 1.0) * this.vitesseMax);

    this.acceleration = createVector(0, 0);
    this.tailleBocal = 100; // marge hors-canvas

    // Vecteurs temporaires (réutilisés pour limiter le GC)
    this.tmpVec = createVector(0, 0);
    this.deSeparation = createVector(0, 0);
    this.dAlignement = createVector(0, 0);
    this.deCohesion = createVector(0, 0);

    // --- Contexte + callbacks réutilisables pour SEPARATION ---
    this.poissonsSep = null;
    this.selfIdxSep = -1;
    this.limite2Sep = 0;
    this.capSepX = 0;
    this.capSepY = 0;
    this.voisinSep = (fishIdx) => {
      if (fishIdx === this.selfIdxSep) return;
      const voisin = this.poissonsSep[fishIdx];
      const dx = this.position.x - voisin.position.x;
      const dy = this.position.y - voisin.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < this.limite2Sep) {
        // éloignement pondéré 1/d (norme puis /d) -> ici via 1/d2 * dx,dy
        this.capSepX += dx / d2;
        this.capSepY += dy / d2;
      }
    };

    // --- ALIGNEMENT ---
    this.poissonsAli = null;
    this.selfIdxAli = -1;
    this.limite2Ali = 0;
    this.sumVx = 0;
    this.sumVy = 0;
    this.voisinAli = (fishIdx) => {
      if (fishIdx === this.selfIdxAli) return;
      const voisin = this.poissonsAli[fishIdx];
      const dx = this.position.x - voisin.position.x;
      const dy = this.position.y - voisin.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < this.limite2Ali) {
        this.sumVx += voisin.vitesse.x;
        this.sumVy += voisin.vitesse.y;
      }
    };

    // --- COHESION ---
    this.poissonsCoh = null;
    this.selfIdxCoh = -1;
    this.limite2Coh = 0;
    this.sumPx = 0;
    this.sumPy = 0;
    this.countCoh = 0;
    this.voisinCoh = (fishIdx) => {
      if (fishIdx === this.selfIdxCoh) return;
      const voisin = this.poissonsCoh[fishIdx];
      const dx = this.position.x - voisin.position.x;
      const dy = this.position.y - voisin.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < this.limite2Coh) {
        this.sumPx += voisin.position.x;
        this.sumPy += voisin.position.y;
        this.countCoh++;
      }
    };
  }

  // =============== Cycle ===============
  runAvecGrille(grille, poissons, selfIdx) {
    this.miseEnBancAvecGrille(grille, poissons, selfIdx);
    this.miseAJour();
    this.dansLeBocal();
    this.affichageDuPoisson();
  }

  appliqueLaForce(f) {
    this.acceleration.add(f);
  }

  // 1) appliquer les trois forces (séparation / alignement / cohésion)
  miseEnBancAvecGrille(grille, poissons, selfIdx) {
    this.deSeparation.set(this.separation(grille, poissons, selfIdx));
    this.dAlignement.set(this.alignement(grille, poissons, selfIdx));
    this.deCohesion.set(this.cohesion(grille, poissons, selfIdx));

    // Poids relatifs
    this.deSeparation.mult(1.5);
    this.dAlignement.mult(0.7);
    this.deCohesion.mult(1.0);

    // Application
    this.appliqueLaForce(this.deSeparation);
    this.appliqueLaForce(this.dAlignement);
    this.appliqueLaForce(this.deCohesion);
  }

  // 2) intégrer l’accélération
  miseAJour() {
    this.vitesse.add(this.acceleration);
    this.vitesse.limit(this.vitesseMax);
    this.position.add(this.vitesse);
    this.acceleration.mult(0);
  }

  // 3) bords du « bocal »
  dansLeBocal() {
    if (this.position.x < 0 - this.tailleBocal) this.position.x = width + this.tailleBocal;
    if (this.position.y < 0 - this.tailleBocal) this.position.y = height + this.tailleBocal;
    if (this.position.x > width + this.tailleBocal) this.position.x = 0 - this.tailleBocal;
    if (this.position.y > height + this.tailleBocal) this.position.y = 0 - this.tailleBocal;
  }

  // 4) affichage
  affichageDuPoisson() {
    push();
    translate(this.position.x + 40, this.position.y + 50);
    
     // Garde-fou : si l’image n’est pas prête, on dessine un petit rond
  if (this.imagePoisson && this.imagePoisson.width > 0) {
    image(this.imagePoisson, 0, 0);
  } else {
    noStroke();
    fill(0, 0, 100, 255); // blanc en HSB
    circle(0, 0, 6);
  }
    pop();
  }

  // =============== Forces locales ===============

  // --- SEPARATION ---
  separation(grille, poissons, selfIdx) {
    this.poissonsSep = poissons;
    this.selfIdxSep = selfIdx;
    this.limite2Sep = this.objectifDeSeparation * this.objectifDeSeparation;
    this.capSepX = 0;
    this.capSepY = 0;

    grille.chercheLesVoisins(this.position.x, this.position.y, this.voisinSep);

    const m2 = this.capSepX * this.capSepX + this.capSepY * this.capSepY;
    if (m2 > EPS) {
      // desired = normalize(cap) * vitesseMax
      const inv = fastInvSqrt(m2);
      const desiredX = this.capSepX * inv * this.vitesseMax;
      const desiredY = this.capSepY * inv * this.vitesseMax;

      this.tmpVec.set(desiredX - this.vitesse.x, desiredY - this.vitesse.y);
      limitTo(this.tmpVec, this.forceDeDeplacementMax);
      return this.tmpVec;
    }
    this.tmpVec.set(0, 0);
    return this.tmpVec;
  }

  // --- ALIGNEMENT ---
  alignement(grille, poissons, selfIdx) {
    this.poissonsAli = poissons;
    this.selfIdxAli = selfIdx;
    this.limite2Ali = this.distanceDInfluence * this.distanceDInfluence;
    this.sumVx = 0;
    this.sumVy = 0;

    grille.chercheLesVoisins(this.position.x, this.position.y, this.voisinAli);

    const m2 = this.sumVx * this.sumVx + this.sumVy * this.sumVy;
    if (m2 > EPS) {
      const inv = fastInvSqrt(m2);
      const desiredX = this.sumVx * inv * this.vitesseMax;
      const desiredY = this.sumVy * inv * this.vitesseMax;

      this.tmpVec.set(desiredX - this.vitesse.x, desiredY - this.vitesse.y);
      limitTo(this.tmpVec, this.forceDeDeplacementMax);
      return this.tmpVec;
    }
    this.tmpVec.set(0, 0);
    return this.tmpVec;
  }

  // --- COHESION ---
  cohesion(grille, poissons, selfIdx) {
    this.poissonsCoh = poissons;
    this.selfIdxCoh = selfIdx;
    this.limite2Coh = this.distanceDInfluence * this.distanceDInfluence;
    this.sumPx = 0;
    this.sumPy = 0;
    this.countCoh = 0;

    grille.chercheLesVoisins(this.position.x, this.position.y, this.voisinCoh);

    if (this.countCoh > 0) {
      const cx = this.sumPx / this.countCoh; // barycentre
      const cy = this.sumPy / this.countCoh;

      const dx = cx - this.position.x;
      const dy = cy - this.position.y;

      // desired = normalize(dx,dy) * vitesseMax
      normTo(dx, dy, this.vitesseMax, this.tmpVec);

      // steering = desired - velocity
      this.tmpVec.sub(this.vitesse);
      limitTo(this.tmpVec, this.forceDeDeplacementMax);
      return this.tmpVec;
    }
    this.tmpVec.set(0, 0);
    return this.tmpVec;
  }

  // =============== Steering annexe ===============
  /**
   * Construit une accélération vers une position cible.
   * @param {p5.Vector} cible
   * @returns {p5.Vector}
   */
  pointeVers(cible) {
    const versLaCible = p5.Vector.sub(cible, this.position);
    versLaCible.setMag(this.vitesseMax);
    const cap = p5.Vector.sub(versLaCible, this.vitesse);
    cap.limit(this.forceDeDeplacementMax);
    return cap;
  }
}
