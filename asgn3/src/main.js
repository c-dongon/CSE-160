import { Camera } from "./camera/Camera.js";
import { Cube } from "./world/Cube.js";
import { addVec3, subtractVec3, scaleVec3 } from "../lib/utils.js";

const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl");
if (!gl) throw new Error("WebGL not supported");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.5, 0.7, 1.0, 1.0);
gl.enable(gl.DEPTH_TEST);

const camera = new Camera(canvas);
const map = Array(32).fill().map(() => Array(32).fill(0));
camera.map = map;
const walls = [];
let program = null;
let stoneTexture = null;
const enemies = [];
let enemyTexture = null;

function generateRandomPositions(count, excludeEdges = true) {
  const positions = [];
  while (positions.length < count) {
    const x = Math.floor(Math.random() * 32) - 16;
    const z = Math.floor(Math.random() * 32) - 16;

    if (excludeEdges && (x <= -15 || x >= 15 || z <= -15 || z >= 15)) continue;

    if (positions.some(([px, , pz]) => px === x && pz === z)) continue;

    positions.push([x, 0.5, z]); 
  }
  return positions;
}

const yellowCubes = generateRandomPositions(8);

const collected = new Set();
const yellowBlocks = yellowCubes.map((pos, i) =>
  ({ id: i, cube: new Cube(gl, program, pos, [0.5, 0.5, 0.5], false, [1, 1, 0, 1]) })
);

function generateWalls(map, walls, gl, program, stoneTexture) {
	for (let x = 0; x < 32; x++) {
		for (let z = 0; z < 32; z++) {
			const height = map[x][z];
			for (let y = 0; y < height; y++) {
				const block = new Cube(gl, program, [x - 16, y, z - 16], [1, 1, 1], true, [1, 1, 1, 1], stoneTexture);
				walls.push(block);
			}
		}
	}
}

function getTargetBlock(camera, maxSteps = 10, stepSize = 0.1) {
  const dir = subtractVec3(camera.at, camera.eye);
  dir.normalize();

  for (let i = 0; i < maxSteps; i++) {
    const t = i * stepSize;
    const point = addVec3(camera.eye, scaleVec3(dir, t));
    const gx = Math.floor(point.elements[0] + 16);
    const gy = Math.floor(point.elements[1]);
    const gz = Math.floor(point.elements[2] + 16);

    if (map[gx]?.[gz] > gy) {
      return {
        gx,
        gz,
        gy: map[gx][gz] - 1,    
        placeAbove: map[gx][gz], 
        hit: true
      };
    }
  }

  const end = addVec3(camera.eye, scaleVec3(dir, maxSteps * stepSize));
  const gx = Math.floor(end.elements[0] + 16);
  const gz = Math.floor(end.elements[2] + 16);
  return {
    gx,
    gz,
    gy: map[gx]?.[gz] ?? 0,
    placeAbove: (map[gx]?.[gz] ?? 0),
    hit: false
  };
}

function removeBlockInFront() {
  const info = getTargetBlock(camera);
  if (!map[info.gx] || map[info.gx][info.gz] <= 0) return;

  map[info.gx][info.gz] -= 1;

  for (let i = walls.length - 1; i >= 0; i--) {
    const b = walls[i];
    const pos = b.position;
    if (Math.round(pos[0]) === info.gx - 16 &&
        Math.round(pos[1]) === info.gy &&
        Math.round(pos[2]) === info.gz - 16) {
      walls.splice(i, 1);
      break;
    }
  }
}

function placeBlockInFront() {
  const info = getTargetBlock(camera);
  if (!map[info.gx]) return;
  map[info.gx][info.gz] += 1;

  const block = new Cube(gl, program, [info.gx - 16, info.placeAbove, info.gz - 16], [1, 1, 1], true, [1, 1, 1, 1], stoneTexture);
  walls.push(block);
}

