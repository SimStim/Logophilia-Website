/**
 * λογοφιλία – Main JavaScript
 * Handles: mobile menu, dropdowns, contact form, newsletter, decrypt, downloadFile
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

const getApiKey = () => decrypt(
    "Prince",
    "1117144616401615471115121a46461a47111a401740161547151a404240451a121441171a42161411151a1546421513414214171147101516411a1b10121211"
);

function showApiErrorToast(message) {
    Toastify({
        text: message,
        duration: 6000,
        gravity: "top",
        position: "left",
        stopOnFocus: false,
        style: { background: "#ff0000" },
        onClick: function() {}
    }).showToast();
}

async function getFileList() {
    Toastify({
        text: `Requesting current list of goodies from server.`,
        duration: 4000,
        gravity: "top",
        position: "left",
        style: { background: "#416392" },
    }).showToast();
    try {
        const resp = await fetch('https://api.logophilia.eu/freeloot', {
            method: 'GET',
            headers: { 'X-API-KEY': getApiKey() }
        });

        const result = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            showApiErrorToast(result.message || `HTTP ${resp.status}: ${resp.statusText}`);
            return [];
        }

        if (result.status !== 'success') {
            showApiErrorToast(result.message || 'Something went wrong. Please try again.');
            return [];
        }

        if (!Array.isArray(result.freeloot)) {
            showApiErrorToast('File list response is invalid.');
            return [];
        }

        return result.freeloot.filter((file) =>
            file
            && typeof file.name === 'string'
            && typeof file.sha256 === 'string'
            && Number.isFinite(Number(file.size))
        );
    } catch (e) {
        showApiErrorToast(`File list request failed: ${e.message}`);
        return [];
    }
}

function createDownloadButton(file) {
    const button = document.createElement('button');
    button.type = 'button';

    const name = document.createElement('span');
    name.textContent = file.name;

    const size = document.createElement('span');
    size.textContent = ` (${file.size} bytes) `;

    const hashWrapper = document.createElement('span');
    hashWrapper.textContent = '[';

    const hashLabel = document.createElement('span');
    hashLabel.textContent = 'SHA-256';
    hashLabel.title = file.sha256;

    const copyGlyph = document.createElement('span');
    copyGlyph.textContent = ' 📋';
    copyGlyph.title = 'Copy SHA-256 hash for "' + file.name + '" to clipboard';
    copyGlyph.style.cursor = 'copy';
    copyGlyph.setAttribute('role', 'button');
    copyGlyph.setAttribute('aria-label', 'Copy SHA-256 hash for "' + file.name + '" to clipboard');
    copyGlyph.addEventListener('click', async (event) => {
        event.stopPropagation();

        try {
            await navigator.clipboard.writeText(file.sha256);
            Toastify({
                text: 'SHA-256 hash for "' + file.name + '" copied to clipboard.',
                duration: 3000,
                gravity: "top",
                position: "left",
                style: { background: "#36482e" },
            }).showToast();
        } catch (e) {
            showApiErrorToast(`Could not copy SHA-256 hash: ${e.message}`);
        }
    });

    const hashClosingBracket = document.createElement('span');
    hashClosingBracket.textContent = ']';

    hashWrapper.appendChild(hashLabel);
    hashWrapper.appendChild(copyGlyph);
    hashWrapper.appendChild(hashClosingBracket);

    button.appendChild(name);
    button.appendChild(size);
    button.appendChild(hashWrapper);

    button.addEventListener('click', () => {
        downloadFile(file.name);
    });

    return button;
}

function createDownloadSection(title, files) {
    if (!files.length) {
        return null;
    }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement('h4');
    heading.textContent = title;
    fragment.appendChild(heading);

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'flex-start';
    files.forEach((file) => {
        wrapper.appendChild(createDownloadButton(file));
    });
    fragment.appendChild(wrapper);

    return fragment;
}

async function renderDownloadList() {
    const downloadList = document.getElementById('download-list');

    if (!downloadList) {
        return;
    }

    downloadList.textContent = '';

    const files = await getFileList();

    const essentialsFiles = files.filter((file) =>
        file.name.includes('The Pitch Science Fiction')
        && file.name.includes('Logophilia Essentials')
        && file.name.endsWith('.epub')
    );

    const ostFiles = files.filter((file) =>
        file.name.includes('The Pitch Science Fiction')
        && file.name.includes('OST')
        && file.name.endsWith('.zip')
    );

    const otherFiles = files.filter((file) =>
        !essentialsFiles.includes(file)
        && !ostFiles.includes(file)
    );

    const essentialsSection = createDownloadSection(
        'The Pitch Science Fiction (ISSN 2806-4240)',
        essentialsFiles
    );
    const ostSection = createDownloadSection(
        'The Pitch Science Fiction OST',
        ostFiles
    );
    const othersSection = createDownloadSection(
        'Others',
        otherFiles
    );

    if (essentialsSection) {
        downloadList.appendChild(essentialsSection);
    }

    if (ostSection) {
        downloadList.appendChild(ostSection);
    }

    if (othersSection) {
        downloadList.appendChild(othersSection);
    }
}

async function downloadFile(filename) {
    const apiKey = getApiKey();
    // Immediate feedback
    const toast = Toastify({
        text: `Requesting file from server.`,
        duration: 4000,
        gravity: "top",
        position: "left",
        style: { background: "#416392" },
    }).showToast();
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
        // Success message
        Toastify({
            text: `File received from server.`,
            duration: 3000,
            gravity: "top",
            position: "left",
            style: { background: "#36482e" },
        }).showToast();
    } catch (e) {
        Toastify({
            text: `File request failed: ${e.message}`,
            duration: 6000,
            gravity: "top",
            position: "left",
            style: { background: "#ff0000" },
        }).showToast();
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
                            background: "#416392",
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
                            background: "#36482e",
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

/**
 * submissions
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const fileInput = document.querySelector('input[type="file"]');
    const toggleAllButton = document.getElementById('toggleAll');
    const accordionItems = document.querySelectorAll('.accordion-item');

    if (!form || !fileInput || !toggleAllButton) {
        return;
    }

    // Create UI elements
    const progressContainer = createProgressBar();
    const messageContainer = createMessageContainer();
    form.appendChild(progressContainer);
    form.appendChild(messageContainer);

    // Accordion functionality
    toggleAllButton.addEventListener('click', () => {
        const allOpen = Array.from(accordionItems).every(item => item.open);

        accordionItems.forEach(item => {
            item.open = !allOpen;
        });

        if (allOpen) {
            toggleAllButton.innerHTML = "+";
            toggleAllButton.classList.remove('all-expanded');
            toggleAllButton.setAttribute('aria-label', 'Expand all sections');
        } else {
            toggleAllButton.innerHTML = "−";
            toggleAllButton.classList.add('all-expanded');
            toggleAllButton.setAttribute('aria-label', 'Collapse all sections');
        }
    });

    // Initialize button state
    const initiallyAllOpen = Array.from(accordionItems).every(item => item.open);
    if (initiallyAllOpen) {
        toggleAllButton.classList.add('all-expanded');
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!fileInput.files.length) {
            return;
        }
        const formData = new FormData(form);
        const xhr = new XMLHttpRequest();
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                updateProgress(percent);
            }
        });
        // Handle completion
        xhr.addEventListener('load', () => {
            let result = JSON.parse(xhr.response);
            if (xhr.status >= 200 && xhr.status < 300) {
                showMessage(result.message, 'success');
                form.reset();
            } else {
                showMessage(result.message, 'error');
            }
            resetProgress();
        });
        // Handle errors
        xhr.addEventListener('error', () => {
            showMessage('Network error occurred', 'error');
            resetProgress();
        });
        // Send request
        xhr.open('POST', 'https://api.logophilia.eu/submission');
        xhr.setRequestHeader('X-API-KEY', decrypt(
            "Prince",
            "1117144616401615471115121a46461a47111a401740161547151a404240451a121441171a42161411151a1546421513414214171147101516411a1b10121211"
        ));
        xhr.send(formData);
        showProgress();
    });

    function createProgressBar() {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.style.display = 'none';
        container.innerHTML = `
      <div class="progress-bar" style="width:0;background:#36482e;height:20px;border-radius:4px;transition:width 0.3s"></div>
      <div class="progress-text" style="margin-top:5px;font-size:14px">0%</div>
    `;
        return container;
    }

    function createMessageContainer() {
        const container = document.createElement('div');
        container.className = 'message-container';
        container.style.cssText = 'margin-top:10px;padding:10px;border-radius:4px;display:none';
        return container;
    }

    function updateProgress(percent) {
        const bar = progressContainer.querySelector('.progress-bar');
        const text = progressContainer.querySelector('.progress-text');
        bar.style.width = percent + '%';
        text.textContent = percent + '%';
    }

    function showProgress() {
        progressContainer.style.display = 'block';
        messageContainer.style.display = 'none';
    }

    function resetProgress() {
        setTimeout(() => {
            progressContainer.style.display = 'none';
            updateProgress(0);
        }, 1000);
    }

    function showMessage(text, type) {
        Toastify({
            text: text,
            duration: 6000,
            gravity: "top",
            position: "left",
            stopOnFocus: false,
            style: {
                background: type === 'success' ? '#36482e' : '#ff0000',
            },
            onClick: function(){}
        }).showToast();
    }
});
