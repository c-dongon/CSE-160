export function mat4Identity() {
  return new Float32Array([
    1, 0, 0, 0, 
    0, 1, 0, 0, 
    0, 0, 1, 0, 
    0, 0, 0, 1
  ]);
}

export function mat4LookAt(eye, at, up) {
  const [ex, ey, ez] = eye;
  const [ax, ay, az] = at;

  const f = normalize([ax - ex, ay - ey, az - ez]);
  const s = normalize(cross(f, up));
  const u = cross(s, f);

  return new Float32Array([
     s[0],  u[0], -f[0], 0,
     s[1],  u[1], -f[1], 0,
     s[2],  u[2], -f[2], 0,
    -dot(s, eye), -dot(u, eye), dot(f, eye), 1
  ]);
}

export function mat4Perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan((fov * Math.PI) / 360);
  const rangeInv = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
}

export function normalize(v) {
  const len = Math.hypot(...v);
  return v.map(x => x / len);
}

export function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}

export function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export function mat4Translate(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]);
}

export function mat4NormalFromModel(m) {
  const a = new Float32Array(9);
  a[0] = m[0]; a[1] = m[1]; a[2] = m[2];
  a[3] = m[4]; a[4] = m[5]; a[5] = m[6];
  a[6] = m[8]; a[7] = m[9]; a[8] = m[10];

  const inv = invert3x3(a);
  return new Float32Array([
    inv[0], inv[3], inv[6], 0,
    inv[1], inv[4], inv[7], 0,
    inv[2], inv[5], inv[8], 0,
    0, 0, 0, 1
  ]);
}

export function invert3x3(m) {
  const a = m[0], b = m[1], c = m[2],
        d = m[3], e = m[4], f = m[5],
        g = m[6], h = m[7], i = m[8];

  const det = a*e*i - a*f*h - b*d*i + b*f*g + c*d*h - c*e*g;
  if (det === 0) return new Float32Array(9);

  const invDet = 1.0 / det;
  return new Float32Array([
    (e*i - f*h) * invDet,
    (c*h - b*i) * invDet,
    (b*f - c*e) * invDet,
    (f*g - d*i) * invDet,
    (a*i - c*g) * invDet,
    (c*d - a*f) * invDet,
    (d*h - e*g) * invDet,
    (b*g - a*h) * invDet,
    (a*e - b*d) * invDet
  ]);
}

export function mat4ScaleTranslate(sx, sy, sz, tx, ty, tz) {
  return new Float32Array([
    sx,  0,  0,  0,
     0, sy,  0,  0,
     0,  0, sz,  0,
    tx, ty, tz,  1
  ]);
}