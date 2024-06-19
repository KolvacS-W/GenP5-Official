let particles = [];
maincanvassize = 400
let sampledColors = []
function setup() {
  genP5 = new GenP5(maincanvassize, '#000000');

genP5.get_NSampledColors('./vg3.png', 0, 16).then((colors) => {
sampledColors = colors; // Store the sampled colors

genP5.load_ContourMap('./contournew.png', setParticles);
}).catch((error) => {
console.error("Failed to load or sample colors:", error);
});
  
}


function draw() {
    
  frameRate(20);
  alpha = map(mouseX, 0, width, 5, 35);
  fill(0, alpha);
  rect(0, 0, width, height);
  for (let p of particles) {
    p.move();
    p.update();
    p.display();
  }    


}

function setParticles() {
  particles = [];
  for (let i = 0; i < 700; i++) {
    let x = random(width);
    let y = random(height);
    let adj = map(y, 0, height, 255, 0);
    let c = random(sampledColors);
    particles.push(new Particle(x, y, c));
  }
}


class Particle {
  constructor(x, y, c) {
    this.posX = x;
    this.posY = y;
    this.c = c;
    this.speed = 2; // Speed of the particle
    this.targetx = x
    this.targety = y
  }

  move() {
    let target = genP5.find_NearestContour(this.posX, this.posY, 50);

    if (target) {
      
      let direction = createVector(target.x - this.posX, target.y - this.posY);
      direction.setMag(2);
      this.posX += direction.x;
      this.posY += direction.y;
      this.targetx = target.x
      this.targety = target.y

    }
    // console.log('moved')
  }

  update() {
    if (this.posX < 0) this.posX = maincanvassize;
    if (this.posX > maincanvassize) this.posX = 0;
    if (this.posY < 0) this.posY = maincanvassize;
    if (this.posY > maincanvassize) this.posY = 0;
  }

  display() {
    if (this.posX >= 0 && this.posX <= maincanvassize && this.posY >= 0 && this.posY <= maincanvassize) {
      strokeWeight(random(2, 5)); // Increase the stroke weight so the points are more visible
      stroke(this.c);
      point(this.posX, this.posY);
    }

  }
}

