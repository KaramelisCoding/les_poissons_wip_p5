// sketch.js — p5.js version du "BANC DE POISSONS SOURIANTS"

let lesPoissons;            // Banc
let poissonsSouriants;      // p5.Image

function preload() {
  // En p5.js, on charge les assets ici pour éviter les clignotements
  poissonsSouriants = loadImage('assets/POISSON.png',
    img => console.log('Image OK:', img.width, 'x', img.height),
    err => console.error('Image introuvable:', err)
  );
}

let cibleCliquee = null;    // p5.Vector ou null
let creme, rougeChaud, turquoise, marron; // p5.Color

function setup() {
  // Le "vrai" fullscreen web requiert un geste utilisateur.
  // On crée donc un canvas plein-fenêtre, et on gère le resize.
  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);
  noSmooth();
  noStroke();
  frameRate(40);
  imageMode(CENTER);
  colorMode(HSB, 360, 100, 100, 255);

  // Couleurs HSB équivalentes
  creme       = color(39,  50, 96, 255);  // #f5ca7a approx
  rougeChaud  = color(2,   52, 73, 255);  // #b95b58 approx
  turquoise   = color(182, 53, 74, 255);  // #58b9bc approx
  marron      = color(3,   41, 58, 255);  // #955b58 approx

  background(turquoise);
  cibleCliquee = null;

  // LE BANC DE POISSONS
  // Banc(int n, PImage imagePoisson, float vitesseMax, float forceMax, float objectifSep, float distInfluence)
  lesPoissons = new Banc(500, poissonsSouriants, 15, 0.9, 10, 10);
}

function draw() {
  background(turquoise);

  if (cibleCliquee !== null) {
    fill(rougeChaud);
    noStroke();
    circle(cibleCliquee.x, cibleCliquee.y, 130);
  }

  if (lesPoissons) lesPoissons.run();
}

function mousePressed() {
  cibleCliquee = createVector(mouseX, mouseY);
  if (lesPoissons) lesPoissons.definirCible(cibleCliquee);
}

// Garde le canvas plein-fenêtre si on redimensionne
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Option: toggle "vrai" fullscreen (API navigateur) avec la touche 'f'
function keyPressed() {
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}
