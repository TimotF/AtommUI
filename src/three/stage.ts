import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { PreviewMeshData } from './geometry.js';

export type PreviewSize = { width: number; height: number; thickness: number };
export type PreviewAppearance = { material: string; color: string };
export type PreviewDiagnostics = {
  camera: number[]; target: number[]; zoom: number; geometries: number; textures: number;
  programs: number; rebuilds: number; renders: number; maxStepMs: number; reducedMotion: boolean;
};
/** Frame-rate independent enough with bounded substeps, with one small overshoot. */
export function springStep(value: number, velocity: number, target: number, dt: number) {
  const steps = Math.max(1, Math.ceil(Math.min(dt, .05) / .008)), h = Math.min(dt, .05) / steps;
  for (let i = 0; i < steps; i++) { velocity += ((target - value) * 250 - velocity * 24) * h; value += velocity * h; }
  return { value, velocity };
}

/** A display-only stage. It never owns parameters, export operations, or fabrication geometry. */
export class PreviewStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, .01, 10000);
  private controls: OrbitControls;
  private rig = new THREE.Group();
  private content = new THREE.Group();
  private environment: THREE.WebGLRenderTarget;
  private texture: THREE.CanvasTexture;
  private face = new THREE.MeshStandardMaterial({ roughness: .8 });
  private edge = new THREE.MeshStandardMaterial({ color: '#66533b', roughness: .95 });
  private engraving = new THREE.MeshBasicMaterial({ color: '#553018', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  private observer: ResizeObserver;
  private motion = matchMedia('(prefers-reduced-motion: reduce)');
  private dimensions?: PreviewSize;
  private fitDistance = 0;
  private viewport = '';
  private active = true;
  private disposed = false;
  private frame = 0;
  private previousTime = 0;
  private time = 0;
  private dragging = false;
  private dragX = 0;
  private dragY = 0;
  private springX = 0;
  private springY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private rebuilds = 0;
  private renders = 0;
  private maxStepMs = 0;
  private lastPercent = -1;
  private ready = false;
  private diagnosticsTimer: ReturnType<typeof setInterval>;

  constructor(private host: HTMLElement, private onZoom: (percent: number) => void, private onLimits?: (limits: { min: number; max: number }) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor('#f1f2f4');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.append(this.renderer.domElement);
    const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room);
    room.dispose(); pmrem.dispose();
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .4;
    this.scene.add(this.rig);
    this.rig.add(this.content);
    this.content.scale.y = -1;
    const key = new THREE.DirectionalLight('#ffffff', 2);
    key.position.set(-120, 180, 300); this.scene.add(key);
    this.texture = this.woodTexture();
    this.face.map = this.face.bumpMap = this.texture; this.face.bumpScale = .12;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.motion.matches;
    this.controls.maxPolarAngle = Math.PI * .95;
    this.controls.minPolarAngle = Math.PI * .05;
    this.controls.addEventListener('change', this.reportZoom);
    this.motion.addEventListener('change', this.motionChanged);
    host.addEventListener('pointerdown', this.pointerDown);
    host.addEventListener('pointermove', this.pointerMove);
    host.addEventListener('pointerup', this.pointerUp);
    host.addEventListener('pointercancel', this.pointerUp);
    host.addEventListener('lostpointercapture', this.pointerUp);
    this.observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width <= 0 || height <= 0 || this.viewport === `${width}:${height}`) return;
      this.viewport = `${width}:${height}`;
      const percent = this.percent();
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
      this.updateBounds();
      if (!this.ready && this.dimensions) this.fit();
      else if (this.ready) this.setZoom(percent);
      this.publishDiagnostics();
    });
    this.observer.observe(host);
    // DOM diagnostics allow browser checks without reaching into Vue/three private state.
    this.diagnosticsTimer = setInterval(() => this.publishDiagnostics(), 1000);
    this.animate(0);
  }

  private woodTexture() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#efd7b1'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 350; i++) {
      const x = (i * 37.17) % 256; ctx.strokeStyle = `rgba(90,54,20,${.012 + (i % 9) * .003})`;
      ctx.lineWidth = .5 + (i % 3) * .3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + Math.sin(i) * 3, 80, x - 2, 170, x, 256); ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(1 / 45, 1 / 45);
    return map;
  }

  setAppearance(appearance: PreviewAppearance) {
    const solid = appearance.material === 'solid';
    this.face.color.set(solid ? appearance.color : appearance.material === 'walnut' ? '#795331' : '#fff5e8');
    this.face.map = this.face.bumpMap = solid ? null : this.texture;
    this.face.roughness = solid ? .45 : .8; this.face.needsUpdate = true;
    this.edge.color.set(solid ? appearance.color : '#66533b').multiplyScalar(solid ? .7 : 1);
  }

  setContent(meshes: readonly PreviewMeshData[], size: PreviewSize) {
    if (![size.width, size.height, size.thickness].every(x => Number.isFinite(x) && x > 0)) return;
    this.clear(); this.dimensions = { ...size }; this.rebuilds++;
    for (const data of meshes) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(data.position, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(data.uv, 2));
      if (data.index) geometry.setIndex(new THREE.BufferAttribute(data.index, 1));
      for (const group of data.groups) geometry.addGroup(group.start, group.count, group.materialIndex);
      this.content.add(new THREE.Mesh(geometry, data.engraved ? this.engraving : [this.face, this.edge]));
    }
    this.content.position.set(-size.width / 2, size.height / 2, 0);
    // Rebuild only the content: preserve camera, controls, pan, and the persistent motion rig.
    if (!this.ready && this.viewport) this.fit();
    this.publishDiagnostics();
  }

  private updateBounds() {
    if (!this.dimensions) return;
    const s = this.dimensions, radius = Math.hypot(s.width, s.height, s.thickness) / 2;
    const vertical = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const angle = Math.min(vertical, Math.atan(Math.tan(vertical) * this.camera.aspect));
    this.fitDistance = radius / Math.sin(angle) * 1.08;
    this.camera.near = Math.max(.01, radius / 1000); this.camera.far = this.fitDistance * 40;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = radius * 1.2; this.controls.maxDistance = Math.max(radius * 8, this.fitDistance * 2);
    this.onLimits?.({ min: Math.ceil(this.fitDistance / this.controls.maxDistance * 100), max: Math.floor(this.fitDistance / this.controls.minDistance * 100) });
  }

  fit() {
    if (!this.dimensions || !this.viewport) return;
    this.updateBounds();
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(.12, .13, 1).normalize().multiplyScalar(this.fitDistance);
    this.controls.update(); this.ready = true; this.reportZoom(); this.publishDiagnostics();
  }

  private percent() { return this.ready ? Math.round(this.fitDistance / this.camera.position.distanceTo(this.controls.target) * 100) : 100; }
  private reportZoom = () => {
    const percent = this.percent();
    if (percent !== this.lastPercent) { this.lastPercent = percent; this.onZoom(percent); }
  };
  setZoom(percent: number) {
    if (!this.ready || !Number.isFinite(percent) || percent <= 0) return;
    const distance = THREE.MathUtils.clamp(this.fitDistance * 100 / percent, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.sub(this.controls.target).normalize().multiplyScalar(distance).add(this.controls.target);
    this.controls.update(); this.reportZoom(); this.publishDiagnostics();
  }
  zoom(factor: number) { if (Number.isFinite(factor) && factor > 0) this.setZoom(this.percent() / factor); }
  setActive(active: boolean) { this.active = active; this.controls.enabled = active; }

  private motionChanged = () => {
    this.controls.enableDamping = !this.motion.matches;
    this.springX = this.springY = this.velocityX = this.velocityY = 0;
    this.rig.rotation.set(0, 0, 0); this.rig.position.set(0, 0, 0); this.publishDiagnostics();
  };
  private pointerDown = (event: PointerEvent) => { this.dragging = true; this.dragX = event.clientX; this.dragY = event.clientY; };
  private pointerMove = (event: PointerEvent) => {
    if (this.dragging && !this.motion.matches) {
      this.springX += THREE.MathUtils.clamp((event.clientY - this.dragY) * .0006, -.025, .025);
      this.springY += THREE.MathUtils.clamp((event.clientX - this.dragX) * .0006, -.025, .025);
      this.dragX = event.clientX; this.dragY = event.clientY;
    }
  };
  private pointerUp = () => { this.dragging = false; };

  private animate = (now: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const dt = this.previousTime ? Math.min((now - this.previousTime) / 1000, .05) : 0;
    this.previousTime = now;
    if (!this.active || document.visibilityState === 'hidden') return;
    if (dt) this.maxStepMs = Math.max(this.maxStepMs, dt * 1000);
    if (!this.motion.matches) {
      this.time += dt;
      const x = springStep(this.springX, this.velocityX, 0, dt), y = springStep(this.springY, this.velocityY, 0, dt);
      this.springX = x.value; this.velocityX = x.velocity; this.springY = y.value; this.velocityY = y.velocity;
      this.rig.rotation.set(this.springX + Math.sin(this.time * .61) * .004, this.springY + Math.sin(this.time * .83) * .005, 0);
    }
    this.controls.update(); this.renderer.render(this.scene, this.camera); this.renders++;
  };

  diagnostics(): PreviewDiagnostics {
    return { camera: this.camera.position.toArray(), target: this.controls.target.toArray(), zoom: this.percent(),
      geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs?.length ?? 0, rebuilds: this.rebuilds, renders: this.renders,
      maxStepMs: this.maxStepMs, reducedMotion: this.motion.matches };
  }
  private publishDiagnostics() { if (!this.disposed) this.host.dataset.previewDiagnostics = JSON.stringify(this.diagnostics()); }
  private clear() {
    for (const child of [...this.content.children]) { if (child instanceof THREE.Mesh) child.geometry.dispose(); this.content.remove(child); }
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); clearInterval(this.diagnosticsTimer); this.observer.disconnect();
    this.controls.removeEventListener('change', this.reportZoom); this.controls.dispose();
    this.motion.removeEventListener('change', this.motionChanged);
    this.host.removeEventListener('pointerdown', this.pointerDown); this.host.removeEventListener('pointermove', this.pointerMove);
    this.host.removeEventListener('pointerup', this.pointerUp); this.host.removeEventListener('pointercancel', this.pointerUp);
    this.host.removeEventListener('lostpointercapture', this.pointerUp);
    this.clear(); this.face.dispose(); this.edge.dispose(); this.engraving.dispose(); this.texture.dispose(); this.environment.dispose();
    this.renderer.dispose(); this.renderer.domElement.remove(); delete this.host.dataset.previewDiagnostics;
  }
}
