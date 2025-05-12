attribute vec4 a_Position;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform bool u_UseWorldUV;

varying vec2 v_TexCoord;

void main() {
  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;

  if (u_UseWorldUV) {
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_TexCoord = worldPos.xz;
  } else {
    v_TexCoord = a_TexCoord;
  }
}
