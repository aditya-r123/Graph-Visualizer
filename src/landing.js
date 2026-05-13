import { inject } from '@vercel/analytics';
import * as auth from './auth.js';
import { mountLandingHeader, mountLandingAccountPanel } from './authUi.js';

// Initialize Vercel Analytics
inject();

// Bring auth state online before DOMContentLoaded so the header widget
// renders with the right state on first paint.
auth.init();

// Landing page animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Account UI: top-right widget + inline forms in the #account section.
    mountLandingHeader(document.getElementById('landingAccountHeader'));
    mountLandingAccountPanel(document.getElementById('landingAccountPanel'));

    // Animated background canvas
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    let time = 0;

    // Debounce function
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // Set canvas size
    function resizeCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        initParticles(); // Re-initialize particles on resize
    }
    
    // Animated particles with prominent connections
    let particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * bgCanvas.width;
            this.y = Math.random() * bgCanvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 3 + 2; // Increased radius
            this.baseHue = 240 + Math.random() * 100; // Indigo (240) to Red (340)
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
        }
        
        draw() {
            const hue = (this.baseHue + time * 10) % 360;
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            bgCtx.fillStyle = `hsla(${hue}, 80%, 70%, 0.8)`; // Brighter, more visible
            bgCtx.fill();
        }
    }
    
    // Function to initialize particles
    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Draw prominent connections between nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const opacity = 0.8 * (1 - distance / 150); // Increased opacity
                    
                    const hueI = (particles[i].baseHue + time * 10) % 360;
                    const hueJ = (particles[j].baseHue + time * 10) % 360;
                    const avgHue = (hueI + hueJ) / 2;

                    // Draw thicker, more prominent line
                    bgCtx.beginPath();
                    bgCtx.moveTo(particles[i].x, particles[i].y);
                    bgCtx.lineTo(particles[j].x, particles[j].y);
                    bgCtx.strokeStyle = `hsla(${avgHue}, 80%, 70%, ${opacity})`;
                    bgCtx.lineWidth = 3; // Increased line width
                    bgCtx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animateBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        time += 0.005;

        drawConnections();
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animateBg);
    }

    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 250));
    animateBg();

    // Demo canvas animation
    const demoCanvas = document.getElementById('demoCanvas');
    const demoCtx = demoCanvas.getContext('2d');
    
    function resizeDemoCanvas() {
        demoCanvas.width = demoCanvas.offsetWidth;
        demoCanvas.height = demoCanvas.offsetHeight;
    }
    resizeDemoCanvas();
    window.addEventListener('resize', resizeDemoCanvas);

    // Editor-faithful demo graph + BFS sweep (matches the actual editor's defaults)
    // Coordinates are normalized (0..1) so the layout adapts to the canvas size.
    const demoGraph = {
        vertices: [
            { id: 0, nx: 0.50, ny: 0.20, label: '1' },
            { id: 1, nx: 0.25, ny: 0.50, label: '2' },
            { id: 2, nx: 0.75, ny: 0.50, label: '3' },
            { id: 3, nx: 0.13, ny: 0.82, label: '4' },
            { id: 4, nx: 0.50, ny: 0.82, label: '5' },
            { id: 5, nx: 0.87, ny: 0.82, label: '6' }
        ],
        edges: [
            [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5]
        ]
    };

    const DEMO_COLORS = {
        vertexFill: '#1f2937',        // editor default
        vertexBorder: '#475569',      // editor default loaded
        vertexLabel: '#ffffff',
        edge: '#8b5cf6',              // editor default loaded
        visitedFill: '#10b981',       // editor BFS green
        visitedBorder: '#34d399',
        frontierGlow: 'rgba(16, 185, 129, 0.55)'
    };

    const bfsState = {
        visited: new Set(),
        frontier: new Set(),
        edgeVisited: new Set(),
        pendingStart: true,
        completedAt: null,
        nextTickAt: 0
    };
    const BFS_TICK_MS = 750;
    const BFS_HOLD_MS = 1800;

    function edgeKey(a, b) {
        return a < b ? `${a}-${b}` : `${b}-${a}`;
    }

    function resetBfs(now) {
        bfsState.visited.clear();
        bfsState.frontier.clear();
        bfsState.edgeVisited.clear();
        bfsState.pendingStart = true;
        bfsState.completedAt = null;
        bfsState.nextTickAt = now + 500;
    }

    function tickBfs(now) {
        if (bfsState.completedAt !== null) {
            if (now - bfsState.completedAt >= BFS_HOLD_MS) resetBfs(now);
            return;
        }
        if (now < bfsState.nextTickAt) return;

        if (bfsState.pendingStart) {
            bfsState.visited.add(0);
            bfsState.frontier = new Set([0]);
            bfsState.pendingStart = false;
            bfsState.nextTickAt = now + BFS_TICK_MS;
            return;
        }

        const nextFrontier = new Set();
        bfsState.frontier.forEach(v => {
            demoGraph.edges.forEach(([from, to]) => {
                const other = from === v ? to : (to === v ? from : null);
                if (other === null || bfsState.visited.has(other)) return;
                nextFrontier.add(other);
                bfsState.visited.add(other);
                bfsState.edgeVisited.add(edgeKey(from, to));
            });
        });
        bfsState.frontier = nextFrontier;

        if (nextFrontier.size === 0) {
            bfsState.completedAt = now;
        } else {
            bfsState.nextTickAt = now + BFS_TICK_MS;
        }
    }

    function drawDemoGraph(now) {
        if (!demoCanvas.offsetParent) {
            requestAnimationFrame(drawDemoGraph);
            return;
        }

        const w = demoCanvas.width;
        const h = demoCanvas.height;
        demoCtx.clearRect(0, 0, w, h);
        tickBfs(now || performance.now());

        const vertexRadius = Math.max(22, Math.min(30, w * 0.035));

        // edges first, under the vertices
        demoGraph.edges.forEach(([from, to]) => {
            const a = demoGraph.vertices[from];
            const b = demoGraph.vertices[to];
            const visited = bfsState.edgeVisited.has(edgeKey(from, to));
            demoCtx.beginPath();
            demoCtx.moveTo(a.nx * w, a.ny * h);
            demoCtx.lineTo(b.nx * w, b.ny * h);
            demoCtx.strokeStyle = visited ? DEMO_COLORS.visitedFill : DEMO_COLORS.edge;
            demoCtx.lineWidth = visited ? 3.5 : 2.5;
            demoCtx.globalAlpha = visited ? 1 : 0.85;
            demoCtx.stroke();
            demoCtx.globalAlpha = 1;
        });

        // vertices
        demoGraph.vertices.forEach(v => {
            const px = v.nx * w;
            const py = v.ny * h;
            const isVisited = bfsState.visited.has(v.id);
            const isFrontier = bfsState.frontier.has(v.id);

            if (isFrontier) {
                const glow = demoCtx.createRadialGradient(px, py, vertexRadius, px, py, vertexRadius + 14);
                glow.addColorStop(0, DEMO_COLORS.frontierGlow);
                glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
                demoCtx.beginPath();
                demoCtx.arc(px, py, vertexRadius + 14, 0, Math.PI * 2);
                demoCtx.fillStyle = glow;
                demoCtx.fill();
            }

            demoCtx.beginPath();
            demoCtx.arc(px, py, vertexRadius, 0, Math.PI * 2);
            demoCtx.fillStyle = isVisited ? DEMO_COLORS.visitedFill : DEMO_COLORS.vertexFill;
            demoCtx.fill();
            demoCtx.strokeStyle = isVisited ? DEMO_COLORS.visitedBorder : DEMO_COLORS.vertexBorder;
            demoCtx.lineWidth = 2;
            demoCtx.stroke();

            demoCtx.fillStyle = DEMO_COLORS.vertexLabel;
            demoCtx.font = `600 ${Math.round(vertexRadius * 0.6)}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
            demoCtx.textAlign = 'center';
            demoCtx.textBaseline = 'middle';
            demoCtx.fillText(v.label, px, py);
        });

        requestAnimationFrame(drawDemoGraph);
    }
    
    // Start demo animation when section is in view
    const demoSection = document.querySelector('.demo-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                drawDemoGraph();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    if (demoSection) {
        observer.observe(demoSection);
    }

    // Scroll animations with different animation types
    const animationClasses = ['.fade-in', '.slide-in-left', '.slide-in-right', '.scale-in'];
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Handle staggered children animations
                const staggerItems = entry.target.querySelectorAll('.stagger-item');
                staggerItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 100); // 100ms delay between each item
                });
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all animated elements
    animationClasses.forEach(className => {
        document.querySelectorAll(className).forEach(el => scrollObserver.observe(el));
    });
    
    // Dynamic scroll effects (Apple/Tesla style) - Bidirectional and proportional
    let ticking = false;
    let lastScrollY = window.scrollY;
    // bgCanvas already declared at the top
    
    function dynamicScrollHandler() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Hero parallax and fade effects - BIDIRECTIONAL
                const heroScrollProgress = Math.min(Math.max(scrollY / windowHeight, 0), 1);
                
                // Smooth parallax effect for hero elements
                document.querySelectorAll('.parallax-slow').forEach(el => {
                    const translateY = scrollY * 0.3;
                    const opacity = 1 - heroScrollProgress * 0.7;
                    el.style.transform = `translateY(${translateY}px)`;
                    el.style.opacity = Math.max(opacity, 0.1);
                });
                
                document.querySelectorAll('.parallax-fast').forEach(el => {
                    const translateY = scrollY * 0.5;
                    const scale = 1 - heroScrollProgress * 0.15;
                    const opacity = 1 - heroScrollProgress * 0.9;
                    el.style.transform = `translateY(${translateY}px) scale(${Math.max(scale, 0.85)})`;
                    el.style.opacity = Math.max(opacity, 0.1);
                });
                
                // Dim background smoothly based on scroll - BIDIRECTIONAL
                const bgOpacity = scrollY > 100 ? 0.2 : 0.4 - (scrollY / 100) * 0.2;
                bgCanvas.style.opacity = bgOpacity;

                // Fade out the scroll-down chevron as soon as the user starts scrolling
                const scrollIndicator = document.getElementById('scrollIndicator');
                if (scrollIndicator) {
                    const indicatorOpacity = Math.max(0, 0.75 - scrollY / 200);
                    scrollIndicator.style.opacity = indicatorOpacity;
                    scrollIndicator.style.pointerEvents = indicatorOpacity < 0.1 ? 'none' : '';
                }
                
                // Progressive reveal - works both directions
                const threshold = windowHeight * 0.70;
                document.querySelectorAll('[class*="fade-in"], [class*="slide-in"], [class*="scale-in"]').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const shouldBeVisible = rect.top < threshold && rect.bottom > 0;
                    
                    if (shouldBeVisible && !el.classList.contains('visible')) {
                        el.classList.add('visible');
                    } else if (!shouldBeVisible && scrollDirection === 'up' && el.classList.contains('visible')) {
                        // Remove visible class when scrolling back up past threshold
                        if (rect.top > windowHeight * 0.9) {
                            el.classList.remove('visible');
                        }
                    }
                });
                
                // Dynamic scale and fade based on viewport position - CONTINUOUS
                document.querySelectorAll('.feature-card, .use-case, .step').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    
                    if (rect.top < windowHeight && rect.bottom > 0) {
                        const elementCenter = rect.top + rect.height / 2;
                        const viewportCenter = windowHeight / 2;
                        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
                        const maxDistance = windowHeight * 0.8;
                        
                        // Proximity factor (1 = at center, 0 = far away)
                        const proximityFactor = Math.max(0, 1 - distanceFromCenter / maxDistance);
                        
                        // Smooth scale (0.92 to 1.0)
                        const scale = 0.92 + (proximityFactor * 0.08);
                        const opacity = 0.5 + (proximityFactor * 0.5);
                        
                        el.style.transform = `scale(${scale}) translateZ(0)`;
                        el.style.opacity = opacity;
                    } else {
                        // Reset when out of viewport
                        el.style.transform = 'scale(0.9) translateZ(0)';
                        el.style.opacity = 0.3;
                    }
                });
                
                // Demo section zoom effect - BIDIRECTIONAL
                const demoSection = document.querySelector('.demo-section');
                if (demoSection) {
                    const demoRect = demoSection.getBoundingClientRect();
                    const demoVisual = demoSection.querySelector('.demo-visual');
                    
                    if (demoVisual && demoRect.top < windowHeight && demoRect.bottom > 0) {
                        // Progress from 0 (at bottom) to 1 (at top)
                        const demoProgress = Math.max(0, Math.min(1, 
                            (windowHeight - demoRect.top) / (windowHeight * 0.8)
                        ));
                        
                        const demoScale = 0.85 + (demoProgress * 0.15);
                        const demoOpacity = 0.4 + (demoProgress * 0.6);
                        
                        demoVisual.style.transform = `scale(${demoScale}) translateZ(0)`;
                        demoVisual.style.opacity = demoOpacity;
                    }
                }
                
                // Benefit rows - BIDIRECTIONAL slide and fade
                document.querySelectorAll('.benefit-row').forEach((row, index) => {
                    const rect = row.getBoundingClientRect();
                    const content = row.querySelector('.benefit-content');
                    const visual = row.querySelector('.benefit-visual');
                    
                    if (rect.top < windowHeight && rect.bottom > 0) {
                        // Calculate progress (0 to 1) as element enters viewport
                        const enterProgress = Math.max(0, Math.min(1, 
                            (windowHeight - rect.top) / (windowHeight * 0.6)
                        ));
                        
                        const isEven = index % 2 === 0;
                        const maxSlide = 50;
                        const slideAmount = maxSlide * (1 - enterProgress);
                        
                        if (content) {
                            const slideX = isEven ? -slideAmount : slideAmount;
                            content.style.transform = `translateX(${slideX}px) translateZ(0)`;
                            content.style.opacity = enterProgress;
                        }
                        if (visual) {
                            const slideX = isEven ? slideAmount : -slideAmount;
                            visual.style.transform = `translateX(${slideX}px) translateZ(0)`;
                            visual.style.opacity = enterProgress;
                        }
                    } else {
                        // Reset when out of viewport
                        if (content) {
                            content.style.opacity = 0;
                        }
                        if (visual) {
                            visual.style.opacity = 0;
                        }
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Throttled scroll handler for better performance
    window.addEventListener('scroll', dynamicScrollHandler, { passive: true });
    
    // Initial call and call on resize
    dynamicScrollHandler();
    window.addEventListener('resize', () => {
        requestAnimationFrame(dynamicScrollHandler);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#features') {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
