// Load comparison footage only when it is visible, and pause hidden videos.
const comparisonVideos = Array.from(document.querySelectorAll('video[data-autoplay]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateVideo(video) {
    const panel = video.closest('.tab-content');
    const bounds = video.getBoundingClientRect();
    const visible = !document.hidden && (!panel || panel.classList.contains('is-active')) &&
        bounds.width > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight;

    if (!visible) {
        video.dataset.autoPaused = 'true';
        video.pause();
        return;
    }

    if (!reducedMotion.matches && video.dataset.userPaused !== 'true') {
        video.play().catch(() => {});
    }
}

function refreshVideos() {
    comparisonVideos.forEach(updateVideo);
}

const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => updateVideo(entry.target));
}, { threshold: [0, 0.15] });

document.querySelectorAll('video').forEach(video => {
    // Preserve the comparison card and its label if an asset cannot play.
    const showError = () => {
        const container = video.parentElement;
        if (container.querySelector('.video-error')) return;
        const message = document.createElement('p');
        message.className = 'video-error';
        message.setAttribute('role', 'status');
        message.append('Video could not load. ');
        const link = document.createElement('a');
        const source = video.querySelector('source');
        link.href = source.getAttribute('src');
        link.textContent = 'Open video';
        message.append(link);
        container.append(message);
    };
    video.addEventListener('error', showError);
    video.querySelector('source').addEventListener('error', showError);
    video.addEventListener('loadeddata', () => video.parentElement.querySelector('.video-error')?.remove());
});

comparisonVideos.forEach(video => {
    video.addEventListener('pause', () => {
        if (video.dataset.autoPaused !== 'true') video.dataset.userPaused = 'true';
    });
    video.addEventListener('play', () => {
        video.dataset.userPaused = 'false';
        video.dataset.autoPaused = 'false';
    });
    videoObserver.observe(video);
});

function switchTab(groupId, tabName, button) {
    const group = document.getElementById(groupId);
    group.querySelectorAll('.tab-btn').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
    });
    group.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.toggle('is-active', panel.dataset.tab === tabName);
    });
    refreshVideos();
}

document.querySelectorAll('.tab-group').forEach(group => {
    const buttons = Array.from(group.querySelectorAll('.tab-btn'));
    const tabList = group.querySelector('.tab-buttons');
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-label', 'Experiment views');
    // The retained symmetry comparison uses the same accessible tab behavior.
    buttons.forEach((button, index) => {
        const panel = group.querySelectorAll('.tab-content')[index];
        const selected = button.classList.contains('is-active');
        button.id = `${group.id}-${panel.dataset.tab}-tab`;
        panel.id = `${group.id}-${panel.dataset.tab}`;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', panel.id);
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', button.id);
        button.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
            else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = buttons.length - 1;
            else return;
            event.preventDefault();
            buttons[next].focus();
            buttons[next].click();
        });
    });
});

document.addEventListener('visibilitychange', refreshVideos);
reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
        comparisonVideos.forEach(video => {
            video.dataset.autoPaused = 'true';
            video.pause();
        });
    } else refreshVideos();
});

function updateTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
    document.querySelector('.dark-mode-toggle').setAttribute('aria-label',
        isDark ? 'Switch to light theme' : 'Switch to dark theme');
    document.querySelectorAll('img[data-dark-src]').forEach(img => {
        img.src = img.getAttribute(isDark ? 'data-dark-src' : 'data-light-src');
    });
}

function toggleDarkMode() {
    updateTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
}

updateTheme(document.documentElement.getAttribute('data-theme') === 'dark');
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => updateTheme(event.matches));
