import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {geometryFromPreview,type PreviewMeshData} from './geometry.js';
import {assemblyFrame} from './assembly.js';
import {materialSurfaces} from '../material-surfaces.js';
import {PreviewMaterialLibrary,plywoodEdgeTexture} from './materials.js';

/** Scoped access for display tools. The stage owns camera, renderer and navigation.
 * Extensions own only the objects/resources they add; dispose them in dispose(). */
export type PreviewStageContext = {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; canvas: HTMLCanvasElement;
  navigation: {
    target: () => THREE.Vector3;
    focus: (point: THREE.Vector3) => void;
    setEnabled: (enabled: boolean) => void;
    setPanEnabled: (enabled: boolean) => void;
    setMotionEnabled: (enabled: boolean) => void;
  };
  prepare: (object: THREE.Object3D, current: () => boolean) => Promise<boolean>;
};
export type PreviewStageExtension = {
  beforeRender?: () => void;
  /** Optional display pass, using the shared renderer. Restore any renderer state you change. */
  render?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
  resize?: (width: number, height: number, pixelRatio: number) => void;
  dispose: () => void;
};
export type PreviewStageOptions = {up?:[number,number,number];direction?:[number,number,number];onFrame?:()=>void};
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
  private overlay = new THREE.Group();
  private environment: THREE.WebGLRenderTarget;
  private materialLibrary: PreviewMaterialLibrary;
  private edgeTexture = plywoodEdgeTexture();
  private appearanceRevision = 0;
  private face = new THREE.MeshStandardMaterial({ roughness: .8 });
  private edge = new THREE.MeshStandardMaterial({ color: '#66533b', roughness: .95 });
  private engraving = new THREE.MeshBasicMaterial({ color: '#553018', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  private observer: ResizeObserver;
  private motion = matchMedia('(prefers-reduced-motion: reduce)');
  private dimensions?: PreviewSize;
  private assemblyBounds?: THREE.Box3;
  private framingCenter = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
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
  private extension?: PreviewStageExtension;
  private navigationEnabled = true;
  private motionEnabled = true;
  private diagnosticsTimer: ReturnType<typeof setInterval>;

  constructor(private host: HTMLElement, private onZoom: (percent: number) => void, private onLimits?: (limits: { min: number; max: number }) => void, private options:PreviewStageOptions = {}) {
    if(options.up)this.camera.up.fromArray(options.up).normalize();
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
    this.rig.add(this.content, this.overlay);
    this.content.scale.y = this.overlay.scale.y = -1;
    const key = new THREE.DirectionalLight('#ffffff', 2);
    key.position.set(-120, 180, 300); this.scene.add(key);
    this.materialLibrary = new PreviewMaterialLibrary(this.renderer.capabilities.getMaxAnisotropy());
    this.setAppearance({material:'pine',color:'#d1b98f'});
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
      this.extension?.resize?.(width, height, this.renderer.getPixelRatio());
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
      this.updateBounds();
      if (!this.ready && (this.dimensions || this.assemblyBounds)) this.fit();
      else if (this.ready) this.setZoom(percent);
      this.publishDiagnostics();
    });
    this.observer.observe(host);
    // DOM diagnostics allow browser checks without reaching into Vue/three private state.
    this.diagnosticsTimer = setInterval(() => this.publishDiagnostics(), 1000);
    this.animate(0);
  }

  /** Replacing an extension first releases its tools; the returned disposer is idempotent. */
  installExtension(setup: (context: PreviewStageContext) => PreviewStageExtension) {
    if (this.disposed) throw new Error('PreviewStage is disposed');
    this.releaseExtension();
    const extension = setup({scene: this.scene, camera: this.camera, canvas: this.renderer.domElement,
      navigation: {
        target: () => this.controls.target.clone(),
        focus: point => {
          if (![point.x, point.y, point.z].every(Number.isFinite)) return;
          this.drainNavigation();
          this.camera.position.add(point.clone().sub(this.controls.target));
          this.controls.target.copy(point); this.controls.update(); this.reportZoom();
        },
        setEnabled: enabled => this.setNavigationEnabled(enabled),
        setPanEnabled: enabled => { this.controls.enablePan = enabled; },
        setMotionEnabled: enabled => { this.motionEnabled = enabled; if (!enabled) this.resetMotion(); },
      },
      prepare: async (object, current) => {
        const active = () => !this.disposed && current() && !this.renderer.getContext().isContextLost();
        if (!active()) return false;
        let timer: ReturnType<typeof setInterval> | undefined;
        try {
          await Promise.race([this.renderer.compileAsync(object, this.camera, this.scene),
            new Promise<void>(resolve => { timer = setInterval(() => { if (!active()) resolve(); }, 8); })]);
          return active();
        } finally { if (timer !== undefined) clearInterval(timer); }
      },
    });
    this.extension = extension;
    const {width, height} = this.host.getBoundingClientRect();
    if (width > 0 && height > 0) extension.resize?.(width, height, this.renderer.getPixelRatio());
    return () => { if (this.extension === extension) this.releaseExtension(); };
  }
  private releaseExtension() {
    const extension = this.extension; this.extension = undefined;
    try { extension?.dispose(); } finally {
      this.setNavigationEnabled(true); this.controls.enablePan = true; this.motionEnabled = true; this.resetMotion();
    }
  }
  private drainNavigation() {
    const position = this.camera.position.clone(), target = this.controls.target.clone(), damping = this.controls.enableDamping;
    this.controls.enableDamping = false; this.controls.update();
    this.camera.position.copy(position); this.controls.target.copy(target); this.controls.update();
    this.controls.enableDamping = damping;
  }
  private setNavigationEnabled(enabled: boolean) {
    if (this.navigationEnabled === enabled) return;
    this.drainNavigation(); this.navigationEnabled = enabled;
    if (enabled) this.controls.connect(this.renderer.domElement); else this.controls.disconnect();
    this.controls.enabled = this.active && enabled;
    this.renderer.domElement.style.touchAction = 'none'; this.pointerUp(); this.resetMotion();
  }
  private resetMotion() {
    this.springX = this.springY = this.velocityX = this.velocityY = 0;
    this.rig.rotation.set(0, 0, 0); this.rig.position.set(0, 0, 0);
  }

  setAppearance(appearance: PreviewAppearance) {
    if (this.disposed) return;
    const revision = ++this.appearanceRevision;
    const solid = appearance.material === 'solid';
    const kind = appearance.material === 'walnut' ? 'walnut' : 'pine', surface = materialSurfaces[kind];
    this.face.color.set(solid ? appearance.color : surface.fallback);
    this.face.map = this.face.bumpMap = this.face.normalMap = this.face.roughnessMap = null;
    this.face.roughness = solid ? .45 : .95; this.face.needsUpdate = true;
    this.edge.map = solid ? null : this.edgeTexture;
    this.edge.color.set(solid ? appearance.color : '#ffffff').multiplyScalar(solid ? .7 : 1);
    this.edge.needsUpdate = true;
    if (solid) return;
    const maps = this.materialLibrary.get(kind);
    void maps.ready.then(ready => {
      // A late image decode must not replace a newer material or revive a disposed stage.
      if (!ready || this.disposed || revision !== this.appearanceRevision) return;
      this.face.color.set('#ffffff'); this.face.map = maps.color;
      this.face.normalMap = maps.normal; this.face.normalScale.set(surface.normalScale, surface.normalScale);
      this.face.roughnessMap = maps.roughness; this.face.needsUpdate = true;
    });
  }

  setContent(meshes: readonly PreviewMeshData[], size: PreviewSize) {
    if (![size.width, size.height, size.thickness].every(x => Number.isFinite(x) && x > 0)) return;
    if(this.assemblyBounds)this.overlay.clear();
    this.assemblyBounds=undefined;
    this.content.scale.y=this.overlay.scale.y=-1;
    this.clear(); this.dimensions = { ...size }; this.rebuilds++;
    for (const data of meshes) {
      const geometry = geometryFromPreview(data);
      this.content.add(new THREE.Mesh(geometry, data.engraved ? this.engraving : [this.face, this.edge]));
    }
    this.content.position.set(-size.width / 2, size.height / 2, 0);
    this.overlay.position.copy(this.content.position);
    // Rebuild only the content: preserve camera, controls, pan, and the persistent motion rig.
    if (!this.ready && this.viewport) this.fit();
    this.publishDiagnostics();
  }

  /** Consumer-owned objects in SVG millimetres (Y down), sharing the persistent motion rig.
   * Replacing/unmounting only detaches them; the consumer disposes its own resources. */
  setOverlay(object: THREE.Object3D | null) {
    this.overlay.clear();
    if (object) this.overlay.add(object);
  }

  /** Consumer-owned world-space assembly. Only its reference/bounds change; camera and rig persist. */
  setAssembly(object:THREE.Object3D,bounds:THREE.Box3){
    assemblyFrame(bounds,this.camera.aspect,this.camera.fov,this.camera.up,new THREE.Vector3(...(this.options.direction??[.12,.13,1])));
    this.clear();this.dimensions=undefined;this.assemblyBounds=bounds.clone();this.rebuilds++;
    this.overlay.clear();this.overlay.scale.set(1,1,1);this.overlay.position.set(0,0,0);this.overlay.add(object);
    if(!this.ready&&this.viewport)this.fit();this.publishDiagnostics();
  }
  /** Shared appearance materials may be referenced by consumer meshes, never disposed by them. */
  get materials(){return {face:this.face,edge:this.edge} as const;}
  project(point:THREE.Vector3,relativeTo?:THREE.Object3D){
    if(!this.ready)return undefined;
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld();
    const p=point.clone();if(relativeTo)p.applyMatrix4(relativeTo.matrixWorld);p.project(this.camera);
    const rect=this.host.getBoundingClientRect();return {x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2,depth:p.z};
  }
  raycast(clientX:number,clientY:number,objects:THREE.Object3D[],recursive=false){
    if(!this.ready)return [];
    const rect=this.renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return [];
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
    return this.raycaster.intersectObjects(objects,recursive);
  }

  private updateBounds() {
    if(this.assemblyBounds){
      const frame=assemblyFrame(this.assemblyBounds,this.camera.aspect,this.camera.fov,this.camera.up,new THREE.Vector3(...(this.options.direction??[.12,.13,1])));
      this.framingCenter.copy(frame.center);this.fitDistance=frame.distance;
      this.camera.near=Math.max(.01,frame.radius/1000);this.camera.far=this.fitDistance*40;this.camera.updateProjectionMatrix();
      this.controls.minDistance=frame.radius*1.2;this.controls.maxDistance=Math.max(frame.radius*8,this.fitDistance*2);
      this.onLimits?.({min:Math.ceil(this.fitDistance/this.controls.maxDistance*100),max:Math.floor(this.fitDistance/this.controls.minDistance*100)});return;
    }
    if (!this.dimensions) return;
    this.framingCenter.set(0,0,0);
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
    if ((!this.dimensions&&!this.assemblyBounds) || !this.viewport) return;
    this.drainNavigation(); this.resetMotion();
    this.updateBounds();
    this.controls.target.copy(this.framingCenter);
    this.camera.position.fromArray(this.options.direction??[.12,.13,1]).normalize().multiplyScalar(this.fitDistance).add(this.framingCenter);
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
  setActive(active: boolean) { this.active = active; this.controls.enabled = active && this.navigationEnabled; }

  private motionChanged = () => {
    this.controls.enableDamping = !this.motion.matches;
    this.springX = this.springY = this.velocityX = this.velocityY = 0;
    this.rig.rotation.set(0, 0, 0); this.rig.position.set(0, 0, 0); this.publishDiagnostics();
  };
  private pointerDown = (event: PointerEvent) => { this.dragging = true; this.dragX = event.clientX; this.dragY = event.clientY; };
  private pointerMove = (event: PointerEvent) => {
    if (this.dragging && this.navigationEnabled && this.motionEnabled && !this.motion.matches) {
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
    if (this.motionEnabled && !this.motion.matches) {
      this.time += dt;
      const x = springStep(this.springX, this.velocityX, 0, dt), y = springStep(this.springY, this.velocityY, 0, dt);
      this.springX = x.value; this.velocityX = x.velocity; this.springY = y.value; this.velocityY = y.velocity;
      this.rig.rotation.set(this.springX + Math.sin(this.time * .61) * .004, this.springY + Math.sin(this.time * .83) * .005, 0);
    }
    if (this.navigationEnabled) this.controls.update();
    this.extension?.beforeRender?.();
    if (this.extension?.render) this.extension.render(this.renderer, this.scene, this.camera);
    else this.renderer.render(this.scene, this.camera);
    this.renders++;this.options.onFrame?.();
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
    this.releaseExtension();
    this.controls.removeEventListener('change', this.reportZoom); this.controls.dispose();
    this.motion.removeEventListener('change', this.motionChanged);
    this.host.removeEventListener('pointerdown', this.pointerDown); this.host.removeEventListener('pointermove', this.pointerMove);
    this.host.removeEventListener('pointerup', this.pointerUp); this.host.removeEventListener('pointercancel', this.pointerUp);
    this.host.removeEventListener('lostpointercapture', this.pointerUp);
    this.overlay.clear(); this.clear(); this.face.dispose(); this.edge.dispose(); this.edgeTexture.dispose(); this.engraving.dispose(); this.materialLibrary.dispose(); this.environment.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); delete this.host.dataset.previewDiagnostics;
  }
}
