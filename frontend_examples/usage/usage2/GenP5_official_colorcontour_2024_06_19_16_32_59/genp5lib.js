class GenP5 {
    constructor(maincanvassize = 400, backgroundcolor = 'black', resize = 448) {
        this.maincanvassize = maincanvassize
        this.backgroundcolor = backgroundcolor
        this.buffers = [];
        this.resize = resize;
        this.imagedisplaytime = 1000;
        this.ws = null;
        this.finalQueue = [];
        this._contourArray = [];
        this.contourloaded = false;
        // Close the WebSocket connection when the window is unloaded or closed
        this.injectStyles(); // Inject CSS styles into the document
        window.addEventListener('beforeunload', () => {
            this.closeWebSocket();
        });
      
        this.connect();
        this.clearsavedimages();
        // Initialize slider event listener
      
        this.setupMainP5Container();

        this.setupCanvas(this.maincanvassize, this.backgroundcolor);

        // Setup the additional canvas container for dynamic content
        this.setupAdditionalCanvasContainer();

        // Setup the result gallery row for image slider and display
        this.setupResultGalleryRow();
        this.initSliderListener();

    }
      injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            .container {
                width: 400px;
                height: 400px;
                position: relative;
                border: 1px solid #ccc;
                margin-bottom: 20px;
                display: inline-block; /* Allow side-by-side display */
                margin-right: 10px; /* Add space between containers */
            }
            .overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(0, 0, 0, 0.5);
                color: #fff;
                text-align: center;
                padding: 5px; /* Ensure padding for readability */
                box-sizing: border-box; /* Ensures padding doesn't increase size of the overlay */
                z-index: 2; /* Ensure overlay is above other contents */
            }
            .row {
                margin-bottom: 20px; /* Add space between rows */
            }
            button {
                margin-bottom: 20px;
            }
            #image-display-container {
                width: 400px;
                height: auto; /* Automatically adjust the height based on the image aspect ratio */
            }
            #sequence-button {
                margin-left: 10px; /* Add some space between the canvas and the button */
            }
        `;
        document.head.appendChild(styleElement);
    }

    create_stylizebuffers(num_buffer, bg_color=this.backgroundcolor, size=this.maincanvassize){
        let bufferlist = [];
        let buffer;
        for (let i=0; i<num_buffer; i++){
            buffer = createGraphics(size, size);
            buffer.background(bg_color)
            bufferlist.push(buffer)
        }
        this.setupContainers(num_buffer);
        return bufferlist;

    }
  
      create_nonstylizebuffers(num_buffer, size=this.maincanvassize){
        let bufferlist = [];
        let buffer;
        for (let i=0; i<num_buffer; i++){
            buffer = createGraphics(size, size);
            bufferlist.push(buffer)
        }

        return bufferlist;

    }
  
    setupCanvas(size = this.maincanvassize, backgroundcolor = this.backgroundcolor) {
        // This function is called within the constructor to set up the p5.js canvas
        const canvas = createCanvas(size, size); // Create a p5.js canvas of 400x400 pixels
        canvas.background(backgroundcolor)
        canvas.parent('p5-container'); // Set the parent of the canvas to the HTML element with id 'p5-container'

        // Additional canvas setup code can go here if needed
    }
  
    setupMainP5Container() {
    const p5ContainerRow = document.createElement('div');
    p5ContainerRow.className = 'row';

    const p5Container = document.createElement('div');
    p5Container.id = 'p5-container';
    p5Container.className = 'container';
    p5ContainerRow.appendChild(p5Container);

    document.body.appendChild(p5ContainerRow);
  }

  setupAdditionalCanvasContainer() {
    const additionalCanvasContainerRow = document.createElement('div');
    additionalCanvasContainerRow.className = 'row';
    additionalCanvasContainerRow.id = 'additional-canvas-container';

    document.body.appendChild(additionalCanvasContainerRow);
  }

  setupResultGalleryRow() {
    const resultGalleryRow = document.createElement('div');
    resultGalleryRow.className = 'row';
    resultGalleryRow.id = 'result-gallery-row';

    const sliderContainer = document.createElement('div');
    sliderContainer.id = 'slider-container';
    resultGalleryRow.appendChild(sliderContainer);

    const label = document.createElement('label');
    label.setAttribute('for', 'image-slider');
    label.textContent = 'Image Slider';
    sliderContainer.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'image-slider';
    slider.min = '1';
    slider.max = '20';
    slider.value = '1';
    sliderContainer.appendChild(slider);

    const imageDisplayContainer = document.createElement('div');
    imageDisplayContainer.id = 'image-display-container';
    resultGalleryRow.appendChild(imageDisplayContainer);

    document.body.appendChild(resultGalleryRow);
  }
  
  
  setupContainers(num_buffer) {
    console.log('setupcontainer')
    // Select the 'additional-canvas-container' as the parent for dynamically added containers
    const parentContainer = document.getElementById('additional-canvas-container');
    if (!parentContainer) {
      console.error('Parent container for dynamic content not found.');
      return;
    }

    // Clear previous content
    parentContainer.innerHTML = '';

    // Create a row for block containers
    const blockRow = document.createElement('div');
    blockRow.className = 'row';
    parentContainer.appendChild(blockRow);

    // Create a row for processed containers
    const processedRow = document.createElement('div');
    processedRow.className = 'row';
    parentContainer.appendChild(processedRow);

    // Dynamically create block containers and append them to the block row
    for (let i = 0; i < num_buffer; i++) {
      const blockContainer = this.createContainer(`block-container-${i}`, 'Block Container');
      blockRow.appendChild(blockContainer);

      const processedContainer = this.createContainer(`processed-container-${i}`, 'Processed Container');
      processedRow.appendChild(processedContainer);
    }
    
      // Create a final container row if it does not exist
    if (!document.getElementById('final-container-0')) {
      const finalContainerRow = this.createContainer('final-container-0', 'Final Container');
      parentContainer.appendChild(finalContainerRow);
    }

  }

  createContainer(id, labelText) {
    const containerDiv = document.createElement('div');
    containerDiv.id = id;
    containerDiv.className = 'container';

    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'overlay';
    overlayDiv.textContent = labelText;
    containerDiv.appendChild(overlayDiv);

    return containerDiv;
  }

    connect() {
        this.ws = new WebSocket('ws://localhost:3001');
        this.ws.onopen = () => console.log("Connected to WebSocket server");
        this.ws.onmessage = (event) => this.handleServerMessage(event);
        this.ws.onclose = () => console.log("WebSocket connection closed");
        this.ws.onerror = (error) => console.error("WebSocket error:", error);
    }
  
      closeWebSocket() {
        console.log('close connection to server')
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
    }
  
    initSliderListener() {
        const slider = document.getElementById('image-slider');
        if (slider) {
            slider.addEventListener('input', () => this.displayImageBasedOnSlider());
        }
    }

    stylize_buffers(bufferlist, promptlist, strengthlist, captureinterval = 10, canvas){
        if (frameCount % captureinterval === 0){
            for (let i=0; i<bufferlist.length; i++){
                this.stylize(promptlist[i], strengthlist[i], bufferlist[i],canvas, i);
            }
        }

    }
  
    clear_stylizebuffercontent(buffer) {
      buffer.background(this.backgroundcolor)
      
    }

  
    stylize(prompt, strength, buffer, canvas, bufferIndex) {
        this.ensureBuffer(bufferIndex, buffer, prompt, strength);
        // console.log('stylize1')
        // console.log(this.buffers[0])

        // console.log('stylize')
        // console.log(this.buffers[0])

        const blockImage = this.buffers[bufferIndex].buffer.canvas.toDataURL('image/jpeg', 0.5);
        this.queueDisplayImage(blockImage, 'block', this.buffers[bufferIndex].blockImageCounter, bufferIndex);

        const outBlockImage = canvas.toDataURL('image/jpeg', 0.5);
        this.queueDisplayImage(outBlockImage, 'screenshot', this.buffers[bufferIndex].screenshotImageCounter, bufferIndex);
        
        this.buffers[bufferIndex].fullscreenshotQueue.push(outBlockImage);
        
    }
  
      ensureBuffer(bufferIndex, buffer,prompt, strength) {
        if (!this.buffers[bufferIndex]) {
            this.buffers[bufferIndex] = {
            buffer:buffer,
            screenshotImageCounter:  0,
            blockImageCounter : 0,
            processedImageCounter : 0,
            finalImageCounter:  0,
            Strengthlist : [strength],
            Promptlist:  [prompt],

            screenshotQueue:  [],
            fullscreenshotQueue:  [],
            blockQueue:  [],
            processedQueue:  [],
            finalQueue:  [],
            fullprocessedQueue: [],

            displayingScreenshot:  false,
            displayingBlock : false,
            displayingProcessed : false,
            displayingFinal : false,
            };
        }
    }

    getBlockImage(buffer) {
        buffer.loadPixels();
        return buffer.canvas.toDataURL('image/jpeg', 0.5);
    }

    getOutBlockImage(canvas) {
        return canvas.toDataURL('image/jpeg', 0.5);
    }

    handleServerMessage(event) {
            const data = JSON.parse(event.data);
            console.log('server data:')
            // console.log(data.result)
            if (data && data.result.images && data.result.images.length > 0) {
                const processedImageUrl = data.result.images[0].url;
                const bufferIndex = parseInt(data.result.request_id.split('_')[0]);
                this.queueDisplayImage(processedImageUrl, 'processed', data.count, bufferIndex);

                this.buffers[bufferIndex].fullprocessedQueue.push(processedImageUrl);

                this.createAndDisplayFinalImage(processedImageUrl, data.count, bufferIndex);
            }
        
    }

    sendImageToServer(imageUrl, count, bufferIndex) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                image_url: imageUrl,
                strength: this.buffers[bufferIndex].Strengthlist[0],
                prompt: this.buffers[bufferIndex].Promptlist[0],
                count: count,
                request_id:bufferIndex.toString()+'_'+count.toString()
            }));
        }
    }

    queueDisplayImage(imageSrc, type, count, bufferIndex) {
        const bufferData = this.buffers[bufferIndex];
        const queue = bufferData[`${type}Queue`];
        queue.push({ imageSrc, count });
        this.processDisplayQueue(type, bufferIndex);
    }

    processDisplayQueue(type, bufferIndex) {
        const bufferData = this.buffers[bufferIndex];
        const queue = bufferData[`${type}Queue`];
        const currentlyDisplayingFlag = `displaying${type.charAt(0).toUpperCase() + type.slice(1)}`;

        if (queue.length > 0 && !this.buffers[bufferIndex][currentlyDisplayingFlag]) {
            this.buffers[bufferIndex][currentlyDisplayingFlag] = true;
            const { imageSrc, count } = queue.shift();
            this.compressAndDisplayImage(imageSrc, type, count, bufferIndex);
        }
    }


    compressAndDisplayImage(imageSrc, type, count, bufferIndex) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.resize;
            canvas.height = this.resize;
            ctx.drawImage(img, 0, 0, this.resize, this.resize);

            const dataUrl = canvas.toDataURL('image/jpeg');
            this.displayImage(dataUrl, type, count, bufferIndex);
        };
        img.onerror = (error) => console.error('Error loading image:', error);
        img.src = imageSrc;
    }

  displayImage(imageUrl, type, count, bufferIndex) {
    // Check if the container exists before trying to use it
    const container = document.getElementById(`${type}-container-${bufferIndex}`);
    if (!container) {
      console.warn(`Container for ${type}-container-${bufferIndex} not found. Skipping display.`);
      return; // Skip the rest of the function if the container doesn't exist
    }

    let img = container.querySelector('img');
    let overlay = container.querySelector('.overlay');

    if (!img) {
      img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = 'auto';
      container.appendChild(img);
    }
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'overlay';
      container.appendChild(overlay);
    }

    img.onload = () => {
      const bufferData = this.buffers[bufferIndex];
      // Set a timeout to ensure the image is displayed for at least 3 seconds
      setTimeout(() => {
        bufferData[`displaying${type.charAt(0).toUpperCase() + type.slice(1)}`] = false;

        this.processDisplayQueue(type, bufferIndex);
        if (type == 'block') {
          this.buffers[bufferIndex][`${type}ImageCounter`] += 1;
          this.sendImageToServer(imageUrl, this.buffers[bufferIndex].blockImageCounter, bufferIndex);
          count = this.buffers[bufferIndex][`${type}ImageCounter`];
          overlay.innerHTML = `Frame: ${count} | Strength: ${this.buffers[bufferIndex].Strengthlist[0].toFixed(2)} | Prompt: ${this.buffers[bufferIndex].Promptlist[0]}`;
        } else if (type == 'screenshot') {
          this.buffers[bufferIndex][`${type}ImageCounter`] += 1;
          count = this.buffers[bufferIndex][`${type}ImageCounter`];
          overlay.innerHTML = `Frame: ${count} | Strength: ${this.buffers[bufferIndex].Strengthlist[0].toFixed(2)} | Prompt: ${this.buffers[bufferIndex].Promptlist[0]}`;
        }
        else if (type == 'final'){
        overlay.innerHTML = `Frame: ${count}`;          
        }
        
        else if(type == 'processed'){
          overlay.innerHTML = `Frame: ${count} | Strength: ${this.buffers[bufferIndex].Strengthlist[0].toFixed(2)} | Prompt: ${this.buffers[bufferIndex].Promptlist[0]}`;
        }


      }, this.imagedisplaytime); // Change 3000 to your desired minimum display time in milliseconds
    };

    img.onerror = (error) => console.error('Error loading image:', error);
    img.src = imageUrl;
  }

    createAndDisplayFinalImage(processedUrl, count, bufferIndex) {
        // Check if all processedQueue in this.buffers have the image with bufferIndex
        // console.log('---')
        for (const buffer of this.buffers) {
            // console.log('iterate:', buffer.fullprocessedQueue.length)
            if (!buffer.fullprocessedQueue[bufferIndex]) {
                // If any processedQueue doesn't have an image at bufferIndex, return directly
                console.log('Not all buffers contain an image at the specified bufferIndex');
                // console.log('img:', bufferIndex, count)
                return;
            }
        }
    
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        const screenshotImg = new Image();
    
        screenshotImg.crossOrigin = "anonymous";
    
        screenshotImg.onload = () => {
            finalCanvas.width = this.resize;
            finalCanvas.height = this.resize;
            ctx.drawImage(screenshotImg, 0, 0, this.resize, this.resize);
    
            // Function to process and overlay each processed image
            const overlayProcessedImages = (index) => {
                if (index >= this.buffers.length) {
                    const finalImageUrl = finalCanvas.toDataURL('image/jpeg');

                    //always put the finalimages in the queue of the first buffer, because we need to fix the list
                    this.queueDisplayImage(finalImageUrl, 'final', count, bufferIndex=0);
                    this.saveProcessedImage(finalImageUrl, count);
                    this.finalQueue.push(finalImageUrl)
                    return;
                }
    
                const processedImg = new Image();
                processedImg.crossOrigin = "anonymous";
                processedImg.onload = () => {
                    const processedCanvas = document.createElement('canvas');
                    const processedCtx = processedCanvas.getContext('2d');
                    processedCanvas.width = this.resize;
                    processedCanvas.height = this.resize;
    
                    processedCtx.drawImage(processedImg, 0, 0, this.resize, this.resize);
                    const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
                    const backgroundColor = this.findMostFrequentColor(imageData);
    
                    const colorThreshold = 30; // Adjust as needed
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        let r = imageData.data[i];
                        let g = imageData.data[i + 1];
                        let b = imageData.data[i + 2];
                        let distance = Math.sqrt((r - backgroundColor.r) ** 2 + (g - backgroundColor.g) ** 2 + (b - backgroundColor.b) ** 2);
    
                        if (distance <= colorThreshold) {
                            imageData.data[i + 3] = 0; // Make this pixel transparent
                        }
                    }
    
                    processedCtx.putImageData(imageData, 0, 0);
                    ctx.drawImage(processedCanvas, 0, 0, this.resize, this.resize);
                    overlayProcessedImages(index + 1); // Proceed to next image
                };
                processedImg.onerror = () => {
                    console.log(`Error loading processed image from buffer ${index}`);
                    console.log(count)
                    console.log(this.buffers[index].fullprocessedQueue.length)
                };
                processedImg.src = this.buffers[index].fullprocessedQueue[count-1];
            };
    
            // Start overlaying processed images
            overlayProcessedImages(0);
        };
    
        screenshotImg.onerror = () => {
            console.error('Error loading screenshot image');
            this.displayingFinal = false;
            this.processDisplayQueue('final');
        };
    
        screenshotImg.src = this.buffers[bufferIndex].fullscreenshotQueue[count-1];
    }
  
setup_finalcanvas(frameRateVal, storedFrames, maincanvassize = this.maincanvassize) {
  console.log('Final canvas initiated');
  let imageUrlList = this.finalQueue;
  let containerId = 'additional-canvas-container';
  let imgIndex = 0; // Current image index
  let sequenceRunning = false; // Flag to indicate if the sequence is currently running

  let s = (sketch) => {
    sketch.setup = function () {
      let c = sketch.createCanvas(maincanvassize, maincanvassize);
      c.parent(containerId);
      sketch.frameRate(frameRateVal);

      let button = sketch.createButton('Start Sequence');
      button.parent(containerId); // Set the parent container for the button
      button.mousePressed(() => {
        console.log('Sequence started');
        imgIndex = 0;
        sequenceRunning = true;
        sketch.loop();
      });

      sketch.noLoop();
    };

    sketch.draw = function () {
      if (sequenceRunning && imgIndex < imageUrlList.length) {
        sketch.loadImage(imageUrlList[imgIndex], (img) => {
          sketch.background(img); // Draw the current background image
          // Overlay the corresponding stored frame if available, otherwise just show the background image
          if (imgIndex < storedFrames.length) {
            sketch.image(storedFrames[imgIndex], 0, 0);
          }
          imgIndex++;

          // Once all images from imageUrlList have been displayed, reset to loop the sequence
          if (imgIndex >= imageUrlList.length) {
            imgIndex = 0;
            sequenceRunning = false; // Optional: set to true to loop indefinitely
            sketch.noLoop(); // Stop the loop if the sequence ends and not looping indefinitely
          }
        });
      }
    };
  };

  new p5(s);
}



  
    findMostFrequentColor(imageData) {
        let colorCount = {};
        let maxCount = 0;
        let dominantColor = { r: 0, g: 0, b: 0 };

        for (let i = 0; i < imageData.data.length; i += 4) {
            let r = imageData.data[i];
            let g = imageData.data[i + 1];
            let b = imageData.data[i + 2];
            let rgbString = `${r},${g},${b}`;

            colorCount[rgbString] = (colorCount[rgbString] || 0) + 1;

            if (colorCount[rgbString] > maxCount) {
                maxCount = colorCount[rgbString];
                dominantColor = { r, g, b };
            }
        }

        return dominantColor;
    }
  
    saveProcessedImage(imageUrl, count) {
      fetch('http://localhost:3001/save-image', {  // Use the correct server URL
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, count: count })
      }).then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
  }
  
  clearsavedimages() {
    // Call to clear the images on the server
    fetch('http://localhost:3001/clear-images')
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
  }
  
  displayImageBasedOnSlider() {
    const slider = document.getElementById('image-slider');
    const imageDisplayContainer = document.getElementById('image-display-container');

    fetch('http://localhost:3001/get-smallest-image-number')
        .then(response => response.json())
        .then(data => {
            const smallestImageNumber = data.minNumber;
            const adjustedImageIndex = parseInt(slider.value) + smallestImageNumber;

            const imageUrl = `http://localhost:3001/saved_images/image_${adjustedImageIndex}.jpg`;
            imageDisplayContainer.innerHTML = `<img src="${imageUrl}" alt="Saved Image" style="width: 100%; height: auto;">`;
        })
        .catch(error => {
            console.error('Error:', error);
            imageDisplayContainer.innerHTML = `<p>Error loading image.</p>`;
        });
  }
    // Functions for Usage2:
      get_NSampledColors(imgPath, threshold, N) {
      return new Promise((resolve, reject) => {
        loadImage(imgPath, (img) => {
          // img = img.resize(100, 100);
          // console.log('resized')
          let colors = [];
          for (let i = 0; i < N; i++) {
            colors.push(this.sampleColorFromImage(img, threshold));
          }
          resolve(colors); // Resolve the promise with the colors
        }, (error) => {
          reject(error); // Reject the promise if there's an error loading the image
        });
      });
    }

    sampleColorFromImage(img, threshold = 0.01) {
      let sampledColor;
      let pixelCount = 0;

      img.loadPixels();
      let totalPixels = img.width * img.height;

      // while (pixelCount / totalPixels < threshold) {
      //   pixelCount = 0;
        let x = floor(random(img.width));
        let y = floor(random(img.height));
        let index = (x + y * img.width) * 4;

        sampledColor = [
          img.pixels[index],
          img.pixels[index + 1],
          img.pixels[index + 2],
          img.pixels[index + 3]
        ];

        // for (let i = 0; i < img.pixels.length; i += 4) {
        //   if (this.areColorsSimilar(sampledColor, [
        //     img.pixels[i],
        //     img.pixels[i + 1],
        //     img.pixels[i + 2],
        //     img.pixels[i + 3]
        //   ])) {
        //     pixelCount++;
        //   }
        // }
      // }
      return color(sampledColor[0], sampledColor[1], sampledColor[2], sampledColor[3]);
    };

    areColorsSimilar (c1, c2, tolerance = 5) {
      for (let i = 0; i < 4; i++) {
        if (abs(c1[i] - c2[i]) > tolerance) {
          return false;
        }
      }
      return true;
    };

  load_ContourMap(imageURL, callback) {
    loadImage(imageURL, img => {
      img.resize(this.maincanvassize, this.maincanvassize);
      // image(img, 0, 0); // Uncomment if you wish to display the image
      this.generate_ContourMap(img);
      if (typeof callback === "function") {
        callback(); // Call the callback function once everything is done
      }
    });
  }


  generate_ContourMap(img) {
    return new Promise((resolve, reject) => {
      img.loadPixels();
      let contourArray = [];

      for (let x = 0; x < img.width; x++) {
        this._contourArray[x] = [];
        for (let y = 0; y < img.height; y++) {
          let index = (x + y * img.width) * 4;
          let r = img.pixels[index];
          let g = img.pixels[index + 1];
          let b = img.pixels[index + 2];

          let isContour = (r + g + b) / 3 > 128;
          this._contourArray[x][y] = isContour;
        }
      }

      this.contourloaded = true;
      resolve(); // Resolve the promise once the contour map is generated
    });
  }



  find_NearestContour(x, y, searchRange = this.maincanvassize, offset = 0) {
    if(this.contourloaded){
      let closestDist = searchRange * sqrt(2); // Initialize with maximum possible distance
      let closestPoint = createVector(x, y); // Start with the input position as the closest point

      // Iterate over a square area defined by the search range
      for (let i = -searchRange; i <= searchRange; i++) {
        for (let j = -searchRange; j <= searchRange; j++) {
          let newX = Math.round(x) + i; // Calculate the new X coordinate
          let newY = Math.round(y) + j; // Calculate the new Y coordinate

          // Check if the new coordinates are within canvas bounds
          if (newX >= 0 && newX < this.maincanvassize && newY >= 0 && newY < this.maincanvassize) {
            // Check if the position is part of the contour and the pixel is white
            if (this._contourArray[newX][newY]) {
              let d = dist(x, y, newX, newY); // Calculate the distance to the new point
              // If the distance is shorter than the current closest distance, update the closest point
              if (d < closestDist) {
                closestDist = d;
                closestPoint.set(newX, newY);
              }
            }
          }
        }
      }

      return closestPoint; 
    } else {
      console.error("Contour not loaded.");
      return createVector(x, y); // Return the input position if contour is not loaded
    }
  }



  sample_ContourPoints(N) {
    let sampledPoints = [];
    let attempts = 0;
    while (sampledPoints.length < N && attempts < 10000) {
      let x = floor(random(this.maincanvassize));
      let y = floor(random(this.maincanvassize));
      if (this._contourArray[x][y]) {
        sampledPoints.push(createVector(x, y));
      }
      attempts++;
    }
    return sampledPoints;
  }

  check_IfOnContour(x, y) {
    x = floor(x);
    y = floor(y);
    if (x >= 0 && x < this.maincanvassize && y >= 0 && y < this.maincanvassize) {
      return this._contourArray[x][y];
    }
    return false;
  }

}
