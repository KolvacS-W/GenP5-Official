let particles = [];
maincanvassize = 400
let sampledColors = []
function setup() {
  genP5 = new GenP5(maincanvassize, '#FFFCFD');

  // Load contour array from an image (ensure the image path is correct and accessible)
  
genP5.get_NSampledColors('./mts4.png', 0, 16).then((colors) => {
sampledColors = colors; // Store the sampled colors

genP5.load_ContourMap('./mll2.png', setParticles);
}).catch((error) => {
console.error("Failed to load or sample colors:", error);
});
  
}


function draw() {
    
    frameRate(20);
    clear()
    for (let p of particles) {
      p.move();
      p.update();
      p.display();
    }    


}

function setParticles() {
  particles = [];
  let sampledPoints = genP5.sample_ContourPoints(680); // Adjust the number of points as needed
  for (let point of sampledPoints) {
    particles.push(new Particle(point.x, point.y));
  }
}

function AddParticles() {
  let sampledPoints = genP5.sample_ContourPoints(680); // Adjust the number of points as needed
  for (let point of sampledPoints) {
    particles.push(new Particle(point.x, point.y));
  }
}


function mousePressed() {
  AddParticles();
}

class Particle {
  constructor(x, y) {
    this.posX = x;
    this.posY = y;

    // Random base size for each particle
    this.size = random(1, 8);

    // Random speed factors
    this.xSpeedFactor = random(-5, 5);
    this.ySpeedFactor = random(-5, 5);

    // Select a random color from a predefined set and add random alpha for transparency
    const colorSet = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#FF69B4'];
    this.color = random(sampledColors);
    this.alpha = random(10, 90);  // Adjusted for better visibility of the blur effect
    this.c = color(this.color);
    this.c.setAlpha(this.alpha);
  }

  move() {
    this.posX += random(-this.xSpeedFactor, this.xSpeedFactor);
    this.posY += random(-this.ySpeedFactor, this.ySpeedFactor);

    // Check if the new position is on the contour; if not, re-generate the position
    let onContour = genP5.check_IfOnContour(this.posX, this.posY);
    while (!onContour) {
      this.posX = random(width);
      this.posY = random(height);
      onContour = genP5.check_IfOnContour(this.posX, this.posY);
    }
  }

  update() {
    // Wrap around logic
    if (this.posX < 0) this.posX = maincanvassize;
    if (this.posX > maincanvassize) this.posX = 0;
    if (this.posY < 0) this.posY = maincanvassize;
    if (this.posY > maincanvassize) this.posY = 0;
  }

  display() {
    // Set the stroke weight to the particle's size for the blurriness effect
    strokeWeight(this.size);

    // Use the particle's color including its alpha for transparency
    stroke(this.c);

    // Draw the particle
    point(this.posX, this.posY);
  }
}

