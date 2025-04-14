// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// Global variables
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let currentColor = [1.0, 1.0, 1.0, 1.0];
let currentSize = 10.0;
let shapesList = [];
let currentShape = 'point';

class Point {
  constructor(position, color, size) {
    this.position = position;
    this.color = color;
    this.size = size;
  }

  render() {
    const [cx, cy] = this.position;
    const s = this.size / 200;

    const verts = [
      cx - s, cy - s,
      cx + s, cy - s,
      cx + s, cy + s,

      cx + s, cy + s,
      cx - s, cy + s,
      cx - s, cy - s,
    ];

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, ...this.color);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}


function setShapeType(type) {
  currentShape = type;
}

class Triangle {
  constructor(center, color, size) {
    this.center = center;
    this.color = color;
    this.size = size;
  }

  render() {
    const [cx, cy] = this.center;
    const s = this.size / 200;

    const p1 = [cx, cy + s];
    const p2 = [cx - s, cy - s];
    const p3 = [cx + s, cy - s];

    const verts = [...p1, ...p2, ...p3];

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, ...this.color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}


class Circle {
  constructor(center, color, size, segments) {
    this.center = center;
    this.color = color;
    this.size = size;
    this.segments = segments;
  }

  render() {
    const angleStep = (2 * Math.PI) / this.segments;
    const verts = [this.center[0], this.center[1]];

    for (let i = 0; i <= this.segments; i++) {
      let angle = i * angleStep;
      verts.push(
        this.center[0] + Math.cos(angle) * this.size / 200,
        this.center[1] + Math.sin(angle) * this.size / 200
      );
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, ...this.color);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.segments + 2);
  }
}


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  handleClicks();

  function setupSliders() {
    document.getElementById("rSlider").oninput = () => updateColor();
    document.getElementById("gSlider").oninput = () => updateColor();
    document.getElementById("bSlider").oninput = () => updateColor();
    document.getElementById("sizeSlider").oninput = () => {
      currentSize = parseFloat(document.getElementById("sizeSlider").value);
    };
  }
  
  function updateColor() {
    const r = parseFloat(document.getElementById("rSlider").value) / 100;
    const g = parseFloat(document.getElementById("gSlider").value) / 100;
    const b = parseFloat(document.getElementById("bSlider").value) / 100;
    currentColor = [r, g, b, 1.0];
  }
  
  setupSliders();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  const canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get location of u_Size');
    return;
  }
}


function handleClicks() {
  const canvas = document.getElementById('webgl');
  canvas.onmousedown = (ev) => click(ev, canvas);
  canvas.onmousemove = (ev) => {
    if (ev.buttons === 1) {
      click(ev, canvas);
    }
  };
}

let trianglePoints = [];
let currentSegments = 10;

function click(ev, canvas) {
  let x = ev.clientX;
  let y = ev.clientY;
  const rect = canvas.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  if (currentShape === 'point') {
    shapesList.push(new Point([x, y], currentColor.slice(), currentSize));
  } else if (currentShape === 'triangle') {
    shapesList.push(new Triangle([x, y], currentColor.slice(), currentSize));
  } else if (currentShape === 'circle') {
    shapesList.push(new Circle([x, y], currentColor.slice(), currentSize, currentSegments));
  }

  renderAllShapes();
}

document.getElementById("segmentSlider").oninput = () => {
  currentSegments = parseInt(document.getElementById("segmentSlider").value);
};

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let shape of shapesList) {
    shape.render();
  }
}

function clearCanvas() {
  shapesList = [];
  renderAllShapes();
}

function drawFlower() {
  const numPetals = 10;
  const radius = 0.15;
  const petalSize = currentSize;
  const cx = 0.0;
  const cy = 0.3;

  for (let i = 0; i < numPetals; i++) {
    const angle = (2 * Math.PI / numPetals) * i;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    const petalColor = [
      1.0,
      0.4 + 0.4 * Math.sin(i),
      0.8 + 0.2 * Math.cos(i),
      1.0
    ];

    shapesList.push(new Triangle([x, y], petalColor, petalSize));
  }

  const offsets = [
    [0.0, 0.0],
    [0.05, 0.0],
    [-0.05, 0.0],
    [0.0, 0.05],
    [0.0, -0.05]
  ];

  for (let offset of offsets) {
    const [dx, dy] = offset;
    shapesList.push(new Triangle([cx + dx, cy + dy], [1.0, 1.0, 0.0, 1.0], petalSize * 0.6));
  }

  const stemStartY = 0;
  const stemEndY = -0.7;
  const stemSegments = 8;
  const stemColor = [0.0, 0.6, 0.0, 1.0];

  for (let i = 0; i < stemSegments; i++) {
    const y = stemStartY - i * ((stemStartY - stemEndY) / stemSegments);
    shapesList.push(new Triangle([cx, y], stemColor, petalSize * 0.9));
  }

  renderAllShapes();
}

