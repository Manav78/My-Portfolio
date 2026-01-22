  // --- AUDIO SYSTEM ---
        let audioCtx, audioEnabled = false;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported");
        }

        function playTone(freq, type, duration, vol = 0.1) {
            if (!audioEnabled || !audioCtx) return;
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(vol, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch (e) { }
        }

        const sfx = {
            hover: () => playTone(800, 'sine', 0.1, 0.05),
            click: () => playTone(300, 'square', 0.2, 0.05),
            open: () => {
                playTone(200, 'sine', 0.5, 0.1);
                setTimeout(() => playTone(400, 'sine', 0.5, 0.1), 100);
            }
        };

        // --- GLOBAL VARIABLES ---
        let scene, camera, renderer;
        let bitGroup, bitMesh, coreMesh, byteGroup, byteMesh;
        let stars;

        // --- 3D INITIALIZATION ---
        function init3D() {
            if (typeof THREE === 'undefined') {
                setTimeout(init3D, 100);
                return;
            }

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050510);
            scene.fog = new THREE.FogExp2(0x050510, 0.02);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);

            const container = document.getElementById('canvas-container');
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const pLight = new THREE.PointLight(0x00f3ff, 1, 50);
            pLight.position.set(5, 5, 5);
            scene.add(pLight);

            bitGroup = new THREE.Group();
            const bodyGeo = new THREE.IcosahedronGeometry(0.3, 1);
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x00f3ff, wireframe: true, emissive: 0x00f3ff, emissiveIntensity: 0.2 });
            bitMesh = new THREE.Mesh(bodyGeo, bodyMat);
            coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            bitGroup.add(bitMesh, coreMesh);

            byteGroup = new THREE.Group();
            const byteGeo = new THREE.TetrahedronGeometry(0.1);
            const byteMat = new THREE.MeshBasicMaterial({ color: 0xbc13fe });
            byteMesh = new THREE.Mesh(byteGeo, byteMat);
            byteGroup.add(byteMesh);
            bitGroup.add(byteGroup);
            scene.add(bitGroup);
            bitGroup.position.set(2, 0, -3);

            // Coords for islands (must match scroll logic)
            // home: 0, 0, 0 -> Adjusted to -3, 0, 0 for visibility
            // skills: 12, 4, -10
            // experience: -8, 10, -10 (NEW)
            // projects: -12, -4, -12
            // games: 0, 12, -15
            // certificates: -5, 8, -8
            // about: 0, -12, -8

            createIsland(12, 4, -10, 'cube'); // Skills
            createIsland(-8, 10, -10, 'cube'); // Experience (NEW)
            createIsland(-12, -4, -12, 'cube'); // Projects
            createIsland(0, 12, -15, 'sphere'); // Games
            createIsland(-5, 8, -8, 'cube'); // Certs
            createIsland(0, -12, -8, 'sphere'); // About

            const starsGeo = new THREE.BufferGeometry();
            const starsPos = [];
            for (let i = 0; i < 3000; i++) {
                starsPos.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
            }
            starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
            stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 }));
            scene.add(stars);

            animate();

            initScrollObserver();
        }

        function createIsland(x, y, z, type) {
            const group = new THREE.Group();
            group.position.set(x, y, z);
            const geo = type === 'cube' ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.6, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.3 });
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);
            for (let i = 0; i < 3; i++) {
                const bit = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x00f3ff }));
                bit.position.set((Math.random() - .5) * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 2);
                group.add(bit);
            }
            scene.add(group);
            return group;
        }

        // --- ANIMATION ---
        const clock = new THREE.Clock();
        let mouse = { x: 0, y: 0 };

        function animate() {
            requestAnimationFrame(animate);

            if (!scene || !camera || !renderer) return;

            const t = clock.getElapsedTime();

            if (bitGroup && bitMesh && byteGroup && byteMesh) {
                bitGroup.position.y += Math.sin(t * 1.5) * 0.003;
                bitMesh.rotation.x += 0.01; bitMesh.rotation.y += 0.01;
                byteGroup.position.x = Math.cos(t * 3) * 0.8;
                byteGroup.position.z = Math.sin(t * 3) * 0.8;
                byteGroup.position.y = Math.sin(t * 5) * 0.2;
                byteMesh.rotation.x += 0.05;
            }

            camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.05;
            if (stars) stars.rotation.y += 0.0002;

            renderer.render(scene, camera);
        }

        // --- SCROLL LOGIC ---
        function initScrollObserver() {
            const coords = {
                home: { x: -3, y: 0, z: 0 },
                skills: { x: 12, y: 4, z: -10 },
                experience: { x: -8, y: 10, z: -10 },
                projects: { x: -12, y: -4, z: -12 },
                games: { x: 0, y: 12, z: -15 },
                certificates: { x: -5, y: 8, z: -8 },
                about: { x: 0, y: -12, z: -8 }
            };

            const dialogues = {
                home: "Welcome back to the core. Scroll to explore.",
                skills: "Scanning database... Java proficiency detected.",
                experience: "Accessing employment history logs...",
                projects: "Accessing project archives...",
                games: "Recreation protocols initiated.",
                certificates: "Verifying credentials... Approved.",
                about: "Retrieving bio-data..."
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        const content = entry.target.querySelector('.section-content');

                        if (content) content.classList.add('visible');

                        const p = coords[id] || { x: 0, y: 0, z: 0 };

                        if (typeof gsap !== 'undefined') {
                            gsap.to(camera.position, { x: p.x, y: p.y, z: p.z, duration: 1.5, ease: "power2.inOut" });
                            if (bitGroup) gsap.to(bitGroup.position, { x: p.x + 2.5, y: p.y + 0.5, z: p.z - 4, duration: 1.2, ease: "power2.inOut" });
                        }

                        document.getElementById('dialogue-text').innerText = dialogues[id];

                        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                        const navBtn = document.querySelector(`.nav-btn[onclick="scrollToSection('${id}')"]`);
                        if (navBtn) navBtn.classList.add('active');
                    }
                });
            }, { threshold: 0.2 }); // LOWERED THRESHOLD FOR BETTER VISIBILITY

            document.querySelectorAll('section').forEach(section => {
                observer.observe(section);
            });
        }

        // --- EVENTS ---
        window.scrollToSection = (id) => {
            sfx.click();
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
            document.querySelector('.nav-links').classList.remove('mobile-active');
        };

        document.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            const cursor = document.getElementById('cursor');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            const eyes = document.querySelectorAll('.eye');
            eyes.forEach(eye => {
                const pupil = eye.querySelector('.pupil');
                const eyeRect = eye.getBoundingClientRect();
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;
                const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
                const distance = Math.min(eyeRect.width / 4, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY));
                const pupilX = Math.cos(angle) * distance;
                const pupilY = Math.sin(angle) * distance;
                pupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
            });
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            }
        });

        document.querySelectorAll('.hover-trigger').forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.getElementById('cursor').classList.add('hover');
                sfx.hover();
            });
            el.addEventListener('mouseleave', () => document.getElementById('cursor').classList.remove('hover'));
        });

        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('mobile-active');
            sfx.click();
        });

        // --- SYSTEM INIT ---
        function initSystem() {
            if (window.systemInitialized) return;
            window.systemInitialized = true;

            const loader = document.getElementById('loader');
            const btn = document.getElementById('start-btn');
            const ring = document.querySelector('.loader-ring');
            const txt = document.querySelector('.loader-text');

            if (ring) ring.style.display = 'none';
            if (txt) txt.innerText = "SYSTEM READY";
            if (btn) btn.style.display = 'block';

            if (btn) {
                btn.addEventListener('click', () => {
                    if (audioCtx) {
                        try {
                            audioCtx.resume().then(() => { audioEnabled = true; sfx.open(); }).catch(() => { });
                        } catch (e) { }
                    }
                    if (loader) {
                        loader.style.opacity = 0;
                        setTimeout(() => loader.remove(), 1000);
                    }
                    if (camera && typeof gsap !== 'undefined') {
                        camera.position.z = 10;
                        gsap.to(camera.position, { z: 0, duration: 2, ease: "power2.out" });
                    }
                });
            }
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(initSystem, 500);
            setTimeout(init3D, 100);
        } else {
            window.addEventListener('load', () => {
                initSystem();
                init3D();
            });
        }

        setTimeout(initSystem, 3000);

        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
            }
        });