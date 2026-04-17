// ==========================================
// 1. SPOLOČNÉ FUNKCIE (Menu, Lightbox, Hodiny)
// ==========================================

// --- Menu ---
function toggleMenu() {
    const menu = document.getElementById('overlay-menu');
    if (!menu) return;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
        document.body.style.overflow = 'auto'; 
    } else {
        menu.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// --- Lightbox otváranie (Upravené, aby fungovalo z oboch stránok) ---
function openProject(element) {
    const lightbox = document.getElementById('project-lightbox');
    if (!lightbox) return;

    let img, title, description, articleText;

    // Zistíme, či sme klikli na obrázok z domovskej stránky (kde sú dáta v obale .slide)
    const parentSlide = element.closest('.slide');
    
    if (parentSlide) {
        // Logika pre hlavnú stránku
        img = parentSlide.querySelector('img').src;
        let rawTitle = parentSlide.querySelector('.caption').textContent;
        title = rawTitle.split(',')[0].trim(); 
        description = parentSlide.getAttribute('data-description') || "";
        articleText = parentSlide.getAttribute('data-article') || "";
    } else {
        // Logika pre podstránku Projekty (dáta sú priamo na obrázku)
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
        if (document.getElementById('overlay-menu').style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }
}

// --- Live Hodiny ---
function updateClock() {
    const clockElement = document.getElementById('live-clock');
    if (!clockElement) return; 

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    clockElement.innerText = `${hours}:${minutes}:${seconds}`;
}

// ==========================================
// 2. PO NAČÍTANÍ STRÁNKY (Slider, Vlna, Intervaly)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Zapni hodiny (ak existuje blok na stránke)
    if (document.getElementById('live-clock')) {
        updateClock(); 
        setInterval(updateClock, 1000); 
    }

    // --- EFEKT VLNY (Len na podstránke Projekty) ---
    const waveImages = document.querySelectorAll('.wave-img');
    if (waveImages.length > 0) {
        function handleWaveEffect() {
            const windowCenter = window.innerHeight / 2;
            waveImages.forEach(img => {
                const rect = img.getBoundingClientRect();
                const imgCenter = rect.top + rect.height / 2;
                const distance = Math.abs(windowCenter - imgCenter);
                const maxDistance = window.innerHeight / 1.5; 
                
                let scale = 1.15 - (distance / maxDistance) * 0.4;
                if (scale < 0.75) scale = 0.75;
                if (scale > 1.15) scale = 1.15;
                
                let opacity = 1 - (distance / maxDistance) * 0.7;
                if (opacity < 0.3) opacity = 0.3;
                
                img.style.transform = `scale(${scale})`;
                img.style.opacity = opacity;
            });
        }
        window.addEventListener('scroll', handleWaveEffect);
        handleWaveEffect(); 
    }

    // --- SLIDER (Len na hlavnej stránke) ---
    const track = document.querySelector('.slider-track');
    if (track) {
        let slides = Array.from(document.querySelectorAll('.slide'));
        let scrollPos = 0; 
        let currentPos = 0;
        let snapTimeout;

        const speedFactor = 0.4; 
        const lerpFactor = 0.04; 
        const snapDelay = 200;   

        // Vytvorenie nekonečnej slučky
        function createLoop() {
            slides.forEach(slide => {
                const endClone = slide.cloneNode(true);
                endClone.classList.add('clone');
                track.appendChild(endClone);
            });
            [...slides].reverse().forEach(slide => {
                const startClone = slide.cloneNode(true);
                startClone.classList.add('clone');
                track.insertBefore(startClone, track.firstChild);
            });
        }
        createLoop();

        const allSlides = document.querySelectorAll('.slide');

        // Musíme počkať na načítanie šírky obrázkov
        window.addEventListener('load', () => {
            const slideWidth = slides[0].offsetWidth; 
            const totalWidth = slideWidth * slides.length; 

            scrollPos = totalWidth; 
            currentPos = totalWidth;

            function animate() {
                currentPos += (scrollPos - currentPos) * lerpFactor; 

                if (scrollPos >= totalWidth * 2) {
                    scrollPos -= totalWidth;
                    currentPos -= totalWidth;
                } else if (scrollPos < totalWidth) {
                    scrollPos += totalWidth;
                    currentPos += totalWidth;
                }

                const x = -currentPos + (window.innerWidth / 2) - (slideWidth / 2);
                track.style.transform = `translateX(${x}px)`;

                allSlides.forEach(slide => {
                    const rect = slide.getBoundingClientRect();
                    const screenCenter = window.innerWidth / 2;
                    const dist = Math.abs(screenCenter - (rect.left + rect.width / 2));
                    
                    if (dist < slideWidth / 2) {
                        slide.classList.add('active');
                    } else {
                        slide.classList.remove('active');
                    }
                });
                requestAnimationFrame(animate);
            }
            animate();

            // Scrollovanie
            window.addEventListener('wheel', (e) => {
                clearTimeout(snapTimeout);
                scrollPos += e.deltaY * speedFactor;
                snapTimeout = setTimeout(snapToCenter, snapDelay);
            }, { passive: false });

            // Šípky na klávesnici
            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    clearTimeout(snapTimeout);
                    scrollPos += slideWidth;
                    snapTimeout = setTimeout(snapToCenter, 100);
                }
                if (e.key === 'ArrowLeft') {
                    clearTimeout(snapTimeout);
                    scrollPos -= slideWidth;
                    snapTimeout = setTimeout(snapToCenter, 100);
                }
            });

            function snapToCenter() {
                const closestIndex = Math.round(scrollPos / slideWidth);
                scrollPos = closestIndex * slideWidth;
            }
        });

        // Kliknutie na obrázok v slideri
        track.addEventListener('click', (e) => {
            const clickedSlide = e.target.closest('.slide');
            if (!clickedSlide) return;
            openProject(clickedSlide); // Teraz funkcia vie, že voláme zo slidera
        });
    }
});

