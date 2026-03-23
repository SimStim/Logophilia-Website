/**
 * λογοφιλία – Main JavaScript
 * Handles: mobile menu, dropdowns, contact form, newsletter, decrypt
 */

const decrypt = (salt, encoded) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encoded
        .match(/.{1,2}/g)
        .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join("");
};

async function downloadFile(filename) {
    const apiKey = decrypt(
        "Prince",
        "1117144616401615471115121a46461a47111a401740161547151a404240451a121441171a42161411151a1546421513414214171147101516411a1b10121211"
    );
    try {
        const resp = await fetch(
            `https://api.logophilia.eu/download?fileName=${encodeURIComponent(filename)}`,
            {
                method: 'GET',
                headers: { 'X-API-KEY': apiKey }
            }
        );
        // Inspect Content-Type to decide what the response body is
        const contentType = resp.headers.get('Content-Type') || '';
        // If server returned JSON (error) or non-OK status, show error
        if (contentType.includes('application/json') || !resp.ok) {
            const err = await resp.json().catch(() => ({}));
            const message = err.message || `HTTP ${resp.status}: ${resp.statusText}`;
            Toastify({
                text: message,
                duration: 6000,
                gravity: "top",
                position: "left",
                stopOnFocus: false,
                style: { background: "#ff0000" },
                onClick: function() {}
            }).showToast();
            return;
        }
        // Otherwise treat as file blob
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        // Clean up after a brief delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (e) {
        alert('Download failed: ' + e.message);
    }
}

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
                { name: 'email', label: 'Email', type: 'email' },
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
                    if (fb) fb.textContent = `${f.label}`;
                    Toastify({
                        text: `${f.label}` + " is required",
                        duration: 3000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "linear-gradient(to right, #000000, #9063cd)",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    valid = false;
                } else if (f.minLen && val.length < f.minLen) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = `${f.label}`;
                    Toastify({
                        text: "Message is too short",
                        duration: 3000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "linear-gradient(to right, #000000, #9063cd)",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    valid = false;
                } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    group?.classList.add('error');
                    if (fb) fb.textContent = 'Please enter a valid email address';
                    Toastify({
                        text: "Please enter a valid email address",
                        duration: 3000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "linear-gradient(to right, #000000, #9063cd)",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    valid = false;
                } else {
                    group?.classList.add('success');
                    if (fb) fb.textContent = " ✓";
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
                    Toastify({
                        text: "Your math is wrong",
                        duration: 3000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "linear-gradient(to right, #000000, #9063cd)",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    valid = false;
                } else {
                    group?.classList.add('success');
                }
            }
            // Consent
            const consent = contactForm.querySelector('[name="consent"]');
            if (consent && !consent.checked) {
                const group = consent.closest('.form-group');
                const fb = group?.querySelector('.field-feedback');
                group?.classList.add('error');
                Toastify({
                    text: "Consent not given",
                    duration: 3000,
                    gravity: "top",
                    position: "left",
                    stopOnFocus: false,
                    style: {
                        background: "linear-gradient(to right, #000000, #9063cd)",
                    },
                    onClick: function(){} // Callback after click
                }).showToast();
                valid = false;
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
                const resp = await fetch('https://api.logophilia.eu/contact', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': decrypt(
                            "Prince",
                            "1117144616401615471115121a46461a47111a401740161547151a404240451a121441171a42161411151a1546421513414214171147101516411a1b10121211"
                        ),
                    },
                    body: formData,
                });
                const result = await resp.json();
                if (result.status === 'success') {
                    Toastify({
                        text: "Your message has been sent successfully. We\'ll get back to you soon!",
                        duration: 6000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "#008040",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    contactForm.reset();
                    contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('error', 'success'));
                    // Regenerate captcha
                    const na = Math.floor(Math.random() * 10) + 1;
                    const nb = Math.floor(Math.random() * 10) + 1;
                    if (captchaQ) captchaQ.textContent = `${na} + ${nb}`;
                    if (captchaExp) captchaExp.value = String(na + nb);
                } else {
                    Toastify({
                        text: result.message || 'Something went wrong. Please try again.',
                        duration: 6000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "#ff0000",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                }
            } catch (err) {
                Toastify({
                    text: err || "Network error. Please try again later.",
                    duration: 6000,
                    gravity: "top",
                    position: "left",
                    stopOnFocus: false,
                    style: {
                        background: "#ff0000",
                    },
                    onClick: function(){} // Callback after click
                }).showToast();
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
            let valid = true;
            const emailInput = nlForm.querySelector('input[type="email"]');
            const email = emailInput?.value.trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    Toastify({
                        text: "Please enter a valid email addrees",
                        duration: 3000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "linear-gradient(to right, #000000, #9063cd)",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                valid = false;
            }
            // Consent
            const consent = nlForm.querySelector('[name="consent"]');
            if (consent && !consent.checked) {
                const group = consent.closest('.form-group');
                const fb = group?.querySelector('.field-feedback');
                group?.classList.add('error');
                Toastify({
                    text: "Consent not given",
                    duration: 3000,
                    gravity: "top",
                    position: "left",
                    stopOnFocus: false,
                    style: {
                        background: "linear-gradient(to right, #000000, #9063cd)",
                    },
                    onClick: function(){} // Callback after click
                }).showToast();
                valid = false;
            }
            if (!valid) return;
            // Submit to API
            const submitBtn = nlForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
            }
            try {
                const formData = new FormData(nlForm);
                const resp = await fetch('https://api.logophilia.eu/newsletter', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': decrypt(
                            "Prince",
                            "1117144616401615471115121a46461a47111a401740161547151a404240451a121441171a42161411151a1546421513414214171147101516411a1b10121211"
                        ),
                    },
                    body: formData,
                });
                const result = await resp.json();
                if (result.status === 'success') {
                    Toastify({
                        text: result.message || "You're subscribed!",
                        duration: 6000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "#008040",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                    nlForm.reset();
                } else {
                    Toastify({
                        text: result.message || 'Something went wrong. Please try again.',
                        duration: 6000,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: false,
                        style: {
                            background: "#ff0000",
                        },
                        onClick: function(){} // Callback after click
                    }).showToast();
                }
            } catch (err) {
                Toastify({
                    text: 'Network error. Please try again later.',
                    duration: 6000,
                    gravity: "top",
                    position: "left",
                    stopOnFocus: false,
                    style: {
                        background: "#ff0000",
                    },
                    onClick: function(){} // Callback after click
                }).showToast();
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
            }
        });
    }
})();
