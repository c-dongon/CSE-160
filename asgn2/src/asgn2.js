let canvas = document.getElementById("webgl");
let gl = canvas.getContext("webgl", { depth: true });
let g_time = 0;
let g_animation = false;
let g_abdomenTilt = 0;
let g_headTilt = 0;
let g_yaw = 0;
let g_pitch = 0; 
let g_roll = 0; 
let g_secondsElapsed = 0;
let g_lastTimestamp = performance.now();
let g_pokeAnimation = false;
let g_pokeProgress = 0;
let g_pokeScale = 1.0; 
let g_pokePitchOffset = 0; 
let g_showHat = false;
let g_frameCount = 0;
let g_fps = 0;
let g_lastFpsUpdate = performance.now();

function drawCylinder(matrix, color, segments = 32, height = 1, radius = 0.5) {
  let vertices = [];
  let indices = [];

  vertices.push(0, height / 2, 0);
  vertices.push(0, -height / 2, 0);

  for (let i = 0; i <= segments; i++) {
    let angle = (i / segments) * 2 * Math.PI;
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    vertices.push(x, height / 2, z);
    vertices.push(x, -height / 2, z); 
  }

  for (let i = 0; i < segments; i++) {
    indices.push(0, 2 + i * 2, 2 + ((i + 1) % segments) * 2);
  }

  for (let i = 0; i < segments; i++) {
    indices.push(1, 3 + ((i + 1) % segments) * 2, 3 + i * 2);
  }

  for (let i = 0; i < segments; i++) {
    let top1 = 2 + i * 2;
    let top2 = 2 + ((i + 1) % segments) * 2;
    let bot1 = top1 + 1;
    let bot2 = top2 + 1;
    indices.push(top1, bot1, top2);
    indices.push(top2, bot1, bot2);
  }

  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!vertexBuffer || !indexBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4f(u_FragColor, ...color);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

gl.enable(gl.DEPTH_TEST);

let VSHADER_SOURCE = document.getElementById("vertex-shader").text;
let FSHADER_SOURCE = document.getElementById("fragment-shader").text;

if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  console.error("Shader initialization failed.");
}

let cubeVertexBuffer = gl.createBuffer();
let cubeIndexBuffer = gl.createBuffer();

const cubeVertices = new Float32Array([
  // front
  -0.5, -0.5, 0.5,
   0.5, -0.5, 0.5,
   0.5,  0.5, 0.5,
  -0.5,  0.5, 0.5,
  // back
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,
]);

const cubeIndices = new Uint8Array([
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  0, 1, 5, 0, 5, 4,
  2, 3, 7, 2, 7, 6,
  0, 3, 7, 0, 7, 4,
  1, 2, 6, 1, 6, 5,
]);

gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);


let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
let u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

let g_upperLegAngles = [0, 0, 0, 0];
let g_lowerLegAngles = [0, 0, 0, 0];
let g_upperLegAnglesR = [0, 0, 0, 0];
let g_lowerLegAnglesR = [0, 0, 0, 0];
let g_footLegAngles = [0, 0, 0, 0];
let g_footLegAnglesR = [0, 0, 0, 0];

document.getElementById('hatCheckbox').addEventListener('change', (e) => {
  g_showHat = e.target.checked;
});

document.getElementById("yawSlider").addEventListener("input", (e) => {
  g_yaw = parseFloat(e.target.value);
});

document.getElementById("pitchSlider").addEventListener("input", (e) => {
  g_pitch = parseFloat(e.target.value);
});

document.getElementById("rollSlider").addEventListener("input", (e) => {
  g_roll = parseFloat(e.target.value);
});

let isDragging = false;
let lastX = -1, lastY = -1;

