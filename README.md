# GenP5-Official

For more information and details, please refer to section 2 of arxiv paper: [Exploring Bridges Between Creative Coding and Visual Generative AI](https://arxiv.org/abs/2406.05508).

## Usage 1: Stylize p5 contents with diffusion models

### Overview

GenP5 is a p5.js library enabling generative procedural art creation with flexibly stylizing canvas content with diffusion model.
Stylizing Canvas Contents.

In the p5 code, programmer can flexibly create stylize and nonstylize buffers containing independent art contents, and stylize them with diffusion models as they need with library functions:

```javascript
let genP5;
var storedframes = [];
let captureinterval = 5;
let finalframerate = 30;
//initiate more variables
//......

function setup() {
  genP5 = new GenP5(canvas_size, canvas_bgcolor);
  //initiate genP5 object with canvas size and background color

  [buffer1, buffer2] = genP5.createstylizebuffers(2);
  //create 2 buffers to draw stylized contents

  [buffer3] = genP5.createnonstylizebuffers(1);
  //create 1 buffer to draw not stylized contents

  genP5.setupfinalcanvas(finalframerate, storedframes);
  //create final canvas frame view + button to render final animation
}

function draw() {
  genP5.clearstylizebuffercontent(buffer1); //clear contents for next frame
  //draw contents in buffer1
  //......
  genP5.clearstylizebuffercontent(buffer2); //clear contents for next frame
  //draw contents in buffer2
  //......
  buffer3.clear(); //clear contents for next frame
  //draw contents in buffer3
  //......
  storedframes.push(buffer3.get()); // Store everyframe of buffer3 because it is not stylized buffer

  promptlist = ["prompt for buffer1", "prompt for buffer2"];
  strengthlist = [strength1, strength2];

  genP5.stylize_buffers(
    [buffer1, buffer2],
    promptlist,
    strengthlist,
    5,
    canvas
  );
  //stylize buffer1, buffer2
}
```

<img width="700" alt="Screen Shot 2024-06-19 at 6 36 52 PM" src="https://github.com/KolvacS-W/GenP5-Official/assets/55591358/bbf1b4e0-716f-4176-9bb2-acee1da82d0b">

### Tutorial

First open `backend_server` and install necesseary node.js dependencies.

Get API key from [fal.ai]() and replace it with `API_KEY` in `server.js`

Adjust `port` in `server.js` if necessary

Run `node server.js`, you should see:

```
key loaded
WebSocket Server: Running on port xxxx
```

Run the P5.js projects from `frontend_examples/Usage1` or [open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/mjmiecV_x).
create your own art content with GenP5 in `sketch.js`.

Recommended project structure:

(p5.js project folder)

-- genp5lib.js (library source code),

-- index.html,

-- sketch.js

Make sure to replace 3001 with your server port number in `genp5lib.js`

### Example

#### Example 1: Neural Network
[open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/daIDEdWos)

<img width="806" alt="Screenshot 2024-11-15 at 8 55 56 PM" src="https://github.com/user-attachments/assets/d402ce45-83a9-4d70-a83f-fb2903d2cc07">


#### Example 2: Graph Search
[open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/jEc9J7eKD)

<img width="730" alt="Screenshot 2024-11-15 at 8 55 44 PM" src="https://github.com/user-attachments/assets/9e97841f-4822-4be6-9b92-7d2d6f56fd22">

#### Example 3: Ecplise
[open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/NRWZadGM0)

<img width="820" alt="Screenshot 2024-11-15 at 8 56 04 PM" src="https://github.com/user-attachments/assets/b2dee470-c924-4a96-900c-e6ee2455e5c2">



### Method

We first introduce some concepts.

**background canvas** refer to the p5 canvas that is created by default in any p5.js project.

**Stylize buffer** is the new off-screen graphics created that allow contents drawn there to be separated from the background canvas. Specifically, the contents drawn on these buffers will be
stylized with DMs later.

**Nonstylize buffer** is also the new off-screen graphics created independently, but the contents
drawn on these buffers will not be stylized with DMs later.

Normally drawn p5.js contents will be shown as rendered p5 animations of all the frames. However, to turn them into processable entities for DMs, we need to capture frame
images at a certain capture rate.

**Original frame images** are those images captured from different stylize buffers, with
frame index as sequence numbers. They will be processed by DMs and result in **stylized frame images** as a one-to-one
correspondence.

Finally, all the original frame images from background canvas and all the stylized frame images in different stylize buffers who share the same frame index will be
overlayed sequentially to create a single **final frame image** at this frame index. Notice that a background-removal algorithm will be applied to all the stylize buffers before they are
overlayed. Moreover, For the p5 content animations in the nonstylize buffer, instead of turning the frames into frame
images, we directly store each frame as p5 objects since they do not need to be stylized. In the final step, for all the
final frame images and **stored frames** from nonstylize buffer, if they share the same frame index, they will be overlayed
sequentially, to create **final frame**s composing a final animation in a new **final canvas**.

The library will automatically render simple UIs for programmers to keep track of original and generated contents on each buffer, and the results combining them:

![structure_UI_new](https://github.com/user-attachments/assets/9e4706b7-a191-45fc-980a-ba79b63513ee)


## Usage2: Conditioning Canvas Contents by predefined patterns
### Overview
The second part of GenP5 is the functionalities to condition the art creation with
predetermined patterns (e.g., color, shape). These predetermined patterns are provided by external images (existing images or generated images from DM).

We provide functions to allow user use input colorful images as color sources and black-white images as contour sources to condition p5 contents:

Example:
```javascript
let particles = [];
maincanvassize = 400
let sampledColors = []

function setup() {
  genP5 = new GenP5(maincanvassize, '#FFFCFD');

// get contour and color from customized images 
genP5.get_NSampledColors('./colorimage.png', 0, 16).then((colors) => {
sampledColors = colors; // Store the sampled colors

genP5.load_ContourMap('./contourimage.png', setParticles);
}).catch((error) => {
  console.error("Failed to load or sample colors:", error);
  });
}
// draw some art with particles
function draw() {
    frameRate(20);
    clear()
    for (let p of particles) {
      p.move();
      p.update();
      p.display();
    }    

}
// initiate particles on contour
function setParticles() {
  particles = [];
  let sampledPoints = genP5.sample_ContourPoints(68000);
  for (let point of sampledPoints) {
    particles.push(new Particle(point.x, point.y));
  }
}


class Particle {
//code to define a particle
}
```

<img width="800" alt="Screen Shot 2024-06-20 at 12 20 27 AM" src="https://github.com/KolvacS-W/GenP5-Official/assets/55591358/1099c184-6bde-4188-87dc-13271ce87efa">

### Tutorial 

Directly run the example p5 projects from `frontend_examples/Usage2` or [open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/tYZ_1H5hL).
create your own art content with GenP5 in `sketch.js` and adding customized images as color/contour (black-white images) source in project folder.

Recommended project structure:

(p5.js project folder)

-- genp5lib.js (library source code),

-- index.html,

-- sketch.js

-- color or contour images

### Examples

#### Example 1: particle portrait
[open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/tYZ_1H5hL)

<img width="800" alt="Screen Shot 2024-06-20 at 12 28 36 AM" src="https://github.com/KolvacS-W/GenP5-Official/assets/55591358/d60c3315-237b-4f9d-b860-eb3917eab4ae">


#### Example 2: forming heart
[open on p5 web editor](https://editor.p5js.org/wujiaq/sketches/hTGhOuvRN)

<img width="800" alt="Screen Shot 2024-06-20 at 12 26 49 AM" src="https://github.com/KolvacS-W/GenP5-Official/assets/55591358/45f96392-490c-45a8-880c-69b578661f62">

## Citation

If you find it inspiring, please consider cite our source:

```
@misc{wu2024exploring,
      title={Exploring Bridges Between Creative Coding and Visual Generative AI},
      author={Jiaqi Wu},
      year={2024},
      eprint={2406.05508},
      archivePrefix={arXiv},
      primaryClass={id='cs.HC' full_name='Human-Computer Interaction' is_active=True alt_name=None in_archive='cs' is_general=False description='Covers human factors, user interfaces, and collaborative computing. Roughly includes material in ACM Subject Classes H.1.2 and all of H.5, except for H.5.1, which is more likely to have Multimedia as the primary subject area.'}
}
```
