export class Cube {
  constructor(gl, program, position = [0, 0, 0], scale = [1, 1, 1], useTexture = true, color = [1.0, 0.0, 0.0, 1.0], texture = null, useWorldUV = false) {
    this.gl = gl;
    this.program = program;
    this.position = position;
    this.scale = scale;
    this.useTexture = useTexture;
    this.color = color; 
    this.texture = texture;
    this.useWorldUV = useWorldUV;

    if (!Cube.vertexBuffer) {
      Cube.vertexBuffer = gl.createBuffer();
      Cube.indexBuffer = gl.createBuffer();

      const vertices = new Float32Array([
        // front
        -0.5, -0.5,  0.5, 0, 0,
         0.5, -0.5,  0.5, 1, 0,
         0.5,  0.5,  0.5, 1, 1,
        -0.5,  0.5,  0.5, 0, 1,
        // back
        -0.5, -0.5, -0.5, 1, 0,
         0.5, -0.5, -0.5, 0, 0,
         0.5,  0.5, -0.5, 0, 1,
        -0.5,  0.5, -0.5, 1, 1,
        // left
        -0.5, -0.5, -0.5, 0, 0,
        -0.5, -0.5,  0.5, 1, 0,
        -0.5,  0.5,  0.5, 1, 1,
        -0.5,  0.5, -0.5, 0, 1,
        // right
         0.5, -0.5, -0.5, 0, 0,
         0.5, -0.5,  0.5, 1, 0,
         0.5,  0.5,  0.5, 1, 1,
         0.5,  0.5, -0.5, 0, 1,
        // top
        -0.5,  0.5,  0.5, 0, 0,
         0.5,  0.5,  0.5, 1, 0,
         0.5,  0.5, -0.5, 1, 1,
        -0.5,  0.5, -0.5, 0, 1,
        // bottom
        -0.5, -0.5,  0.5, 0, 0,
         0.5, -0.5,  0.5, 1, 0,
         0.5, -0.5, -0.5, 1, 1,
        -0.5, -0.5, -0.5, 0, 1,
      ]);

      const indices = new Uint8Array([
         0,  1,  2,  0,  2,  3, // front
         4,  5,  6,  4,  6,  7, // back
         8,  9, 10,  8, 10, 11, // left
        12, 13, 14, 12, 14, 15, // right
        16, 17, 18, 16, 18, 19, // top
        20, 21, 22, 20, 22, 23  // bottom
      ]);

      gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cube.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      Cube.vertexStride = 5 * Float32Array.BYTES_PER_ELEMENT;
    }
  }

  draw(u_ModelMatrix, a_Position, a_TexCoord, u_texColorWeight, u_baseColor, u_Sampler, u_UseWorldUV) {
    const gl = this.gl;
    const modelMatrix = new Matrix4();
    modelMatrix.translate(...(this.position.elements ?? this.position));
    modelMatrix.scale(...(this.scale.elements ?? this.scale));


    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, Cube.vertexStride, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, Cube.vertexStride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(a_TexCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cube.indexBuffer);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.uniform1f(u_texColorWeight, this.useTexture ? 1.0 : 0.0);
    gl.uniform4f(u_baseColor, ...this.color);

    gl.uniform1i(u_UseWorldUV, this.useWorldUV ? 1 : 0);

    if (this.useTexture && this.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(u_Sampler, 0);
    }

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  }
}