Promise.all([
	fetch('shaders/vertex.glsl').then(r => r.text()),
	fetch('shaders/fragment.glsl').then(r => r.text()),
]).then(([vsSource, fsSource]) => {
	program = createProgram(gl, vsSource, fsSource);
	gl.useProgram(program);
	const a_Position = gl.getAttribLocation(program, 'a_Position');
	const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
	const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
	const u_UseWorldUV = gl.getUniformLocation(program, 'u_UseWorldUV');

	const skybox = new Cube(gl, program, [0, 0, 0], [1000, 1000, 1000], false, [0.5, 0.7, 1.0, 1.0]);

	for (let x = 0; x < 32; x++) {
		for (let z = 0; z < 32; z++) {
			if (x === 0 || x === 31 || z === 0 || z === 31) {
				map[x][z] = 3; 
			} else if ((x % 4 === 0 && z % 4 === 0)) {
				map[x][z] = 2; 
			}
		}
	}
	
	const u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
	const u_ProjMatrix = gl.getUniformLocation(program, 'u_ProjMatrix');
	
	const modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, camera.projectionMatrix.elements);
	
	const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
	const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
	const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
	
	gl.uniform4f(u_baseColor, 1.0, 0.0, 0.0, 1.0);
	
	initTexture(gl, 'textures/dirt.png', dirt => {
		const ground = new Cube(gl, program, [0, -0.5, 0], [32, 0.1, 32], true, [1, 1, 1, 1], dirt, true);
		ground.texture = dirt;

		initTexture(gl, 'textures/stone.png', stone => {
			generateWalls(map, walls, gl, program, stone);

			function render() {
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

				skybox.draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV);
				ground.draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV);

				for (const block of walls) {
					block.draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV);
				}

				for (const enemy of enemies) {
					const direction = subtractVec3(camera.eye, enemy.position);
					direction.normalize?.();
					const move = scaleVec3(direction, 0.008);
					enemy.position = addVec3(enemy.position, move);

					const dx = enemy.position.elements[0] - camera.eye.elements[0];
					const dz = enemy.position.elements[2] - camera.eye.elements[2];
					if (dx * dx + dz * dz < 0.5 * 0.5) {
						document.getElementById('game-over').style.display = 'block';
						setTimeout(() => location.reload(), 2000);
						return;
					}

					enemy.draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV);
				}

				for (const { id, cube } of yellowBlocks) {
					if (!collected.has(id)) {
    				cube.position[1] = 0.3 + 0.1 * Math.sin(performance.now() / 300 + id);
						cube.draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV);

						const dx = cube.position[0] - camera.eye.elements[0];
						const dz = cube.position[2] - camera.eye.elements[2];
						if (dx * dx + dz * dz < 0.5 * 0.5) {
							collected.add(id);
							if (collected.size === yellowBlocks.length) {
								document.getElementById('you-win').style.display = 'block';
								setTimeout(() => location.reload(), 3000);
							}
						}
					}
				}

				for (let i = enemies.length - 1; i >= 0; i--) {
					const a = enemies[i];
					for (let j = i - 1; j >= 0; j--) {
						const b = enemies[j];
						const dx = a.position[0] - b.position[0];
						const dz = a.position[2] - b.position[2];
						const distSq = dx * dx + dz * dz;
						if (distSq < 0.6 * 0.6) {
							enemies.splice(i, 1);  
							spawnEnemy();          
							break;                 
						}
					}
				}

				requestAnimationFrame(render);
			}

			function spawnEnemy() {
				const spawnX = Math.random() * 32 - 16;
				const spawnZ = Math.random() * 32 - 16;
				const enemy = new Cube(gl, program, [spawnX, 0, spawnZ], [1, 1, 1], true, [1, 1, 1, 1], enemyTexture);
				enemies.push(enemy);
			}

			initTexture(gl, 'textures/enemy.png', enemyTex => {
				enemyTexture = enemyTex;
				spawnEnemy();
				setInterval(spawnEnemy, 5000);
				render();
			});
		});
	});
});

function createProgram(gl, vShaderSource, fShaderSource) {
	const vShader = compileShader(gl, gl.VERTEX_SHADER, vShaderSource);
	const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
	const program = gl.createProgram();
	
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);
	
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error('Failed to link program: ' + gl.getProgramInfoLog(program));
	}
	return program;
}

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
		throw new Error(`Failed to compile ${typeName} shader:\n` + gl.getShaderInfoLog(shader));
	}
	return shader;
}

function initTexture(gl, src, callback) {
	const texture = gl.createTexture();
	const image = new Image();
	
	image.onload = function () {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		
		callback(texture);
	};
	
	image.src = src;
}

document.addEventListener('keydown', e => {
	switch (e.key) {
		case 'w': camera.moveForward(); break;
		case 's': camera.moveBackwards(); break;
		case 'a': camera.moveLeft(); break;
		case 'd': camera.moveRight(); break;
		case 'q': camera.panLeft(); break;
		case 'e': camera.panRight(); break;
	}
});

canvas.addEventListener('click', () => {
	canvas.requestPointerLock();
});

document.addEventListener('mousemove', e => {
	if (document.pointerLockElement === canvas) {
		camera.handleMouseMove(e.movementX, e.movementY);
	}
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 0) removeBlockInFront(); 
  if (e.button === 2) placeBlockInFront(); 
});
canvas.oncontextmenu = e => e.preventDefault(); 


