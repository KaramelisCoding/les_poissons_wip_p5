// Grille.js — spatial hash grid (p5.js / JavaScript)

class Grille {
  /**
   * @param {number} tailleDeLaCellule
   */
  constructor(tailleDeLaCellule) {
    this.tailleDeLaCellule = tailleDeLaCellule;

    // cellule: Map<Number, {debut:number, nombreDePoissons:number}>
    this.cellule = new Map();

    // indiceDuPoisson: int[] (tableau d'indices de poissons rangés par cellule)
    this.indiceDuPoisson = [];

    // Stats (HUD / debug)
    this.neighborChecksThisFrame = 0;
    this.cellsUsedThisFrame = 0;
  }

  // Clé de hash pour une position (x,y) -> cellule
  clefHashDeCellulePour(x, y) {
    const cx = Math.floor(x / this.tailleDeLaCellule);
    const cy = Math.floor(y / this.tailleDeLaCellule);
    // mêmes nombres premiers + XOR que la version Processing
    return (cx * 73856093) ^ (cy * 19349663);
  }

  /**
   * Rebuild complet une fois par frame — O(N)
   * @param {Poisson[]} poissons
   */
  rebuild(poissons) {
    this.cellule.clear();
    this.neighborChecksThisFrame = 0;

    // 1) Compter le nombre de poissons par cellule k
    for (let i = 0; i < poissons.length; i++) {
      const f = poissons[i];
      const k = this.clefHashDeCellulePour(f.position.x, f.position.y);
      let c = this.cellule.get(k);
      if (!c) {
        c = { debut: 0, nombreDePoissons: 0 };
        this.cellule.set(k, c);
      }
      c.nombreDePoissons++;
    }

    // 2) Attribuer "debut" à chaque cellule (ordre arbitraire, rapide)
    let running = 0;
    for (const c of this.cellule.values()) {
      c.debut = running;
      running += c.nombreDePoissons;
    }
    this.cellsUsedThisFrame = this.cellule.size;

    // 3) Remplir le tableau "indiceDuPoisson" (taille = total poissons)
    this.indiceDuPoisson = new Array(running);
    const placement = new Map(); // Map<k, rangLocal>

    for (const k of this.cellule.keys()) placement.set(k, 0);

    for (let i = 0; i < poissons.length; i++) {
      const f = poissons[i];
      const k = this.clefHashDeCellulePour(f.position.x, f.position.y);
      const c = this.cellule.get(k);
      const indiceLocal = placement.get(k) || 0;

      // ranger l'indice global i à la bonne place pour la cellule k
      this.indiceDuPoisson[c.debut + indiceLocal] = i;
      placement.set(k, indiceLocal + 1);
    }
  }

  /**
   * Itère tous les poissons des 9 cellules autour de (x,y)
   * @param {number} x
   * @param {number} y
   * @param {(fishIdx:number)=>void} callback // ex: poisson.voisinSep / voisinAli / voisinCoh
   */
  chercheLesVoisins(x, y, callback) {
    const cx = Math.floor(x / this.tailleDeLaCellule);
    const cy = Math.floor(y / this.tailleDeLaCellule);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const k = ((cx + dx) * 73856093) ^ ((cy + dy) * 19349663);
        const c = this.cellule.get(k);
        if (!c) continue;

        const end = c.debut + c.nombreDePoissons;
        for (let j = c.debut; j < end; j++) {
          this.neighborChecksThisFrame++;
          const fishIdx = this.indiceDuPoisson[j];
          callback(fishIdx);
        }
      }
    }
  }
}
