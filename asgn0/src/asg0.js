// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgb(0, 0, 0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color
}

function drawVector(v, color) {
  let ctx = document.getElementById('example').getContext('2d');
  
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20); 
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var x1 = parseFloat(document.getElementById('x1').value);
  var y1 = parseFloat(document.getElementById('y1').value);

  var x2 = parseFloat(document.getElementById('x2').value);
  var y2 = parseFloat(document.getElementById('y2').value);

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  let op = document.getElementById('operation').value;
  let scalar = parseFloat(document.getElementById('scalar').value);

  if (op === 'add') {
    let v3 = new Vector3([x1, y1, 0]).add(v2);
    drawVector(v3, "green");
  } else if (op === 'sub') {
    let v3 = new Vector3([x1, y1, 0]).sub(v2);
    drawVector(v3, "green");
  } else if (op === 'mul') {
    let v3 = new Vector3([x1, y1, 0]).mul(scalar);
    let v4 = new Vector3([x2, y2, 0]).mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === 'div') {
    let v3 = new Vector3([x1, y1, 0]).div(scalar);
    let v4 = new Vector3([x2, y2, 0]).div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === 'magnitude') {
    console.log("Magnitude of v1:", v1.magnitude());
    console.log("Magnitude of v2:", v2.magnitude());
  } else if (op === 'normalize') {
    let v1Norm = new Vector3([x1, y1, 0]).normalize();
    let v2Norm = new Vector3([x2, y2, 0]).normalize();
    drawVector(v1Norm, "green");
    drawVector(v2Norm, "green");
  } else if (op === 'angle') {
    angleBetween(v1, v2);
  } else if (op === 'area') {
    areaTriangle(v1, v2);
  }
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();
  if (mag1 === 0 || mag2 === 0) {
    console.log("cannot compute with zero-length vector.");
    return;
  }
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta)); 
  let angleRad = Math.acos(cosTheta);
  let angleDeg = angleRad * (180 / Math.PI);
  console.log("Angle:", angleDeg);
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let area = 0.5 * cross.magnitude();
  console.log("Area of the triangle:", area);
}
