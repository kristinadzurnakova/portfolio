// ==========================================
// SPOLOČNÉ FUNKCIE
// ==========================================

function toggleMenu() {
    const menu = document.getElementById('overlay-menu');
    if (!menu) return;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        menu.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function openProject(element) {
    const lightbox = document.getElementById('project-lightbox');
    if (!lightbox) return;

    let img, title, description, articleText;
    const parentSlide = element.closest('.slide');
    
    if (parentSlide) {
        img = parentSlide.querySelector('img').src;
        let rawTitle = parentSlide.querySelector('.caption').textContent;
        title = rawTitle.split(',')[0].trim(); 
        description = parentSlide.getAttribute('data-description') || "";
        articleText = parentSlide.getAttribute('data-article') || "";
    } else {
        img = element.src;
        title = element.getAttribute('data-title') || "";
        description = element.getAttribute('data-description') || "";
        articleText = element.getAttribute('data-article') || "";
    }

    document.getElementById('lightbox-img').src = img;
    document.getElementById('lightbox-title').innerText = title;
    document.getElementById('lightbox-desc').innerText = description ? `[${description}]` : ""; 
    document.getElementById('lightbox-article').innerText = articleText; 

    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProject() {
    const lightbox = document.getElementById('project-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        const menu = document.getElementById('overlay-menu');
        if (!menu || menu.style.display !== 'flex') {
            document.body.style.overflow = '';
        }
    }
}

function updateClock() {
    const el = document.getElementById('live-clock');
    if (!el) return; 
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    el.innerText = `${h}:${m}:${s}`;
}

// ==========================================
// PO NAČÍTANÍ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    // Hodiny
    if (document.getElementById('live-clock')) {
        updateClock(); 
        setInterval(updateClock, 1000); 
    }

    // --- SLIDER (len hlavná strana) ---
    const track = document.querySelector('.slider-track');
    if (track) {
        let slides = Array.from(document.querySelectorAll('.slide'));
        let scrollPos = 0; 
        let currentPos = 0;
        let snapTimeout;
        let dragMoved = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartScroll = 0;

        const speedFactor = 0.4; 
        const lerpFactor = 0.04; 
        const snapDelay = 180;   

        function createLoop() {
            slides.forEach(slide => {
                const c = slide.cloneNode(true);
                c.classList.add('clone');
                track.appendChild(c);
            });
            [...slides].reverse().forEach(slide => {
                const c = slide.cloneNode(true);
                c.classList.add('clone');
                track.insertBefore(c, track.firstChild);
            });
        }
        createLoop();

        const allSlides = document.querySelectorAll('.slide');

        window.addEventListener('load', () => {
            const slideWidth = slides[0].offsetWidth; 
            const totalWidth = slideWidth * slides.length; 

            scrollPos = totalWidth; 
            currentPos = totalWidth;

            function snapToCenter() {
                const i = Math.round(scrollPos / slideWidth);
                scrollPos = i * slideWidth;
            }

            function animate() {
                currentPos += (scrollPos - currentPos) * lerpFactor; 

                if (scrollPos >= totalWidth * 2) { scrollPos -= totalWidth; currentPos -= totalWidth; }
                else if (scrollPos < totalWidth) { scrollPos += totalWidth; currentPos += totalWidth; }

                const x = -currentPos + (window.innerWidth / 2) - (slideWidth / 2);
                track.style.transform = `translateX(${x}px)`;

                allSlides.forEach(slide => {
                    const rect = slide.getBoundingClientRect();
                    const dist = Math.abs(window.innerWidth / 2 - (rect.left + rect.width / 2));
                    slide.classList.toggle('active', dist < slideWidth / 2);
                });
                requestAnimationFrame(animate);
            }
            animate();

            // Koliesko
            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                clearTimeout(snapTimeout);
                scrollPos += e.deltaY * speedFactor;
                snapTimeout = setTimeout(snapToCenter, snapDelay);
            }, { passive: false });

            // Klávesnica
            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') { clearTimeout(snapTimeout); scrollPos += slideWidth; snapTimeout = setTimeout(snapToCenter, 100); }
                if (e.key === 'ArrowLeft')  { clearTimeout(snapTimeout); scrollPos -= slideWidth; snapTimeout = setTimeout(snapToCenter, 100); }
            });

            // Mouse drag
            const container = document.querySelector('.slider-container');
            if (container) {
                container.addEventListener('mousedown', (e) => {
                    isDragging = true; dragMoved = false;
                    dragStartX = e.clientX; dragStartScroll = scrollPos;
                    clearTimeout(snapTimeout);
                });
                window.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const delta = e.clientX - dragStartX;
                    if (Math.abs(delta) > 5) dragMoved = true;
                    scrollPos = dragStartScroll - delta;
                });
                window.addEventListener('mouseup', () => {
                    if (isDragging) { isDragging = false; snapTimeout = setTimeout(snapToCenter, snapDelay); }
                });
            }

            // Touch / swipe
            let touchStartX = 0;
            let touchStartScroll = 0;
            let touchMoved = false;

            track.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartScroll = scrollPos;
                touchMoved = false;
                clearTimeout(snapTimeout);
            }, { passive: true });

            track.addEventListener('touchmove', (e) => {
                const delta = touchStartX - e.touches[0].clientX;
                if (Math.abs(delta) > 8) {
                    touchMoved = true;
                    scrollPos = touchStartScroll + delta * 1.1;
                }
            }, { passive: true });

            track.addEventListener('touchend', (e) => {
                snapTimeout = setTimeout(snapToCenter, snapDelay);
                if (!touchMoved) {
                    const touch = e.changedTouches[0];
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (el) {
                        const slide = el.closest('.slide');
                        if (slide) openProject(slide);
                    }
                }
            }, { passive: true });
        });

        // Klik na slide (desktop)
        track.addEventListener('click', (e) => {
            if (dragMoved) { dragMoved = false; return; }
            const clickedSlide = e.target.closest('.slide');
            if (clickedSlide) openProject(clickedSlide);
        });
    }

    // Automatické svietenie log (About strana)
    const logos = document.querySelectorAll('.sw-item');
    if (logos.length > 0) {
        let idx = 0;
        setInterval(() => {
            logos.forEach(l => l.classList.remove('active'));
            logos[idx].classList.add('active');
            idx = (idx + 1) % logos.length;
        }, 1500); 
    }
});