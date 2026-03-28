/* ===========================
   NOVA 2.0 — INTERACTIVE ENGINE
   ========================= */

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initScrollAnimations();
    initStatCounter();
    initSubscribeForm();
    initSmoothScroll();
    initVoiceOrb();
});

/* ===========================
   PARTICLE SYSTEM
   ========================= */

function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouseX = 0, mouseY = 0;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const PARTICLE_COUNT = Math.min(80, Math.floor((width * height) / 20000));

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.hue = Math.random() > 0.5 ? 187 : 270; // cyan or purple
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse repulsion
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                this.x += dx / dist * 1.5;
                this.y += dy / dist * 1.5;
            }

            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    const opacity = (1 - dist / 150) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
}

/* ===========================
   NAVBAR
   ========================= */

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link based on scroll
        const sections = document.querySelectorAll('.section, .hero');
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Mobile toggle
    toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        toggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('active');
        });
    });
}

/* ===========================
   SCROLL ANIMATIONS
   ========================= */

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Animate elements on scroll
    document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));

    // Animate cards with stagger
    const staggerElements = document.querySelectorAll(
        '.feature-card, .update-item, .demo-card, .tip-card'
    );

    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    staggerElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        staggerObserver.observe(el);
    });

    // Auto-trigger hero animations
    setTimeout(() => {
        document.querySelectorAll('.hero .animate-fade-up').forEach(el => {
            el.classList.add('visible');
        });
    }, 200);
}

/* ===========================
   STAT COUNTER
   ========================= */

function initStatCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(element, target) {
    let current = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

/* ===========================
   SUBSCRIBE FORM
   ========================= */

function initSubscribeForm() {
    const form = document.getElementById('subscribe-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('subscribe-email').value;
        const btn = document.getElementById('subscribe-btn');

        // Simulate submission
        btn.innerHTML = '<span>Subscribing...</span>';
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span>Subscribed!</span>
            `;
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';

            // Show success notification
            showNotification('🎉 Welcome to Nova 2.0! Check your email for exclusive updates.');

            setTimeout(() => {
                form.reset();
                btn.innerHTML = `
                    <span>Subscribe Now</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                `;
                btn.style.background = '';
                btn.style.boxShadow = '';
                btn.style.pointerEvents = '';
            }, 3000);
        }, 1200);
    });
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 18px 28px;
        background: rgba(15, 15, 35, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 229, 255, 0.3);
        border-radius: 14px;
        color: #f0f0f8;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        z-index: 10000;
        box-shadow: 0 8px 30px rgba(0, 229, 255, 0.2);
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    requestAnimationFrame(() => {
        notif.style.transform = 'translateY(0)';
        notif.style.opacity = '1';
    });

    setTimeout(() => {
        notif.style.transform = 'translateY(20px)';
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 400);
    }, 4000);
}

/* ===========================
   SMOOTH SCROLL
   ========================= */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* ===========================
   VOICE ORB INTERACTION
   ========================= */

function initVoiceOrb() {
    const orb = document.getElementById('voice-orb');
    if (!orb) return;

    orb.addEventListener('mouseenter', () => {
        orb.style.transform = 'scale(1.05)';
        const waves = orb.querySelectorAll('.wave');
        waves.forEach(w => {
            w.style.borderColor = 'rgba(168, 85, 247, 0.5)';
        });
    });

    orb.addEventListener('mouseleave', () => {
        orb.style.transform = 'scale(1)';
        const waves = orb.querySelectorAll('.wave');
        waves.forEach(w => {
            w.style.borderColor = 'rgba(0, 229, 255, 0.3)';
        });
    });

    // Parallax on mouse move
    document.addEventListener('mousemove', (e) => {
        const rect = orb.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const moveX = (e.clientX - centerX) / 40;
        const moveY = (e.clientY - centerY) / 40;

        orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

/* ===========================
   AI CONTENT GENERATOR
   ========================= */

const API_BASE = 'http://localhost:5000/api';
let lastGeneratedContent = '';

function showLoading() {
    const output = document.getElementById('gen-output-text');
    output.innerHTML = `
        <div class="gen-loading">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <span>Generating locally...</span>
        </div>
    `;
    document.getElementById('gen-meta').style.display = 'none';
    updateStatus('Generating content on this device...');
}

function showError(message) {
    const output = document.getElementById('gen-output-text');
    output.innerHTML = `
        <div class="gen-placeholder" style="color: #ef4444;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>${message}</p>
        </div>
    `;
    updateStatus('Error — check if the Python server is running');
}

function showOutput(result) {
    const output = document.getElementById('gen-output-text');
    lastGeneratedContent = result.content;

    // Typewriter effect
    output.textContent = '';
    output.style.color = '#f0f0f8';
    let i = 0;
    const speed = 8;
    function type() {
        if (i < result.content.length) {
            output.textContent += result.content.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();

    // Show metadata
    const meta = document.getElementById('gen-meta');
    meta.style.display = 'flex';
    document.getElementById('gen-meta-time').textContent = `⏱️ ${result.metadata.generation_time_ms}ms`;
    document.getElementById('gen-meta-words').textContent = `📊 ${result.metadata.word_count} words`;
    document.getElementById('gen-meta-engine').textContent = `🤖 ${result.metadata.engine}`;

    updateStatus('Content generated successfully — processed locally');
    showNotification('✅ Content generated locally on your laptop!');
}

function updateStatus(text) {
    const statusText = document.getElementById('gen-status-text');
    if (statusText) statusText.textContent = text;
}

async function generateContent() {
    const type = document.getElementById('gen-type').value;
    const tone = document.getElementById('gen-tone').value;

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, tone }),
        });

        const result = await response.json();

        if (result.success) {
            showOutput(result);
        } else {
            showError(result.error || 'Generation failed.');
        }
    } catch (error) {
        showError(
            'Could not connect to the AI engine.<br><br>' +
            '<strong style="color: #00e5ff;">Fix:</strong> Run <code style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;">python app.py</code> in your terminal first.'
        );
    }
}

async function generateCustom() {
    const prompt = document.getElementById('gen-prompt').value.trim();
    const tone = document.getElementById('gen-tone').value;

    if (!prompt) {
        showNotification('⚠️ Please enter a prompt first.');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/generate/custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, tone }),
        });

        const result = await response.json();

        if (result.success) {
            showOutput(result);
        } else {
            showError(result.error || 'Generation failed.');
        }
    } catch (error) {
        showError(
            'Could not connect to the AI engine.<br><br>' +
            '<strong style="color: #00e5ff;">Fix:</strong> Run <code style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;">python app.py</code> in your terminal first.'
        );
    }
}

function copyOutput() {
    if (!lastGeneratedContent) {
        showNotification('⚠️ No content to copy. Generate something first!');
        return;
    }

    navigator.clipboard.writeText(lastGeneratedContent).then(() => {
        showNotification('📋 Content copied to clipboard!');
        const btn = document.getElementById('gen-copy-btn');
        btn.style.color = '#10b981';
        btn.style.borderColor = '#10b981';
        setTimeout(() => {
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = lastGeneratedContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('📋 Content copied to clipboard!');
    });
}

