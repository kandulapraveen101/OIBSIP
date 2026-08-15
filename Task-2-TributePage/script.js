/* ==========================================================
   NIKOLA TESLA TRIBUTE PAGE - INTERACTIVE JAVASCRIPT
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MOBILE MENU TOGGLE ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // --- 2. TIMELINE CATEGORY FILTERING ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const timelineItems = document.querySelectorAll('.timeline-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            timelineItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || (category && category.includes(filter))) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // --- 3. QUOTE CAROUSEL ---
    const quoteSlides = document.querySelectorAll('.quote-slide');
    const dots = document.querySelectorAll('.quote-dots .dot');
    const prevQuoteBtn = document.getElementById('prevQuoteBtn');
    const nextQuoteBtn = document.getElementById('nextQuoteBtn');
    let currentQuoteIndex = 0;
    let quoteInterval;

    function showQuote(index) {
        quoteSlides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (dots[i]) dots[i].classList.remove('active');
        });

        currentQuoteIndex = (index + quoteSlides.length) % quoteSlides.length;
        quoteSlides[currentQuoteIndex].classList.add('active');
        if (dots[currentQuoteIndex]) dots[currentQuoteIndex].classList.add('active');
    }

    if (prevQuoteBtn && nextQuoteBtn) {
        prevQuoteBtn.addEventListener('click', () => {
            showQuote(currentQuoteIndex - 1);
            resetQuoteTimer();
        });

        nextQuoteBtn.addEventListener('click', () => {
            showQuote(currentQuoteIndex + 1);
            resetQuoteTimer();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showQuote(index);
                resetQuoteTimer();
            });
        });

        function startQuoteTimer() {
            quoteInterval = setInterval(() => {
                showQuote(currentQuoteIndex + 1);
            }, 6000);
        }

        function resetQuoteTimer() {
            clearInterval(quoteInterval);
            startQuoteTimer();
        }

        startQuoteTimer();
    }

    // --- 4. TESLA COIL SPARK LAB CANVAS SIMULATION ---
    const canvas = document.getElementById('teslaCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const voltageInput = document.getElementById('voltageRange');
        const clearBtn = document.getElementById('clearArcsBtn');

        let sparks = [];
        let frequency = 5;

        if (voltageInput) {
            voltageInput.addEventListener('input', (e) => {
                frequency = parseInt(e.target.value, 10);
            });
        }

        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth || 900;
            canvas.height = 400;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Center coil origin
        function getCoilCenter() {
            return { x: canvas.width / 2, y: canvas.height - 40 };
        }

        // Lightning arc generator
        function createArc(startX, startY, endX, endY, color, width) {
            const steps = 15;
            let currentX = startX;
            let currentY = startY;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            for (let i = 1; i <= steps; i++) {
                const progress = i / steps;
                const targetX = startX + (endX - startX) * progress;
                const targetY = startY + (endY - startY) * progress;

                // Random displacement perpendicular to path
                const offset = (Math.random() - 0.5) * 30;
                const x = targetX + offset;
                const y = targetY + (Math.random() - 0.5) * 15;

                ctx.lineTo(x, y);
                currentX = x;
                currentY = y;
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f2ff';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Canvas animation loop
        function animateCanvas() {
            // Semi-transparent clear for motion trail
            ctx.fillStyle = 'rgba(4, 5, 8, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const coil = getCoilCenter();

            // Draw Tesla Coil Base & Top Sphere
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(coil.x - 20, coil.y, 40, 40);

            // Glowing Torus Sphere
            ctx.beginPath();
            ctx.arc(coil.x, coil.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2ff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f2ff';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Generate ambient random sparks from coil top
            if (Math.random() < 0.15 * frequency) {
                const angle = Math.random() * Math.PI - Math.PI; // Upward arc hemisphere
                const distance = 80 + Math.random() * 150;
                const targetX = coil.x + Math.cos(angle) * distance;
                const targetY = coil.y + Math.sin(angle) * distance;
                
                sparks.push({
                    startX: coil.x,
                    startY: coil.y,
                    endX: targetX,
                    endY: targetY,
                    life: 1,
                    color: Math.random() > 0.3 ? '#00f2ff' : '#9d4edd'
                });
            }

            // Draw active sparks
            sparks.forEach((s, idx) => {
                createArc(s.startX, s.startY, s.endX, s.endY, s.color, s.life * 2);
                s.life -= 0.1;
                if (s.life <= 0) sparks.splice(idx, 1);
            });

            requestAnimationFrame(animateCanvas);
        }

        animateCanvas();

        // User Click / Touch spark interaction
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const coil = getCoilCenter();

            for (let i = 0; i < 4; i++) {
                sparks.push({
                    startX: coil.x,
                    startY: coil.y,
                    endX: mouseX + (Math.random() - 0.5) * 30,
                    endY: mouseY + (Math.random() - 0.5) * 30,
                    life: 1.2,
                    color: '#00f2ff'
                });
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                sparks = [];
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
        }
    }

    // --- 5. ENERGIZE SPARK BUTTON TOGGLE ---
    const sparkToggleBtn = document.getElementById('sparkToggleBtn');
    let isEnergized = false;

    if (sparkToggleBtn) {
        sparkToggleBtn.addEventListener('click', () => {
            isEnergized = !isEnergized;
            if (isEnergized) {
                document.body.classList.add('overcharged');
                sparkToggleBtn.style.background = '#00f2ff';
                sparkToggleBtn.style.color = '#000000';
                sparkToggleBtn.querySelector('.btn-text').textContent = 'Energized!';
            } else {
                document.body.classList.remove('overcharged');
                sparkToggleBtn.style.background = 'var(--cyan-dim)';
                sparkToggleBtn.style.color = 'var(--cyan-electric)';
                sparkToggleBtn.querySelector('.btn-text').textContent = 'Energize';
            }
        });
    }

    // --- 6. SCROLL REVEAL ANIMATION (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.bio-block, .invention-card, .timeline-item, .stat-card');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        revealElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(25px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            revealObserver.observe(el);
        });
    }

});
