// Landing page animations and interactions
document.addEventListener('DOMContentLoaded', () => {
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

    // Demo graph nodes
    const nodes = [
        { x: 150, y: 150, vx: 0, vy: 0, color: '#6366f1' },
        { x: 350, y: 100, vx: 0, vy: 0, color: '#8b5cf6' },
        { x: 550, y: 150, vx: 0, vy: 0, color: '#a855f7' },
        { x: 250, y: 300, vx: 0, vy: 0, color: '#ec4899' },
        { x: 450, y: 300, vx: 0, vy: 0, color: '#f472b6' },
    ];

    const edges = [
        [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4]
    ];

    const nodeRadius = 20;

    function drawDemoGraph() {
        if (!demoCanvas.offsetParent) return; // Skip if not visible
        
        demoCtx.clearRect(0, 0, demoCanvas.width, demoCanvas.height);
        
        // Update node positions with smooth animation
        nodes.forEach((node, i) => {
            const centerX = demoCanvas.width / 2;
            const centerY = demoCanvas.height / 2;
            const angle = (time + i * (Math.PI * 2 / nodes.length)) * 0.3;
            const radius = 120;
            
            node.x = centerX + Math.cos(angle) * radius;
            node.y = centerY + Math.sin(angle) * radius;
        });

        // Draw edges
        edges.forEach(([from, to]) => {
            demoCtx.beginPath();
            demoCtx.moveTo(nodes[from].x, nodes[from].y);
            demoCtx.lineTo(nodes[to].x, nodes[to].y);
            demoCtx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            demoCtx.lineWidth = 2;
            demoCtx.stroke();
        });

        // Draw nodes
        nodes.forEach((node, i) => {
            const pulse = Math.sin(time * 2 + i) * 3;
            
            // Glow effect
            demoCtx.beginPath();
            demoCtx.arc(node.x, node.y, nodeRadius + pulse + 10, 0, Math.PI * 2);
            const gradient = demoCtx.createRadialGradient(
                node.x, node.y, nodeRadius + pulse,
                node.x, node.y, nodeRadius + pulse + 10
            );
            gradient.addColorStop(0, node.color + '40');
            gradient.addColorStop(1, node.color + '00');
            demoCtx.fillStyle = gradient;
            demoCtx.fill();

            // Node
            demoCtx.beginPath();
            demoCtx.arc(node.x, node.y, nodeRadius + pulse, 0, Math.PI * 2);
            demoCtx.fillStyle = node.color;
            demoCtx.fill();
            demoCtx.strokeStyle = '#fff';
            demoCtx.lineWidth = 2;
            demoCtx.stroke();
        });

        time += 0.02;
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