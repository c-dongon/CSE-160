import {
  mat4LookAt,
  mat4Perspective,
  mat4Translate,
  mat4ScaleTranslate,
  mat4NormalFromModel,
  normalize
} from '../lib/utils.js';

let gl, program;
let u_ShowNormals, u_ModelMatrix, u_ViewMatrix, u_ProjMatrix;
let showNormals = false;
let lightPos = [1.5, 1.5, 0];
let u_LightPos;
let u_NormalMatrix, u_LightColor;
let lightColor = [1.0, 1.0, 1.0];
let u_LightingOn;
let lightingOn = true;
let useSpotlight = true;
let u_UseSpotlight;
let u_SpotDirection;
let u_SpotCutoff;


let time = 0;

window.onload = () => {
  const canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");
  if (!gl) return alert("WebGL not supported");

  document.getElementById("lightY").oninput = e => {
  lightPos[1] = parseFloat(e.target.value);
  };

  const vs = document.getElementById("vertex-shader").textContent;
  const fs = document.getElementById("fragment-shader").textContent;
  program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  u_ShowNormals = gl.getUniformLocation(program, "u_ShowNormals");
  u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
  u_ProjMatrix = gl.getUniformLocation(program, "u_ProjMatrix");
  u_LightPos = gl.getUniformLocation(program, "u_LightPos");
  u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
  u_LightColor = gl.getUniformLocation(program, "u_LightColor");
  u_LightingOn = gl.getUniformLocation(program, "u_LightingOn");
  u_SpotDirection = gl.getUniformLocation(program, "u_SpotDirection");
  u_SpotCutoff = gl.getUniformLocation(program, "u_SpotCutoff");
  u_UseSpotlight = gl.getUniformLocation(program, "u_UseSpotlight");

  document.getElementById("toggleNormals").onclick = () => {
    showNormals = !showNormals;
    render();
  };

  document.getElementById("toggleLighting").onclick = () => {
    lightingOn = !lightingOn;
  };

  document.getElementById("lightColor").oninput = e => {
    const hex = e.target.value;
    lightColor = [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255
    ];
  };

  document.getElementById("toggleLightType").onclick = () => {
    useSpotlight = !useSpotlight;
  };

  gl.enable(gl.DEPTH_TEST);
  initCube();
  initSphere();
  tick();
};

let sphere;

function initSphere() {
  sphere = generateSphere(20, 20, 0.5);
  sphere.positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

  sphere.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

  sphere.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

  sphere.numIndices = sphere.indices.length;
}

let cube = {};

function initCube() {
  const positions = new Float32Array([
    // front face
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,

    // back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,

    // top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,

    // bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,

    // right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,

    // left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ]);

  const normals = new Float32Array([
    // front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // top
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // bottom
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
  ]);

  const indices = new Uint8Array([
    0, 1, 2,    0, 2, 3,    // front
    4, 5, 6,    4, 6, 7,    // back
    8, 9,10,    8,10,11,    // top
   12,13,14,   12,14,15,    // bottom
   16,17,18,   16,18,19,    // right
   20,21,22,   20,22,23     // left
  ]);

  cube.positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  cube.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  cube.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  cube.numIndices = indices.length;
}

function bindBuffer(attr, data, size, buffer = null) {
  const loc = gl.getAttribLocation(program, attr);
  if (!buffer) {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  }
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc);
}

function render() {
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const viewMatrix = mat4LookAt([1.5, 1.5, 3], [0, 0, 0], [0, 1, 0]);
  const projMatrix = mat4Perspective(60, 1, 0.1, 100);

  gl.uniform3fv(u_LightPos, lightPos);
  gl.uniform3fv(u_LightColor, lightColor);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix);
  gl.uniform1i(u_ShowNormals, showNormals);
  gl.uniform1i(u_LightingOn, lightingOn);

  const cubeModelMatrix = mat4Translate(-0.75, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, cubeModelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(cubeModelMatrix));
  bindBuffer("a_Position", null, 3, cube.positionBuffer);
  bindBuffer("a_Normal", null, 3, cube.normalBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);

  const sphereModelMatrix = mat4Translate(0.75, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, sphereModelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(sphereModelMatrix));
  bindBuffer("a_Position", sphere.vertices, 3, sphere.positionBuffer);
  bindBuffer("a_Normal", sphere.normals, 3, sphere.normalBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
  gl.drawElements(gl.TRIANGLES, sphere.numIndices, gl.UNSIGNED_SHORT, 0);

  const lightMarkerMatrix = mat4Translate(lightPos[0], lightPos[1], lightPos[2]);
  const scale = 0.1;
  lightMarkerMatrix[0] *= scale;
  lightMarkerMatrix[5] *= scale;
  lightMarkerMatrix[10] *= scale;

  gl.uniformMatrix4fv(u_ModelMatrix, false, lightMarkerMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(lightMarkerMatrix));

  gl.uniform1i(u_LightingOn, false);
  gl.uniform1i(u_ShowNormals, false);
  gl.uniform3fv(u_LightColor, [1.0, 0.0, 0.0]);

  bindBuffer("a_Position", null, 3, cube.positionBuffer);
  bindBuffer("a_Normal", null, 3, cube.normalBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);

  gl.uniform1i(u_LightingOn, lightingOn);
  gl.uniform1i(u_ShowNormals, showNormals);
  gl.uniform3fv(u_LightColor, lightColor);

  const groundMatrix = mat4ScaleTranslate(5, 0.1, 5, 0, -0.55, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, groundMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(groundMatrix));
  bindBuffer("a_Position", null, 3, cube.positionBuffer);
  bindBuffer("a_Normal", null, 3, cube.normalBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);

  const leftWallMatrix = mat4ScaleTranslate(0.1, 4, 5, -2.5, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, leftWallMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(leftWallMatrix));
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);

  const backWallMatrix = mat4ScaleTranslate(5, 4, 0.1, 0, 0, -2.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, backWallMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, mat4NormalFromModel(backWallMatrix));
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);

  const targetPoint = [0, 0, 0];
  const spotDir = [
    targetPoint[0] - lightPos[0],
    targetPoint[1] - lightPos[1],
    targetPoint[2] - lightPos[2]
  ];
  gl.uniform3fv(u_SpotDirection, normalize(spotDir));  gl.uniform1f(u_SpotCutoff, Math.cos(0.4));
  gl.uniform1i(u_UseSpotlight, useSpotlight ? 1 : 0);

}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Link failed:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader failed:", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function generateSphere(latBands, longBands, radius) {
  const positions = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; ++lat) {
    const theta = lat * Math.PI / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longBands; ++lon) {
      const phi = lon * 2 * Math.PI / longBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
    }
  }

  for (let lat = 0; lat < latBands; ++lat) {
    for (let lon = 0; lon < longBands; ++lon) {
      const first = lat * (longBands + 1) + lon;
      const second = first + longBands + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    vertices: new Float32Array(positions),
    normals: new Float32Array(positions),
    indices: new Uint16Array(indices),
    numIndices: indices.length  
  };
}

function tick() {
  time += 0.01;

  lightPos[0] = Math.sin(time) * 1.5;
  lightPos[2] = Math.cos(time) * 1.5;

  render();
  requestAnimationFrame(tick);
}