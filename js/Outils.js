// Outils.js — callbacks et fonctions utilitaires pour le banc de poissons

/**
 * Callback de voisinage (équivalent de l'interface VoisinEnCours en Java).
 * Appelée avec l'indice du poisson voisin.
 * @callback VoisinEnCours
 * @param {number} fishIdx
 */

// ================== Fonctions "carrées" ==================

/** Distance au carré entre deux p5.Vector (évite le sqrt). */
function distanceAuCarre(A, B) {
  const dx = A.x - B.x;
  const dy = A.y - B.y;
  return dx * dx + dy * dy;
}

/** Norme au carré d’un p5.Vector. */
function normeAuCarre(A) {
  return A.x * A.x + A.y * A.y;
}

// ================== Math utils optimisés ==================

/** Petite epsilon numérique. */
const EPS = 1e-9;

// Buffer partagé pour manipuler les bits float32/uint32 (fast inverse sqrt)
const __buf = new ArrayBuffer(4);
const __f32 = new Float32Array(__buf);
const __u32 = new Uint32Array(__buf);

/**
 * Inverse racine carrée rapide (style Quake).
 * Retourne ~ 1 / sqrt(x). Pour x <= 0, retourne 0.
 * NB: précision suffisante pour steering; 1 itération de Newton.
 */
function fastInvSqrt(x) {
  if (x <= 0) return 0;
  __f32[0] = x;
  __u32[0] = 0x5f3759df - (__u32[0] >> 1);
  let y = __f32[0];
  y = y * (1.5 - 0.5 * x * y * y);
  return y;
}

/**
 * Normalise (dx, dy) et met la magnitude à `target` sans sqrt direct.
 * Écrit le résultat dans `out` (p5.Vector) pour limiter les allocations.
 */
function normTo(dx, dy, target, out) {
  const m2 = dx * dx + dy * dy;
  if (m2 <= EPS) {
    out.set(0, 0);
    return;
  }
  const inv = fastInvSqrt(m2);
  out.set(dx * inv * target, dy * inv * target);
}

/**
 * Limite la norme d’un vecteur `v` à `maxMag` sans double sqrt.
 * Modifie `v` (p5.Vector) en place.
 */
function limitTo(v, maxMag) {
  const m2 = v.x * v.x + v.y * v.y;
  const max2 = maxMag * maxMag;
  if (m2 > max2 && m2 > EPS) {
    const inv = fastInvSqrt(m2);
    const scale = maxMag * inv;
    v.x *= scale;
    v.y *= scale;
  }
}