canvas.addEventListener('mousedown', function(e) {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener('mouseup', function(e) {
  isDragging = false;
});

canvas.addEventListener('mousemove', function(e) {
  if (isDragging) {
    let dx = e.clientX - lastX;
    let dy = e.clientY - lastY;

    g_yaw += dx * 0.5;
    g_pitch += dy * 0.5;

    g_pitch = Math.max(Math.min(g_pitch, 90), -90);

    lastX = e.clientX;
    lastY = e.clientY;

    document.getElementById("yawSlider").value = g_yaw;
    document.getElementById("pitchSlider").value = g_pitch;
  }
});

canvas.addEventListener('click', function(e) {
  if (e.shiftKey) {
    g_pokeAnimation = true;
    g_pokeProgress = 0;
    g_animation = false; 
    setSlidersEnabled(false);
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
});

function drawCube(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4f(u_FragColor, ...color);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}


let g_upperLegAngle = 0;
let g_lowerLegAngle = 0;
let g_upperLegAngleR = 0;
let g_lowerLegAngleR = 0;

document.getElementById("upperLegSlider").addEventListener("input", (e) => {
  g_upperLegAngle = parseInt(e.target.value);
  if (!g_animation) {
    for (let i = 0; i < 4; i++) {
      g_upperLegAngles[i] = g_upperLegAngle;
    }
  }
});

document.getElementById("lowerLegSlider").addEventListener("input", (e) => {
  g_lowerLegAngle = parseInt(e.target.value);
  if (!g_animation) {
    for (let i = 0; i < 4; i++) {
      g_lowerLegAngles[i] = g_lowerLegAngle;
    }
  }
});

document.getElementById("upperLegSliderR").addEventListener("input", (e) => {
  g_upperLegAngleR = parseInt(e.target.value);
  if (!g_animation) {
    for (let i = 0; i < 4; i++) {
      g_upperLegAnglesR[i] = g_upperLegAngleR;
    }
  }
});

document.getElementById("lowerLegSliderR").addEventListener("input", (e) => {
  g_lowerLegAngleR = parseInt(e.target.value);
  if (!g_animation) {
    for (let i = 0; i < 4; i++) {
      g_lowerLegAnglesR[i] = g_lowerLegAngleR;
    }
  }
});

function updateAnimationAngles() {
  if (g_pokeAnimation) {
    g_pokeProgress += 0.01;

    if (g_pokeProgress >= 1) {
      g_pokeAnimation = false;
      g_pokeScale = 1.0;
      g_pokePitchOffset = 0;
    

      g_yaw = 0;
      g_pitch = 0;
      g_roll = 0;
    
      g_animation = true;
      setSlidersEnabled(!g_animation);

      canvas.width = 640;
      canvas.height = 480;
      gl.viewport(0, 0, canvas.width, canvas.height);

      return;
    }

    g_pokeScale = 1.0 + g_pokeProgress * 1.25; 
    g_pokePitchOffset = -g_pokeProgress * 40;
  }

  else if (g_animation) {
    let walkSpeed = 8.0;
    let baseBend = 25;
    let swingMagnitude = 15;
    let t = g_time * walkSpeed;

    let phaseOffsets = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4];

    g_upperLegAngles = [];
    g_lowerLegAngles = [];
    for (let i = 0; i < 4; i++) {
      g_upperLegAngles[i] = baseBend + Math.sin(t + phaseOffsets[i]) * swingMagnitude;
      g_lowerLegAngles[i] = baseBend - Math.sin(t + phaseOffsets[i]) * swingMagnitude;
    }

    g_upperLegAnglesR = [];
    g_lowerLegAnglesR = [];
    for (let i = 0; i < 4; i++) {
      g_upperLegAnglesR[i] = baseBend + Math.sin(t + phaseOffsets[i] + Math.PI/2) * swingMagnitude;
      g_lowerLegAnglesR[i] = baseBend - Math.sin(t + phaseOffsets[i] + Math.PI/2) * swingMagnitude;
    }

    g_footLegAngles = [];
    g_footLegAnglesR = [];
    for (let i = 0; i < 4; i++) {
      g_footLegAngles[i] = baseBend + Math.sin(t + phaseOffsets[i] + Math.PI/4) * swingMagnitude;
      g_footLegAnglesR[i] = baseBend + Math.sin(t + phaseOffsets[i] + Math.PI/4) * swingMagnitude;
    }

    g_abdomenTilt = Math.sin(t) * 2;
    g_headTilt = Math.sin(t + Math.PI / 2) * 1.2;

    document.getElementById("upperLegSlider").value = g_upperLegAngles[0];
    document.getElementById("lowerLegSlider").value = g_lowerLegAngles[0];
    document.getElementById("upperLegSliderR").value = g_upperLegAnglesR[0];
    document.getElementById("lowerLegSliderR").value = g_lowerLegAnglesR[0];
  }
}

function setSlidersEnabled(enabled) {
  document.getElementById("upperLegSlider").disabled = !enabled;
  document.getElementById("lowerLegSlider").disabled = !enabled;
  document.getElementById("upperLegSliderR").disabled = !enabled;
  document.getElementById("lowerLegSliderR").disabled = !enabled;
}

function toggleAnimation() {
  g_animation = !g_animation;
  setSlidersEnabled(!g_animation);
}

function renderScene() {
  gl.clearColor(0.9, 0.8, 1, 1); // light purple background
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let proj = new Matrix4();
  proj.setPerspective(60, canvas.width / canvas.height, 0.1, 50);   

  let view = new Matrix4();

  if (g_pokeAnimation) {
    view
      .translate(0, 0, -1.5)
      .scale(g_pokeScale, g_pokeScale, g_pokeScale)
      .rotate(0, 0, 1, 0)
      .rotate(g_pokePitchOffset, 1, 0, 0)
      .rotate(0, 0, 0, 1);
  } else {
    view
      .translate(0, 0, -1.5)
      .rotate(g_yaw, 0, 1, 0)
      .rotate(g_pitch, 1, 0, 0)
      .rotate(g_roll, 0, 0, 1);
  }
  
  let finalMatrix = new Matrix4();
  finalMatrix.set(proj).multiply(view);
  
  gl.uniformMatrix4fv(u_GlobalRotation, false, finalMatrix.elements);

  // abdomen
  let abdomen = new Matrix4().translate(0, 0.1, -0.25).rotate(g_abdomenTilt, 1, 0.25, 0).scale(0.45, 0.4, 0.5);
  drawCube(abdomen, [0.15, 0.15, 0.15, 1]); // dark grey

  // head
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  let head = new Matrix4().translate(0, 0.05, 0.25).rotate(g_headTilt, 1, 0, 0).scale(0.3, 0.3, 0.3);
  drawCube(head, [0.2, 0.2, 0.2, 1]); // light grey
  
  gl.disable(gl.POLYGON_OFFSET_FILL);

  // body
  let body = new Matrix4().translate(0, 0.01, 0).scale(0.15, 0.2, 0.6);
  drawCube(body, [0.1, 0.1, 0.1, 1]); // black

  // legs 
  for (let i = 0; i < 4; i++) {
    let yOffset = -0.1;
    let zOffset = 0.25 - i * 0.2;

    let upperLegL = new Matrix4()
      .translate(-0.15, yOffset, zOffset)
      .rotate(g_upperLegAngles[i], 0, 0, 1)
      .translate(-0.1, 0, 0) 
      .scale(0.2, 0.05, 0.05);
    drawCube(upperLegL, [0.15, 0.15, 0.15, 1]);
    
    let lowerLegL = new Matrix4()
      .translate(-0.15, yOffset, zOffset)
      .rotate(g_upperLegAngles[i], 0, 0, 1)
      .translate(-0.2, 0, 0)
      .rotate(g_lowerLegAngles[i], 0, 0, 1)
      .translate(-0.1, 0, 0)
      .scale(0.2, 0.05, 0.05);
    drawCube(lowerLegL, [0.2, 0.2, 0.2, 1]);
    
    let upperLegR = new Matrix4()
      .translate(0.15, yOffset, zOffset)
      .rotate(-g_upperLegAnglesR[i], 0, 0, 1)
      .translate(0.1, 0, 0)
      .scale(0.2, 0.05, 0.05);
    drawCube(upperLegR, [0.15, 0.15, 0.15, 1]);

    let lowerLegR = new Matrix4()
      .translate(0.15, yOffset, zOffset)
      .rotate(-g_upperLegAnglesR[i], 0, 0, 1)
      .translate(0.2, 0, 0)
      .rotate(-g_lowerLegAnglesR[i], 0, 0, 1)
      .translate(0.1, 0, 0)
      .scale(0.2, 0.05, 0.05);
    drawCube(lowerLegR, [0.2, 0.2, 0.2, 1]);

    let footL = new Matrix4()
      .translate(-0.15, yOffset, zOffset)
      .rotate(g_upperLegAngles[i], 0, 0, 1)
      .translate(-0.2, 0, 0)
      .rotate(g_lowerLegAngles[i], 0, 0, 1)
      .translate(-0.2, 0, 0)  
      .rotate(g_footLegAngles[i], 0, 0, 1)
      .translate(-0.1, 0, 0)
      .scale(0.2, 0.05, 0.05);
    drawCube(footL, [0.25, 0.25, 0.25, 1]); 

    let footR = new Matrix4()
      .translate(0.15, yOffset, zOffset)
      .rotate(-g_upperLegAnglesR[i], 0, 0, 1)
      .translate(0.2, 0, 0)
      .rotate(-g_lowerLegAnglesR[i], 0, 0, 1)
      .translate(0.2, 0, 0)
      .rotate(-g_footLegAnglesR[i], 0, 0, 1)
      .translate(0.1, 0, 0)
      .scale(0.2, 0.05, 0.05);
    drawCube(footR, [0.25, 0.25, 0.25, 1]);
  }

  if (g_showHat) {
    // top hat cylinder
    let hatTop = new Matrix4()
      .translate(0, 0.3, 0.25)
      .scale(0.15, 0.25, 0.15);
    drawCylinder(hatTop, [0.1, 0.1, 0.1, 1]);
  
    // hat brim
    let hatBrim = new Matrix4()
      .translate(0, 0.2, 0.25)
      .scale(0.25, 0.05, 0.25);
    drawCylinder(hatBrim, [0.1, 0.1, 0.1, 1]);
    // red hat ribbon
    let hatRibbon = new Matrix4()
      .translate(0, 0.27, 0.25) 
      .scale(0.16, 0.04, 0.16);
    drawCylinder(hatRibbon, [1, 0.1, 0.1, 1]); 
  }
}

function tick() {
  let now = performance.now();
  let deltaTime = (now - g_lastTimestamp) / 1000.0; 

  g_lastTimestamp = now;
  g_secondsElapsed += deltaTime;
  g_time = g_secondsElapsed;
  
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);

  g_frameCount++;
  if (now - g_lastFpsUpdate >= 1000) {
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFpsUpdate = now;
    document.getElementById('fpsCounter').innerText = `FPS: ${g_fps}`;
  }
}

tick();

