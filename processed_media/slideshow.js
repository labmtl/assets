(function() {
    function addStyles() {
        if (document.getElementById('labmtl-slideshow-styles')) return;
        const style = document.createElement('style');
        style.id = 'labmtl-slideshow-styles';
        style.textContent = `
            .labmtl-slideshow {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
                background: #020617;
                overflow: hidden;
                border-radius: 12px;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            .labmtl-slideshow.overlay-mode {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 999999 !important;
                border-radius: 0 !important;
                margin: 0 !important;
            }
            .labmtl-slides-container {
                width: 100%;
                height: 100%;
                position: relative;
            }
            .labmtl-slide {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                z-index: 1;
            }
            .labmtl-slide.active { 
                opacity: 1; 
                z-index: 2; 
                pointer-events: auto;
            }
            .labmtl-slide img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .labmtl-caption {
                position: absolute;
                bottom: 40px;
                left: 40px;
                right: 40px;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(16px);
                padding: 24px 32px;
                border-radius: 20px;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 10;
                max-width: 600px;
                pointer-events: auto;
            }
            .labmtl-caption h3 { 
                margin: 0 0 8px 0; 
                font-size: 1.6rem; 
                font-weight: 800; 
                color: #06b6d4; 
                letter-spacing: -0.02em;
            }
            .labmtl-caption p { 
                margin: 0; 
                font-size: 1rem; 
                opacity: 0.9; 
                line-height: 1.5; 
                color: #e2e8f0;
            }
            .labmtl-caption .url-display { 
                display: inline-block; 
                margin-top: 12px; 
                font-size: 0.85rem; 
                color: #a5b4fc; 
                font-weight: 600;
            }
            .labmtl-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(15, 23, 42, 0.5);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                width: 56px;
                height: 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 50%;
                z-index: 100;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 1.4rem;
                opacity: 0;
            }
            .labmtl-slideshow:hover .labmtl-nav {
                opacity: 1;
            }
            .labmtl-nav:hover { 
                background: rgba(15, 23, 42, 0.9); 
                color: #06b6d4;
                transform: translateY(-50%) scale(1.1);
            }
            .labmtl-prev { left: 24px; }
            .labmtl-next { right: 24px; }

            .labmtl-close-overlay {
                position: absolute;
                top: 24px;
                right: 24px;
                z-index: 1000000;
                background: rgba(15, 23, 42, 0.8);
                color: white;
                border: 1px solid rgba(255,255,255,0.1);
                padding: 12px 24px;
                border-radius: 30px;
                cursor: pointer;
                font-weight: 600;
                backdrop-filter: blur(10px);
                display: none;
                transition: all 0.3s ease;
            }
            .labmtl-close-overlay:hover {
                background: #ef4444;
                transform: scale(1.05);
            }
            .labmtl-slideshow.overlay-mode .labmtl-close-overlay {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    addStyles();

    window.initLabMTLSlideshow = function(target) {
        if (target) {
            initSingleSlideshow(target);
        } else {
            initAllSlideshows();
        }
    };

    async function initAllSlideshows() {
        const containers = document.querySelectorAll('.labmtl-slideshow');
        for (const container of containers) {
            initSingleSlideshow(container);
        }
    }

    async function initSingleSlideshow(container) {
        // Clear previous content but keep basic structure if needed
        container.innerHTML = '';
        
        const manifestUrl = container.getAttribute('data-manifest') || './manifest.json';
        const filterLabel = container.getAttribute('data-label');
        const autoplay = container.getAttribute('data-autoplay') !== 'false';
        const lang = container.getAttribute('data-lang') || 'en';
        const isOverlay = container.getAttribute('data-overlay') === 'true';

        if (isOverlay) {
            container.classList.add('overlay-mode');
            const closeBtn = document.createElement('button');
            closeBtn.className = 'labmtl-close-overlay';
            closeBtn.innerHTML = '✕ Close';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                container.classList.remove('overlay-mode');
            };
            container.appendChild(closeBtn);
        }

        try {
            const response = await fetch(manifestUrl);
            const manifest = await response.json();

            const items = manifest.filter(item => 
                !filterLabel || (item.labels && item.labels.includes(filterLabel))
            );

            if (items.length === 0) {
                container.innerHTML += `<div style="color: #94a3b8; padding: 40px; text-align: center; background: #0f172a; height: 100%; display: flex; align-items: center; justify-content: center;">
                    No images found for label: <b>${filterLabel}</b>
                </div>`;
                return;
            }

            renderSlideshow(container, items, autoplay, lang);
        } catch (error) {
            console.error('Error loading slideshow:', error);
            container.innerHTML = `<div style="color: #ef4444; padding: 20px;">Error loading manifest.</div>`;
        }
    }

    function renderSlideshow(container, items, autoplay, lang) {
        const slidesContainer = document.createElement('div');
        slidesContainer.className = 'labmtl-slides-container';
        
        const slides = items.map((item, index) => {
            const titleObj = item.title || {};
            const descObj = item.description || {};
            
            const title = typeof titleObj === 'string' ? titleObj : (titleObj[lang] || titleObj['en'] || '');
            const desc = typeof descObj === 'string' ? descObj : (descObj[lang] || descObj['en'] || '');
            
            const webp1280 = item.formats.images.find(f => f.width === 1280 && f.format === 'webp');
            const jpg1280 = item.formats.images.find(f => f.width === 1280 && f.format === 'jpg');
            const imgSrc = (webp1280 || jpg1280 || item.formats.images[0]).path;
            const hasUrl = !!item.source_url;

            const slide = document.createElement('div');
            slide.className = `labmtl-slide ${index === 0 ? 'active' : ''}`;
            if (hasUrl) {
                slide.style.cursor = 'pointer';
                slide.onclick = () => window.open(item.source_url, '_blank');
            }

            slide.innerHTML = `
                <img src="${imgSrc}" alt="${title}" loading="lazy">
                <div class="labmtl-caption">
                    <h3>${title}</h3>
                    ${desc ? `<p>${desc}</p>` : ''}
                    ${hasUrl ? `<span class="url-display">${item.source_url.replace(/^https?:\/\//, '')}</span>` : ''}
                </div>
            `;
            return slide;
        });

        slides.forEach(slide => slidesContainer.appendChild(slide));
        container.appendChild(slidesContainer);

        let currentIndex = 0;

        function goToSlide(n) {
            slides[currentIndex].classList.remove('active');
            currentIndex = (n + slides.length) % slides.length;
            slides[currentIndex].classList.add('active');
        }

        // Add navigation
        const prevBtn = document.createElement('div');
        prevBtn.className = 'labmtl-nav labmtl-prev';
        prevBtn.innerHTML = '❮';
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            goToSlide(currentIndex - 1);
        };

        const nextBtn = document.createElement('div');
        nextBtn.className = 'labmtl-nav labmtl-next';
        nextBtn.innerHTML = '❯';
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            goToSlide(currentIndex + 1);
        };

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        if (autoplay && items.length > 1) {
            setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 5000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllSlideshows);
    } else {
        initAllSlideshows();
    }
})();
