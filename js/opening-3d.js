/**
 * Opening3D — "Dua Dunia, Satu Cinta"
 * 3D envelope scene: Makkah (Islamic) ↔ Sunda (Bandung) transition
 */
(function (global) {
  'use strict';

  const COLORS = {
    gold: 0xc4a882,
    goldLight: 0xe8d5b5,
    sage: 0x8b9a7e,
    sageDark: 0x6b7a5e,
    cream: 0xf7f5f0,
    janur: 0xd4c44a,
    janurGreen: 0x9aab3a,
    melati: 0xfffef5,
    kaaba: 0x1a1a1a,
    earth: 0x8b7355,
  };

  class Opening3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.isMobile = window.innerWidth < 768;
      this.isSmallScreen = window.innerWidth < 480;
      this.disposed = false;
      this.isOpening = false;
      this.openProgress = 0;
      this.clock = null;
      this.rafId = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.groups = { islamic: null, sunda: null, shared: null };
      this.elements = [];

      if (this.reducedMotion || !this._checkWebGL()) {
        canvas.classList.add('canvas-3d--fallback');
        return;
      }

      this._init();
    }

    _checkWebGL() {
      try {
        const test = document.createElement('canvas');
        return !!(test.getContext('webgl') || test.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    }

    _init() {
      const THREE = global.THREE;
      if (!THREE) return;

      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: !this.isMobile,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(w, h, false);
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      this.camera.position.set(0, 0.5, 6);
      this.camera.lookAt(0, 0, 0);

      this._addLights();
      this._buildIslamicGroup();
      this._buildSundaGroup();
      this._buildSharedElements();

      this.clock = new THREE.Clock();
      this._animate = this._animate.bind(this);
      this._onResize = this._onResize.bind(this);
      window.addEventListener('resize', this._onResize);
      this.rafId = requestAnimationFrame(this._animate);
    }

    _addLights() {
      const THREE = global.THREE;
      const ambient = new THREE.AmbientLight(0xfff8f0, 0.7);
      const key = new THREE.DirectionalLight(0xffffff, 0.8);
      key.position.set(3, 5, 4);
      const fill = new THREE.DirectionalLight(COLORS.gold, 0.35);
      fill.position.set(-4, 2, 2);
      const rim = new THREE.PointLight(COLORS.sage, 0.4, 20);
      rim.position.set(0, -2, 3);
      this.scene.add(ambient, key, fill, rim);
    }

    _goldMaterial(opacity = 1, wireframe = false) {
      const THREE = global.THREE;
      return new THREE.MeshStandardMaterial({
        color: COLORS.gold,
        metalness: 0.65,
        roughness: 0.3,
        transparent: opacity < 1,
        opacity,
        wireframe,
      });
    }

    _buildIslamicGroup() {
      const THREE = global.THREE;
      const group = new THREE.Group();
      group.position.set(-1.8, 0, 0);

      // Golden arch (ExtrudeGeometry)
      const archShape = new THREE.Shape();
      archShape.moveTo(-0.8, 0);
      archShape.lineTo(-0.8, 1.2);
      archShape.quadraticCurveTo(0, 2.2, 0.8, 1.2);
      archShape.lineTo(0.8, 0);
      archShape.lineTo(-0.8, 0);
      const archGeo = new THREE.ExtrudeGeometry(archShape, {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
      });
      const arch = new THREE.Mesh(archGeo, this._goldMaterial(0.85));
      arch.position.set(0, -0.6, 0);
      group.add(arch);
      this.elements.push({ mesh: arch, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.3 });

      // Dome silhouette
      const domeGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this._goldMaterial(0.7));
      dome.position.set(0, 1.5, -0.1);
      group.add(dome);
      this.elements.push({ mesh: dome, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.2 });

      // Crescent
      const crescentGroup = new THREE.Group();
      const torusGeo = new THREE.TorusGeometry(0.35, 0.06, 8, 24, Math.PI * 1.3);
      const crescent = new THREE.Mesh(torusGeo, this._goldMaterial());
      crescent.rotation.z = -0.5;
      crescentGroup.add(crescent);
      const crescentFill = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshStandardMaterial({ color: COLORS.cream, metalness: 0.1, roughness: 0.9 })
      );
      crescentFill.position.set(0.12, 0.05, 0.05);
      crescentGroup.add(crescentFill);
      crescentGroup.position.set(0.5, 2.2, 0.3);
      group.add(crescentGroup);
      this.elements.push({ mesh: crescentGroup, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.5 });

      // Arabesque rings (torus knots)
      const ringCount = this.isMobile ? 2 : 3;
      for (let i = 0; i < ringCount; i++) {
        const knot = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.25 + i * 0.08, 0.025, 64, 8, 2, 3),
          this._goldMaterial(0.6, true)
        );
        knot.position.set(-0.6 + i * 0.5, 0.8 + i * 0.4, 0.5 + i * 0.2);
        knot.rotation.set(i * 0.4, i * 0.6, 0);
        group.add(knot);
        this.elements.push({ mesh: knot, baseRot: { x: i * 0.4, y: i * 0.6, z: 0 }, drift: 0.4 + i * 0.1 });
      }

      // Star polyhedron
      const star = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.2, 0),
        this._goldMaterial(0.9)
      );
      star.position.set(-0.8, 1.8, 0.4);
      group.add(star);
      this.elements.push({ mesh: star, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.8 });

      // Mashrabiya lattice plane
      const latticeGroup = new THREE.Group();
      const spacing = 0.15;
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const cell = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, 0.02),
            this._goldMaterial(0.5, true)
          );
          cell.position.set((x - 2) * spacing, (y - 2) * spacing, 0);
          latticeGroup.add(cell);
        }
      }
      latticeGroup.position.set(-1.2, 0.3, 0.6);
      latticeGroup.rotation.y = 0.4;
      group.add(latticeGroup);
      this.elements.push({ mesh: latticeGroup, baseRot: { x: 0, y: 0.4, z: 0 }, drift: 0.25 });

      this.groups.islamic = group;
      this.scene.add(group);
    }

    _buildSundaGroup() {
      const THREE = global.THREE;
      const group = new THREE.Group();
      group.position.set(1.8, 0, 0);

      // Rumah adat Sunda — low poly
      const houseGroup = new THREE.Group();

      const bodyGeo = new THREE.BoxGeometry(1.4, 0.9, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.earth, roughness: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.45;
      houseGroup.add(body);

      const roofGeo = new THREE.ConeGeometry(1.1, 0.5, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c4a3a, roughness: 0.7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 1.15;
      roof.rotation.y = Math.PI / 4;
      houseGroup.add(roof);

      // Nuwuh singkol — horn roof extensions
      [-1, 1].forEach((side) => {
        const hornGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
        const horn = new THREE.Mesh(hornGeo, roofMat);
        horn.position.set(side * 0.75, 1.35, 0);
        horn.rotation.z = side * 0.6;
        houseGroup.add(horn);
      });

      houseGroup.position.set(0, -0.3, 0);
      houseGroup.scale.set(0.9, 0.9, 0.9);
      group.add(houseGroup);
      this.elements.push({ mesh: houseGroup, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.2 });

      // Janur kuning arcs
      const janurCount = this.isMobile ? 3 : 5;
      for (let i = 0; i < janurCount; i++) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.8, 0.5 + i * 0.15, 0.3),
          new THREE.Vector3(0, 1.5 + i * 0.1, 0.8),
          new THREE.Vector3(0.8, 0.5 + i * 0.15, 0.3)
        );
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.03, 6, false);
        const janurMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? COLORS.janur : COLORS.janurGreen,
          roughness: 0.6,
        });
        const janur = new THREE.Mesh(tubeGeo, janurMat);
        group.add(janur);
        this.elements.push({ mesh: janur, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.3 + i * 0.05 });
      }

      // Melati garland (flower spheres)
      const melatiCount = this.isMobile ? 6 : 10;
      const melatiGroup = new THREE.Group();
      for (let i = 0; i < melatiCount; i++) {
        const t = i / (melatiCount - 1);
        const angle = t * Math.PI;
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshStandardMaterial({ color: COLORS.melati, roughness: 0.4, metalness: 0.1 })
        );
        flower.position.set(Math.cos(angle) * 0.7, 0.2 + Math.sin(angle) * 0.3, 0.5);
        melatiGroup.add(flower);
      }
      melatiGroup.position.set(0, 1.6, 0);
      group.add(melatiGroup);
      this.elements.push({ mesh: melatiGroup, baseRot: { x: 0, y: 0, z: 0 }, drift: 0.35 });

      // Wedding ring (cincin)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.025, 12, 32),
        this._goldMaterial()
      );
      ring.position.set(0.6, 2.0, 0.5);
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
      this.elements.push({ mesh: ring, baseRot: { x: Math.PI / 3, y: 0, z: 0 }, drift: 0.6 });

      this.groups.sunda = group;
      this.scene.add(group);
    }

    _buildSharedElements() {
      const THREE = global.THREE;
      const group = new THREE.Group();

      // Floating particles
      const count = this.isSmallScreen ? 8 : this.isMobile ? 12 : 40;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(
        particleGeo,
        new THREE.PointsMaterial({ color: COLORS.goldLight, size: 0.04, transparent: true, opacity: 0.6 })
      );
      group.add(particles);
      this.groups.shared = group;
      this.scene.add(group);
    }

    _animate() {
      if (this.disposed) return;

      const THREE = global.THREE;
      if (!THREE || !this.renderer) return;

      const t = this.clock.getElapsedTime();
      const beatIntensity = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--beat-intensity') || '0'
      );

      this.elements.forEach((el, i) => {
        const m = el.mesh;
        if (!m) return;
        const drift = el.drift || 0.3;
        m.rotation.y = el.baseRot.y + Math.sin(t * drift + i) * 0.15;
        m.rotation.x = el.baseRot.x + Math.cos(t * drift * 0.7 + i) * 0.08;
        const pulse = 1 + beatIntensity * 0.08;
        m.scale.setScalar(pulse);
      });

      if (this.isOpening) {
        this.openProgress = Math.min(1, this.openProgress + 0.018);
        const ease = 1 - Math.pow(1 - this.openProgress, 3);

        if (this.groups.islamic) {
          this.groups.islamic.position.x = -1.8 - ease * 4;
          this.groups.islamic.rotation.y = -ease * 0.8;
          this.groups.islamic.scale.setScalar(1 - ease * 0.3);
        }
        if (this.groups.sunda) {
          this.groups.sunda.position.x = 1.8 + ease * 4;
          this.groups.sunda.rotation.y = ease * 0.8;
          this.groups.sunda.scale.setScalar(1 - ease * 0.3);
        }

        this.camera.position.z = 6 + ease * 3;
        this.camera.position.y = 0.5 + ease * 0.5;

        if (this.openProgress >= 1) {
          setTimeout(() => this.dispose(), 400);
          return;
        }
      } else {
        this.camera.position.x = Math.sin(t * 0.15) * 0.15;
        this.camera.position.y = 0.5 + Math.sin(t * 0.2) * 0.08;
        this.camera.lookAt(0, 0.3, 0);
      }

      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(this._animate);
    }

    triggerOpen() {
      if (this.disposed || !this.renderer) return;
      this.isOpening = true;
    }

    _onResize() {
      if (this.disposed || !this.renderer) return;
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;

      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', this._onResize);

      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      }

      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss?.();
      }

      this.canvas.classList.add('canvas-3d--hidden');
    }
  }

  global.Opening3D = Opening3D;
})(window);
