/**
 * Scene3D — site-wide decorative 3D layer
 * Islamic (Makkah) + Sundanese (Bandung) themed ornaments
 */
(function (global) {
  'use strict';

  const COLORS = {
    gold: 0xc4a882,
    goldLight: 0xe8d5b5,
    sage: 0x8b9a7e,
    kaaba: 0x1a1a18,
    janur: 0xd4c44a,
    melati: 0xfffef8,
  };

  const THEME_SECTIONS = {
    islamic: ['hero', 'countdown', 'couple', 'story', 'events'],
    sunda: ['location', 'rsvp', 'wishes', 'share'],
    neutral: ['gallery'],
  };

  class Scene3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.isMobile = window.innerWidth < 768;
      this.isSmallScreen = window.innerWidth < 480;
      this.disposed = false;
      this.isVisible = !document.hidden;
      this.isInView = true;
      this.currentTheme = 'islamic';
      this.scrollY = 0;
      this.beatIntensity = 0;

      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.clock = null;
      this.rafId = null;

      this.cornerOrnaments = [];
      this.themeGroups = { islamic: null, sunda: null };
      this.particles = null;

      if (this.reducedMotion || !this._checkWebGL()) {
        canvas.classList.add('canvas-3d--fallback');
        return;
      }

      this._init();
      this._bindEvents();
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

      const w = window.innerWidth;
      const h = window.innerHeight;
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
      this.camera = new THREE.OrthographicCamera(-w / 200, w / 200, h / 200, -h / 200, 0.1, 50);
      this.camera.position.z = 10;

      this._buildCornerOrnaments();
      this._buildIslamicTheme();
      this._buildSundaTheme();
      this._setThemeOpacity('islamic', 1);
      this._setThemeOpacity('sunda', 0.15);

      this.clock = new THREE.Clock();
      this._animate = this._animate.bind(this);
      this.rafId = requestAnimationFrame(this._animate);
    }

    _goldWireMaterial() {
      const THREE = global.THREE;
      return new THREE.MeshBasicMaterial({
        color: COLORS.gold,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
    }

    _buildCornerOrnaments() {
      const THREE = global.THREE;
      const corners = [
        { x: -1, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: -1, y: -1, z: 0 },
        { x: 1, y: -1, z: 0 },
      ];

      const size = this.isMobile ? 0.35 : 0.5;
      corners.forEach((pos, i) => {
        const geo = i % 2 === 0
          ? new THREE.OctahedronGeometry(size, 0)
          : new THREE.TorusKnotGeometry(size * 0.5, 0.03, 48, 8, 2, 3);
        const mesh = new THREE.Mesh(geo, this._goldWireMaterial());
        mesh.userData.corner = pos;
        mesh.userData.index = i;
        this.cornerOrnaments.push(mesh);
        this.scene.add(mesh);
      });
    }

    _buildIslamicTheme() {
      const THREE = global.THREE;
      const group = new THREE.Group();
      group.name = 'islamic';

      // Stylized Kaaba cube
      const kaaba = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.4),
        new THREE.MeshStandardMaterial({ color: COLORS.kaaba, metalness: 0.3, roughness: 0.7 })
      );
      kaaba.position.set(-2.5, 1.2, -1);
      group.add(kaaba);

      const kaabaBand = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.08, 0.42),
        new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 0.6, roughness: 0.3 })
      );
      kaabaBand.position.set(-2.5, 1.35, -1);
      group.add(kaabaBand);

      // Arabesque particles
      const count = this.isSmallScreen ? 10 : this.isMobile ? 16 : 40;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
        positions[i * 3 + 2] = -0.5 - Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pts = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: COLORS.goldLight, size: 0.06, transparent: true, opacity: 0.4 })
      );
      pts.name = 'arabesque-particles';
      group.add(pts);

      // Crescent ornament
      const crescent = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.05, 8, 32, Math.PI * 1.35),
        new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.45 })
      );
      crescent.position.set(2.2, 2.0, -0.4);
      crescent.rotation.z = -0.4;
      group.add(crescent);

      // Mihrab arch wireframe
      const archShape = new THREE.Shape();
      archShape.moveTo(-0.5, 0);
      archShape.lineTo(-0.5, 0.8);
      archShape.quadraticCurveTo(0, 1.4, 0.5, 0.8);
      archShape.lineTo(0.5, 0);
      const archGeo = new THREE.ExtrudeGeometry(archShape, { depth: 0.02, bevelEnabled: false });
      const arch = new THREE.Mesh(archGeo, new THREE.MeshBasicMaterial({
        color: COLORS.gold,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }));
      arch.position.set(-3.2, 0.5, -0.6);
      arch.scale.set(0.8, 0.8, 0.8);
      group.add(arch);

      // Floating star polyhedra
      const starCount = this.isSmallScreen ? 2 : this.isMobile ? 4 : 8;
      for (let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.1, 0),
          new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.5 })
        );
        star.position.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3,
          -0.3 - i * 0.2
        );
        star.userData.drift = 0.2 + Math.random() * 0.3;
        group.add(star);
      }

      this.themeGroups.islamic = group;
      this.scene.add(group);
    }

    _buildSundaTheme() {
      const THREE = global.THREE;
      const group = new THREE.Group();
      group.name = 'sunda';

      // Janur arcs
      const janurCount = this.isSmallScreen ? 1 : this.isMobile ? 2 : 4;
      for (let i = 0; i < janurCount; i++) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(2 + i * 0.3, -0.5, -0.5),
          new THREE.Vector3(2.5 + i * 0.2, 1.5, -0.3),
          new THREE.Vector3(3 + i * 0.3, -0.3, -0.5)
        );
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 16, 0.025, 6, false),
          new THREE.MeshBasicMaterial({ color: COLORS.janur, transparent: true, opacity: 0.45 })
        );
        group.add(tube);
      }

      // Melati clusters
      const clusterCount = this.isSmallScreen ? 2 : this.isMobile ? 3 : 6;
      for (let c = 0; c < clusterCount; c++) {
        const cluster = new THREE.Group();
        for (let f = 0; f < 5; f++) {
          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 6, 6),
            new THREE.MeshBasicMaterial({ color: COLORS.melati, transparent: true, opacity: 0.5 })
          );
          const a = (f / 5) * Math.PI * 2;
          flower.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
          cluster.add(flower);
        }
        cluster.position.set(
          -1.5 + c * 1.2,
          -1.2 + (c % 2) * 0.5,
          -0.4
        );
        cluster.userData.drift = 0.25 + c * 0.05;
        group.add(cluster);
      }

      this.themeGroups.sunda = group;
      this.scene.add(group);
    }

    _setThemeOpacity(theme, opacity) {
      const group = this.themeGroups[theme];
      if (!group) return;
      group.traverse((obj) => {
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (m.transparent !== undefined) {
              m.opacity = opacity * (m.userData?.baseOpacity ?? 0.5);
            }
          });
        }
      });
      group.visible = opacity > 0.05;
    }

    _detectTheme() {
      const vh = window.innerHeight;
      const center = this.scrollY + vh * 0.4;
      const sections = document.querySelectorAll('section[id]');

      let bestTheme = 'islamic';
      let bestDist = Infinity;

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        const secCenter = rect.top + this.scrollY + rect.height / 2;
        const dist = Math.abs(center - secCenter);
        const id = sec.id;

        let theme = 'neutral';
        if (THEME_SECTIONS.islamic.includes(id)) theme = 'islamic';
        else if (THEME_SECTIONS.sunda.includes(id)) theme = 'sunda';
        else if (THEME_SECTIONS.neutral.includes(id)) theme = 'neutral';

        if (dist < bestDist) {
          bestDist = dist;
          bestTheme = theme;
        }
      });

      return bestTheme;
    }

    _updateThemeBlend(theme) {
      const islamicOpacity = theme === 'islamic' ? 1 : theme === 'neutral' ? 0.5 : 0.15;
      const sundaOpacity = theme === 'sunda' ? 1 : theme === 'neutral' ? 0.4 : 0.15;

      if (this.themeGroups.islamic) {
        this.themeGroups.islamic.children.forEach((child) => {
          child.traverse?.((obj) => {
            if (obj.material && obj.material.transparent) {
              obj.material.opacity = islamicOpacity * 0.5;
            }
          });
          if (child.material?.transparent) child.material.opacity = islamicOpacity * 0.5;
        });
      }
      if (this.themeGroups.sunda) {
        this.themeGroups.sunda.children.forEach((child) => {
          if (child.material?.transparent) {
            child.material.opacity = sundaOpacity * 0.45;
          }
          child.children?.forEach((c) => {
            c.traverse?.((obj) => {
              if (obj.material?.transparent) obj.material.opacity = sundaOpacity * 0.5;
            });
          });
        });
      }
    }

    onBeat(isDownbeat) {
      this.beatPulse = isDownbeat ? 1 : 0.5;
    }

    _bindEvents() {
      this._onScroll = () => {
        this.scrollY = window.scrollY;
        this.currentTheme = this._detectTheme();
      };
      this._onResize = () => {
        if (!this.renderer) return;
        this.isMobile = window.innerWidth < 768;
        this.isSmallScreen = window.innerWidth < 480;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.left = -w / 200;
        this.camera.right = w / 200;
        this.camera.top = h / 200;
        this.camera.bottom = -h / 200;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
      };
      this._onVisibility = () => {
        this.isVisible = !document.hidden;
        if (this.isVisible && !this.rafId && !this.disposed) {
          this.rafId = requestAnimationFrame(this._animate);
        }
      };

      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize);
      document.addEventListener('visibilitychange', this._onVisibility);

      const main = document.getElementById('mainContent');
      if (main && 'IntersectionObserver' in window) {
        this._viewObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              this.isInView = entry.isIntersecting;
              if (this.isInView && this.isVisible && !this.rafId && !this.disposed) {
                this.rafId = requestAnimationFrame(this._animate);
              }
            });
          },
          { threshold: 0.05 }
        );
        this._viewObserver.observe(main);
      }

      global.addEventListener('beatengine:beat', (e) => {
        this.onBeat(e.detail?.isDownbeat);
      });

      this._onScroll();
    }

    _animate() {
      if (this.disposed) return;
      if (!this.isVisible || !this.isInView) {
        this.rafId = null;
        return;
      }

      const THREE = global.THREE;
      if (!THREE || !this.renderer) return;

      const t = this.clock.getElapsedTime();
      const parallax = this.scrollY * 0.0003;
      this.beatIntensity = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--beat-intensity') || '0'
      );

      const w = window.innerWidth;
      const h = window.innerHeight;

      this.cornerOrnaments.forEach((mesh, i) => {
        const pos = mesh.userData.corner;
        const margin = this.isMobile ? 0.15 : 0.08;
        mesh.position.x = pos.x * (w / 200 - margin);
        mesh.position.y = pos.y * (h / 200 - margin) - parallax * pos.y;
        mesh.rotation.x = t * 0.3 + i;
        mesh.rotation.y = t * 0.4 + i * 0.5;
        const pulse = 1 + this.beatIntensity * 0.12;
        mesh.scale.setScalar(pulse);
      });

      this._updateThemeBlend(this.currentTheme);

      if (this.themeGroups.islamic) {
        this.themeGroups.islamic.position.y = parallax * 0.5;
        this.themeGroups.islamic.rotation.z = Math.sin(t * 0.1) * 0.02;
        this.themeGroups.islamic.children.forEach((child, i) => {
          if (child.userData?.drift) {
            child.rotation.y = Math.sin(t * child.userData.drift + i) * 0.2;
          }
        });
      }

      if (this.themeGroups.sunda) {
        this.themeGroups.sunda.position.y = -parallax * 0.3;
        this.themeGroups.sunda.children.forEach((child) => {
          if (child.userData?.drift) {
            child.rotation.z = Math.sin(t * child.userData.drift) * 0.15;
          }
        });
      }

      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(this._animate);
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('visibilitychange', this._onVisibility);
      if (this._viewObserver) this._viewObserver.disconnect();

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
      }
    }
  }

  global.Scene3D = Scene3D;
})(window);
