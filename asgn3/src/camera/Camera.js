function crossVec3(a, b) {
	return new Vector3([
		a.elements[1] * b.elements[2] - a.elements[2] * b.elements[1],
		a.elements[2] * b.elements[0] - a.elements[0] * b.elements[2],
		a.elements[0] * b.elements[1] - a.elements[1] * b.elements[0]
	]);
}

function subtractVec3(a, b) {
	return new Vector3([
		a.elements[0] - b.elements[0],
		a.elements[1] - b.elements[1],
		a.elements[2] - b.elements[2]
	]);
}

function addVec3(a, b) {
	return new Vector3([
		a.elements[0] + b.elements[0],
		a.elements[1] + b.elements[1],
		a.elements[2] + b.elements[2]
	]);
}

function scaleVec3(v, s) {
	return new Vector3([
		v.elements[0] * s,
		v.elements[1] * s,
		v.elements[2] * s
	]);
}

export class Camera {
	constructor(canvas) {
		this.fov = 60;
		this.eye = new Vector3([0, 0.5, 3]);
		this.at  = new Vector3([0, 0, 0]);
		this.up = new Vector3([0, 1, 0]);
		this.yaw = -90; 
		this.pitch = 0;  
		this.sensitivity = 0.2;
		
		this.viewMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		
		this.updateViewMatrix();
		this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
	}
	
	updateViewMatrix() {
		this.viewMatrix.setLookAt(
			this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
			this.at.elements[0], this.at.elements[1], this.at.elements[2],
			this.up.elements[0], this.up.elements[1], this.up.elements[2]
		);
	}

		updateAtFromAngles() {
		const radYaw = this.yaw * Math.PI / 180;
		const radPitch = this.pitch * Math.PI / 180;

		const x = Math.cos(radPitch) * Math.cos(radYaw);
		const y = Math.sin(radPitch);
		const z = Math.cos(radPitch) * Math.sin(radYaw);

		const direction = new Vector3([x, y, z]);
		direction.normalize();

		this.at = addVec3(this.eye, direction);
		this.updateViewMatrix();
	}

	handleMouseMove(deltaX, deltaY) {
		this.yaw += deltaX * this.sensitivity;
		this.pitch -= deltaY * this.sensitivity;

		this.pitch = Math.max(-89, Math.min(89, this.pitch));

		this.updateAtFromAngles();
	}

moveForward(speed = 0.13) {
  let f = subtractVec3(this.at, this.eye);
  f.elements[1] = 0; 
  f.normalize();
  this.tryMove(scaleVec3(f, speed));
}

moveBackwards(speed = 0.13) {
  let f = subtractVec3(this.eye, this.at);
  f.elements[1] = 0;
  f.normalize();
  this.tryMove(scaleVec3(f, speed));
}

moveLeft(speed = 0.13) {
  let f = subtractVec3(this.at, this.eye);
  let s = crossVec3(this.up, f);
  s.elements[1] = 0;
  s.normalize();
  this.tryMove(scaleVec3(s, speed));
}

moveRight(speed = 0.13) {
  let f = subtractVec3(this.at, this.eye);
  let s = crossVec3(f, this.up);
  s.elements[1] = 0;
  s.normalize();
  this.tryMove(scaleVec3(s, speed));
}
	
	panLeft(angle = 3) {
		let f = subtractVec3(this.at, this.eye);
		let rotationMatrix = new Matrix4();
		rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
		let f_prime = rotationMatrix.multiplyVector3(f);
		this.at = addVec3(this.eye, f_prime);
		this.updateViewMatrix();
	}
	
	panRight(angle = 3) {
		this.panLeft(-angle);
	}

	tryMove(deltaVec) {
		const proposed = addVec3(this.eye, deltaVec);
		const padding = 0.25; 

		for (let dx = -padding; dx <= padding; dx += padding) {
			for (let dz = -padding; dz <= padding; dz += padding) {
				const x = proposed.elements[0] + dx;
				const z = proposed.elements[2] + dz;
				const gridX = Math.floor(x + 16); 
				const gridZ = Math.floor(z + 16);
				if (this.map?.[gridX]?.[gridZ] > 0) return; 
			}
		}

		proposed.elements[1] = 0.5; 
		this.eye = proposed;
		this.updateAtFromAngles();
	}
}
