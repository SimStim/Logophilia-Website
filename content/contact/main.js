/**
 * λογοφιλία – Main JavaScript
 * Handles: mobile menu, dropdowns, contact form, newsletter, shop filters, gallery, scroll-to-top
 */

(function () {
    'use strict';

    // --- Mobile Menu ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !expanded);
            mainNav.classList.toggle('open');
            document.body.style.overflow = expanded ? '' : 'hidden';
        });
        // Mobile dropdown toggles
        mainNav.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 920) {
                    e.preventDefault();
                    link.closest('.nav-dropdown').classList.toggle('open');
                }
            });
        });
    }

    // --- Scroll to Top ---
    const scrollBtn = document.getElementById('scroll-top');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('visible', window.scrollY > 400);
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Product Gallery ---
    const galleryMain = document.getElementById('gallery-main-img');
    if (galleryMain) {
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const src = thumb.dataset.img;
                if (src) {
                    galleryMain.src = src;
                    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                }
            });
        });
    }

    // --- Shop Filters ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('shop-search');

    function filterProducts() {
        if (!productGrid) return;
        const activeFilter = document.querySelector('.filter-btn.active');
        const filter = activeFilter ? activeFilter.dataset.filter : 'all';
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

        productGrid.querySelectorAll('.product-card').forEach(card => {
            const cats = (card.dataset.categories || '').toLowerCase();
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const matchFilter = filter === 'all' || cats.includes(filter);
            const matchSearch = !search || title.includes(search);
            card.style.display = matchFilter && matchSearch ? '' : 'none';
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // --- Contact Form ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Generate captcha
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const captchaQ = document.getElementById('captcha-question');
        const captchaExp = document.getElementById('captcha-expected');
        if (captchaQ) captchaQ.textContent = `${a} + ${b}`;
        if (captchaExp) captchaExp.value = String(a + b);

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = document.getElementById('contact-feedback');
            let valid = true;

            // Clear previous states
            contactForm.querySelectorAll('.form-group').forEach(g => {
                g.classList.remove('error', 'success');
                const fb = g.querySelector('.field-feedback');
                if (fb) fb.textContent = '';
            });

            // Validate fields
            const fields = [
                { name: 'name', label: 'Name', minLen: 2 },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'subject', label: 'Subject', minLen: 2 },
                { name: 'message', label: 'Message', minLen: 10 },
            ];

            fields.forEach(f => {
                const input = contactForm.querySelector(`[name="${f.name}"]`);
                if (!input) return;
                const group = input.closest('.form-group');
                const fb = group?.querySelector('.field-feedback');
                const val = input.value.trim();

                if (!val) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = `${f.label} is required`;
                    valid = false;
                } else if (f.minLen && val.length < f.minLen) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = `${f.label} is too short`;
                    valid = false;
                } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = 'Please enter a valid email address';
                    valid = false;
                } else {
                    group?.classList.add('success');
                    if (fb) fb.textContent = '✓';
                }
            });

            // Captcha
            const captchaInput = contactForm.querySelector('[name="captcha_answer"]');
            const captchaExpected = contactForm.querySelector('[name="captcha_expected"]');
            if (captchaInput && captchaExpected) {
                const group = captchaInput.closest('.form-group');
                const fb = group?.querySelector('.field-feedback');
                if (captchaInput.value.trim() !== captchaExpected.value) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = 'Incorrect answer';
                    valid = false;
                } else {
                    group?.classList.add('success');
                    if (fb) fb.textContent = '✓';
                }
            }

            // Consent
            const consent = contactForm.querySelector('[name="consent"]');
            if (consent && !consent.checked) {
                const group = consent.closest('.form-group');
                const fb = group?.querySelector('.field-feedback');
                group?.classList.add('error');
                if (fb) fb.textContent = 'You must consent to proceed';
                valid = false;
            }

            // Honeypot
            const honeypot = contactForm.querySelector('[name="website"]');
            if (honeypot && honeypot.value) {
                valid = false; // Bot detected
            }

            if (!valid) return;

            // Submit to API
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            try {
                const formData = new FormData(contactForm);
                const resp = await fetch('/api/contact.php', {
                    method: 'POST',
                    body: formData,
                });
                const result = await resp.json();

                if (result.success) {
                    feedback.className = 'form-feedback success';
                    feedback.textContent = '✓ Your message has been sent successfully. We\'ll get back to you soon!';
                    contactForm.reset();
                    contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('error', 'success'));
                    // Regenerate captcha
                    const na = Math.floor(Math.random() * 10) + 1;
                    const nb = Math.floor(Math.random() * 10) + 1;
                    if (captchaQ) captchaQ.textContent = `${na} + ${nb}`;
                    if (captchaExp) captchaExp.value = String(na + nb);
                } else {
                    feedback.className = 'form-feedback error';
                    feedback.textContent = result.message || 'Something went wrong. Please try again.';
                }
            } catch (err) {
                feedback.className = 'form-feedback error';
                feedback.textContent = 'Network error. Please try again later.';
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }

    // --- Newsletter Form ---
    const nlForm = document.getElementById('newsletter-form');
    if (nlForm) {
        nlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = document.getElementById('newsletter-feedback');
            const emailInput = nlForm.querySelector('input[type="email"]');
            const email = emailInput?.value.trim();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (feedback) {
                    feedback.className = 'form-feedback error';
                    feedback.textContent = 'Please enter a valid email address.';
                }
                return;
            }

            const submitBtn = nlForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
            }

            try {
                const formData = new FormData();
                formData.append('email', email);
                const resp = await fetch('/api/newsletter.php', {
                    method: 'POST',
                    body: formData,
                });
                const result = await resp.json();

                if (result.success) {
                    feedback.className = 'form-feedback success';
                    feedback.textContent = '✓ You\'re subscribed! Check your inbox for confirmation.';
                    nlForm.reset();
                } else {
                    feedback.className = 'form-feedback error';
                    feedback.textContent = result.message || 'Something went wrong. Please try again.';
                }
            } catch (err) {
                feedback.className = 'form-feedback error';
                feedback.textContent = 'Network error. Please try again later.';
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
            }
        });
    }

})();
