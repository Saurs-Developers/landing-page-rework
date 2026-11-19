/**
 * Estado mutável da cena, fora do React. O componente R3F só cria uma
 * instância e chama `frame()` a cada quadro; nada aqui dispara render.
 */

import {
  BoxGeometry,
  InstancedBufferAttribute,
  type PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { type TierConfig, camera, cameraDistance, pointer, world } from "./config";
import { sceneControls } from "./controls";
import { buildInstances } from "./instances";
import { type FpsMonitor } from "./quality";
import { blocksFragment, blocksVertex, gridFragment, gridVertex } from "./shaders";
import { stageUniforms } from "./stages";

export type Vec3 = [number, number, number];

export interface SceneColors {
  bg: Vec3;
  face: Vec3;
  faceTop: Vec3;
  brand: Vec3;
  line: Vec3;
  dot: Vec3;
}

export interface RuntimeOptions {
  config: TierConfig;
  colors: SceneColors;
  /** Tamanho da célula do grid em px (--grid-cell). */
  cellPx: number;
  /** Modo captura: sem suavização, sem cursor, sem monitor. */
  capture: boolean;
  monitor: FpsMonitor | null;
}

const RAD = Math.PI / 180;

export class SceneRuntime {
  readonly blocksGeometry: BoxGeometry;
  readonly gridGeometry: PlaneGeometry;
  readonly blocksMaterial: ShaderMaterial;
  readonly gridMaterial: ShaderMaterial;
  readonly count: number;

  private readonly shared;
  private readonly ray = new Raycaster();
  private readonly plane = new Plane(new Vector3(0, 1, 0), 0);
  private readonly hit = new Vector3();
  private readonly pointerTarget = new Vector3(0, 0, 9999);
  private readonly ndc = new Vector2();
  private readonly parallax = new Vector2();
  private readonly parallaxTarget = new Vector2();
  private pointerInside = false;
  private progress = sceneControls.progress;
  private time = 0;
  private framesDrawn = 0;
  private downgradeRequested = false;

  readonly colors: SceneColors;

  constructor(private readonly opts: RuntimeOptions) {
    const { config, colors } = opts;
    this.colors = colors;
    const data = buildInstances(config);
    this.count = data.count;

    const geo = new BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0); // base no plano, y em [0, 1]
    geo.setAttribute("aChaos", new InstancedBufferAttribute(data.chaos, 3));
    geo.setAttribute("aOrder", new InstancedBufferAttribute(data.order, 3));
    geo.setAttribute("aHeight", new InstancedBufferAttribute(data.height, 1));
    geo.setAttribute("aDelay", new InstancedBufferAttribute(data.delay, 1));
    geo.setAttribute("aSeed", new InstancedBufferAttribute(data.seed, 1));
    this.blocksGeometry = geo;

    this.gridGeometry = new PlaneGeometry(config.cols * 4, config.rows * 6);
    this.gridGeometry.rotateX(-Math.PI / 2);

    this.shared = {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uPulseRadius: { value: Math.hypot(config.cols, config.rows) * 0.55 },
      uBg: { value: new Vector3(...colors.bg) },
      uBrand: { value: new Vector3(...colors.brand) },
      uFogNear: { value: 20 },
      uFogFar: { value: 60 },
    };

    this.blocksMaterial = new ShaderMaterial({
      vertexShader: blocksVertex,
      fragmentShader: blocksFragment,
      uniforms: {
        ...this.shared,
        uDrift: { value: 1 },
        uPull: { value: 0 },
        uAssemble: { value: 0 },
        uFill: { value: 1 },
        uExtrude: { value: 0 },
        uLift: { value: 0 },
        uPointer: { value: this.pointerTarget.clone() },
        uPointerStrength: { value: 0 },
        uPointerRadius: { value: pointer.radius },
        uPointerBoost: { value: pointer.boost },
        uBlockSize: { value: world.blockSize },
        uBaseHeight: { value: world.baseHeight },
        uMaxExtrude: { value: world.maxExtrude },
        uLiftHeight: { value: world.lift },
        uFace: { value: new Vector3(...colors.face) },
        uFaceTop: { value: new Vector3(...colors.faceTop) },
      },
    });

    this.gridMaterial = new ShaderMaterial({
      vertexShader: gridVertex,
      fragmentShader: gridFragment,
      uniforms: {
        ...this.shared,
        uLine: { value: new Vector3(...colors.line) },
        uDot: { value: new Vector3(...colors.dot) },
        // colunas pares: bordas das células nos inteiros; ímpares: em .5
        uOffset: { value: new Vector2(config.cols % 2 ? 0.5 : 0, config.rows % 2 ? 0.5 : 0) },
      },
    });
  }

  /** Liga o cursor (só em ponteiro fino com hover). Devolve a limpeza. */
  attachPointer(): () => void {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || this.opts.capture) return () => {};
    const move = (e: PointerEvent) => {
      this.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.pointerInside = true;
    };
    const leave = () => {
      this.pointerInside = false;
    };
    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }

  /** Loop pausado: o tempo parado não conta como frame lento. */
  resume() {
    this.opts.monitor?.reset();
  }

  /**
   * Um quadro. Devolve eventos para o componente: `ready` depois do primeiro
   * frame desenhado e `downgrade` quando o FPS pede menos qualidade.
   */
  frame(cam: PerspectiveCamera, viewportHeight: number, delta: number) {
    const { capture, cellPx, monitor } = this.opts;
    const dt = Math.min(Math.max(delta, 0), 1 / 20);

    // Progresso suavizado (a 3c escreve sceneControls.progress)
    const lerp = capture ? 1 : sceneControls.progressLerp;
    this.progress += (sceneControls.progress - this.progress) * lerp;
    this.time = sceneControls.frozenTime ?? this.time + dt;

    const u = stageUniforms(this.progress);
    const bu = this.blocksMaterial.uniforms;
    bu.uDrift.value = u.drift;
    bu.uPull.value = u.pull;
    bu.uAssemble.value = u.assemble;
    bu.uFill.value = u.fill;
    bu.uExtrude.value = u.extrude;
    bu.uLift.value = u.lift;
    this.shared.uPulse.value = u.pulse;
    this.shared.uTime.value = this.time;

    // Câmera: 1 célula = --grid-cell no centro da tela; paralaxe de ±2,5°
    const usePointer = sceneControls.pointerEnabled && this.pointerInside && !capture;
    this.parallaxTarget.set(usePointer ? this.ndc.x : 0, usePointer ? this.ndc.y : 0);
    this.parallax.lerp(this.parallaxTarget, capture ? 1 : camera.parallaxLerp);
    const dist = cameraDistance(viewportHeight, cellPx);
    const elevation = (camera.elevation + this.parallax.y * camera.parallax) * RAD;
    const azimuth = this.parallax.x * camera.parallax * RAD;
    cam.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * dist,
      Math.sin(elevation) * dist,
      Math.cos(azimuth) * Math.cos(elevation) * dist,
    );
    cam.lookAt(0, 0, 0);
    if (Math.abs(cam.far - dist * 4) > 1e-3) {
      cam.near = dist * 0.05;
      cam.far = dist * 4;
      cam.updateProjectionMatrix();
    }
    this.shared.uFogNear.value = dist * 0.75;
    this.shared.uFogFar.value = dist * 1.75;

    // Cursor no plano do grid (interseção raio-plano, sem raycast em malha)
    let strength = 0;
    if (usePointer) {
      this.ray.setFromCamera(this.ndc, cam);
      if (this.ray.ray.intersectPlane(this.plane, this.hit)) {
        // primeiro contato: pula direto, sem varrer o grid desde o infinito
        if (this.pointerTarget.z > 9000) this.pointerTarget.copy(this.hit);
        else this.pointerTarget.lerp(this.hit, pointer.lerp * 2);
        strength = 1;
      }
    }
    bu.uPointer.value.copy(this.pointerTarget);
    bu.uPointerStrength.value += (strength - bu.uPointerStrength.value) * pointer.lerp;

    this.framesDrawn++;
    const ready = this.framesDrawn === 2;
    let downgrade = false;
    if (monitor && !this.downgradeRequested && monitor.tick(performance.now()) === "downgrade") {
      this.downgradeRequested = true;
      downgrade = true;
    }
    return { ready, downgrade };
  }

  dispose() {
    this.blocksGeometry.dispose();
    this.gridGeometry.dispose();
    this.blocksMaterial.dispose();
    this.gridMaterial.dispose();
  }
}
