/**
 * Shaders da cena (decisions §2.3).
 * Sem luzes nem sombras reais: faces em cinza escuro, borda em fresnel azul,
 * contornos procedurais e neblina até o --color-bg. Tudo em sRGB direto.
 */

const common = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uPulseRadius;

  // Anel que sai do centro do grid e se repete (etapa Repeat).
  float pulseRing(vec2 xz) {
    float r = mod(uTime * 7.0, uPulseRadius);
    float d = length(xz) - r;
    return exp(-d * d * 0.3) * uPulse;
  }
`;

export const blocksVertex = /* glsl */ `
  ${common}
  uniform float uDrift;
  uniform float uPull;
  uniform float uAssemble;
  uniform float uExtrude;
  uniform float uLift;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform float uPointerRadius;
  uniform float uPointerBoost;
  uniform float uBlockSize;
  uniform float uBaseHeight;
  uniform float uMaxExtrude;
  uniform float uLiftHeight;

  attribute vec3 aChaos;
  attribute vec3 aOrder;
  attribute float aHeight;
  attribute float aDelay;
  attribute float aSeed;

  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vSnap;
  varying float vPulse;
  varying float vDepth;
  varying float vT;

  mat3 rotation(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c,          oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
      oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z + axis.x * s,
      oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
    );
  }

  void main() {
    const float W = 0.35; // largura da onda de encaixe

    // O cursor adianta a ordem de quem está perto dele (decisions §2.2)
    float near = 1.0 - smoothstep(0.0, uPointerRadius, distance(aOrder.xz, uPointer.xz));
    float boost = uPointerStrength * uPointerBoost * near;

    float t = smoothstep(aDelay, aDelay + W, uAssemble * (1.0 + W));
    t = max(t, smoothstep(0.0, 1.0, boost));

    // Caos com deriva lenta, puxado para o plano no trecho Problema
    float ph = aSeed * 6.2831853;
    vec3 chaos = aChaos + vec3(
      sin(uTime * 0.13 + ph),
      sin(uTime * 0.17 + ph * 1.3) * 0.6,
      cos(uTime * 0.11 + ph * 0.7)
    ) * 0.9 * uDrift;
    chaos.y = mix(chaos.y, 0.4 + chaos.y * 0.22, uPull);
    chaos.xz = mix(chaos.xz, aOrder.xz, uPull * 0.35);

    vec3 center = mix(chaos, aOrder, t);

    // Repeat: o anel levanta um pouco o que passa
    float ring = pulseRing(aOrder.xz);
    vPulse = ring * t;

    // Tamanho: cubos variados no caos, placa da célula na ordem
    float side = mix(0.35 + aSeed * 0.4, 1.0, t) * uBlockSize;
    float h = uBaseHeight + aHeight * uMaxExtrude * uExtrude;
    vec3 size = vec3(side, mix(side, h, t), side);

    center.y += (uLiftHeight * uLift + ring * 0.2) * t;

    // Rotação só no caos; some ao encaixar
    vec3 axis = normalize(vec3(sin(ph), cos(ph * 1.7), sin(ph * 2.3)) + 0.001);
    mat3 R = rotation(axis, (1.0 - t) * (ph + uTime * 0.25 * uDrift));

    vec3 local = position * size;               // geometria com y em [0, 1]
    vec3 pivot = vec3(0.0, size.y * 0.5, 0.0);
    vec3 world = center + R * (local - pivot) + pivot;

    vLocal = position - vec3(0.0, 0.5, 0.0);     // -0.5..0.5 nos três eixos
    vSize = size;
    vNormal = R * normal;
    vWorld = world;
    vSnap = clamp(t * t * (1.0 - t) * 6.75, 0.0, 1.0); // brilho no encaixe
    vT = t;

    vec4 view = viewMatrix * vec4(world, 1.0);
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

export const blocksFragment = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uFace;
  uniform vec3 uFaceTop;
  uniform vec3 uBrand;
  uniform float uFill;
  uniform float uLift;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vSnap;
  varying float vPulse;
  varying float vDepth;
  varying float vT;

  void main() {
    // Distância (em unidades do mundo) até a aresta mais próxima da face
    vec3 d = (0.5 - abs(vLocal)) * vSize;
    float edge = max(min(d.x, d.y), min(max(d.x, d.y), d.z));
    float aa = fwidth(edge) * 1.5;
    float line = 1.0 - smoothstep(0.012, 0.012 + aa, edge);

    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

    float up = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 face = mix(uFace, uFaceTop, up);
    face = mix(face, uBrand, uLift * 0.06 * step(0.5, N.y)) * (1.0 + uLift * 0.12);
    face = mix(uBg, face, uFill * mix(0.7, 1.0, vT)); // caos mais apagado: o texto do hero vem primeiro

    vec3 color = face + uBrand * fresnel * 0.2 * (0.4 + 0.6 * uFill);
    float edgeStrength = mix(1.0, 0.32, uFill) + vSnap * 1.2 + vPulse * 1.6 + uLift * 0.35;
    color = mix(color, uBrand, line * clamp(edgeStrength, 0.0, 1.0) * 0.85);

    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(color, uBg, fog), 1.0);
  }
`;

export const gridVertex = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 view = viewMatrix * world;
    vWorld = world.xyz;
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

export const gridFragment = /* glsl */ `
  ${common}
  uniform vec3 uBg;
  uniform vec3 uLine;
  uniform vec3 uDot;
  uniform vec3 uBrand;
  uniform vec2 uOffset;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vWorld;
  varying float vDepth;

  void main() {
    // Linhas nas bordas das células (mesma célula do grid em CSS)
    vec2 g = vWorld.xz + uOffset;
    vec2 f = abs(fract(g - 0.5) - 0.5);
    vec2 fw = fwidth(g);
    vec2 l = 1.0 - smoothstep(vec2(0.0), fw * 1.2, f);
    float line = max(l.x, l.y);
    float dotMask = 1.0 - smoothstep(0.035, 0.035 + max(fw.x, fw.y) * 1.5, length(f));

    vec3 color = mix(uBg, uLine, line);
    color = mix(color, uDot, dotMask);
    color = mix(color, uBrand, line * pulseRing(vWorld.xz) * 0.35);

    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(color, uBg, fog), 1.0);
  }
`;
