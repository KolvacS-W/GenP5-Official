//parameters for art content
let circleX = 50;
let circleY = 200;
let circleSpeedX = 2;
let rectX = 200;
let rectY = 100;
let rectSpeedY = 1;
var ranges;
let seed = Math.random() * 12;
let horizonY; // The adjustable horizontal line
let maincanvassize = 400
let centerX, centerY; // Center of the canvas and the circular ring
let baseRadius = 120; // Base radius of the innermost circle
let waveLayers = 10; // Number of wave layers to add depth
let layerDepth = 5; // Depth between each wave layer for a subtle effect

//parameters to use library
let genP5;
let buffer1, buffer2, buffer3;
let storedframes = [];

let drops = [];

function setup() {

    //don't change
    genP5 = new GenP5(maincanvassize, '#000000');
    //don't change
    horizonY = maincanvassize / 2; // Set the initial horizontal line position

      //create buffers
    [buffer1, buffer2] = genP5.create_stylizebuffers(2);

    [buffer3] = genP5.create_nonstylizebuffers(1);
  
  
    genP5.setup_finalcanvas(30, storedframes)
  
  
}

let a = 2;
let boatX = 0;

function draw() {
        clear()
        fill('white');      

///////////draw things on buffer1
        genP5.clear_stylizebuffercontent(buffer1)
        let ringDiameter = 100; // Diameter of the ring
        let ringColor = 'rgb(231,231,248)'; // Pink color for the ring
        let thornColor = 'rgb(188,188,230)'; // Deep dark pink color for the thorns

        // Calculate the center position of the canvas
        let centerX = width / 2;
        let centerY = height / 2;

        // Draw the ring
        buffer1.fill(ringColor);
        buffer1.stroke(ringColor);
        // buffer1.ellipse(centerX, centerY, ringDiameter, ringDiameter);

        // Draw the thorns
        let numThorns = 100; // Number of thorns
        let thornLength = ringDiameter / 4; // Length of the thorns
        let thornDensity = 10; // Density of jagged lines inside the thorns

        for (let i = 0; i < numThorns; i++) {
          let angle = random(TWO_PI); // Random angle for each thorn
          let x = centerX + cos(angle) * (ringDiameter / 2); // X position of the thorn
          let y = centerY + sin(angle) * (ringDiameter / 2); // Y position of the thorn

          let thornDirection = random(-1, 1); // Random direction of the thorn

          buffer1.strokeWeight(2);
          buffer1.stroke(thornColor);

          for (let j = 0; j < thornDensity; j++) {
            let thornX = x + random(-thornLength, thornLength) * thornDirection;
            let thornY = y + random(-thornLength, thornLength) * thornDirection;

            buffer1.line(x, y, thornX, thornY);
          }
        }
  
///////////draw things on buffer2        
        genP5.clear_stylizebuffercontent(buffer2)
        buffer2.noFill();
          // Draw layered circular waves with gradient colors and enhanced            Perlin noise for dynamic borders
        for (let i = 0; i < waveLayers; i++) {
          // Adjust stroke color for each layer to create a gradient                   effect
          let inter = map(i, 0, waveLayers, 0, 1);
          let c = lerpColor(color(255), color(65, 105, 225, 150), inter);           // Transition from white to translucent blue
          buffer2.stroke(c);
          buffer2.strokeWeight(5); 

          buffer2.beginShape();
          for (let angle = 0; angle <= TWO_PI; angle += 0.01) {
            // Layering Perlin noise for more complex wave patterns
            let xoff = map(cos(angle), -1, 1, 0, waveLayers) + i * 0.1; 
            let yoff = map(sin(angle), -1, 1, 0, waveLayers) + i * 0.1; 
            let radiusOffset = map(noise(xoff, yoff, frameCount * 0.01), 0, 1, -40, 40); // Map noise value to radius offset
            let totalRadius = baseRadius + i * layerDepth + radiusOffset; 
            // Calculate the position of the wave point
            let x = centerX + totalRadius * cos(angle);
            let y = centerY + totalRadius * sin(angle);

            buffer2.vertex(x, y);
          }
          buffer2.endShape(CLOSE);
        }

///////////draw things on buffer3
      buffer3.clear()
      // Loop to create multiple bubbles
      for (let i = 0; i < 50; i++) {
        let x = random(width);
        let y = random(height);
        let r = random(10, 50); // Random bubble size

        buffer3.noStroke()
        // Bubble color (semi-transparent white)
        buffer3.fill(255, 255, 255, 80);

        // Apply blur effect
        buffer3.drawingContext.filter = 'blur(8px)';

        // Draw the bubble
        buffer3.ellipse(x, y, r);

        // Reset the blur effect for subsequent drawings
        buffer3.drawingContext.filter = 'none';
      }
  
        //store nonstylize buffer : buffer3
        storedframes.push(buffer3.get()); 
        
//////////stylize buffer1, buffer2
        promptlist =['an abstract total solar eclipse', 'abstract galaxy pattern']
  
        strengthlist = [0.6, 0.6]

        genP5.stylize_buffers([buffer1, buffer2], promptlist, strengthlist, 5, canvas);

}



