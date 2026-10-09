// Runs before styles render so lightweight mode never flashes the full-motion UI.
(function () {
    var KEY = 'spectral_lite';
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (error) {}

    function detectWeakDevice() {
        var score = 0;
        var cores = navigator.hardwareConcurrency;
        if (typeof cores === 'number') {
            if (cores <= 2) score += 3;
            else if (cores <= 4) score += 1;
        }
        var memory = navigator.deviceMemory;
        if (typeof memory === 'number') {
            if (memory <= 2) score += 3;
            else if (memory <= 4) score += 1;
        }
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection?.saveData) score += 3;
        try {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) score += 1;
        } catch (error) {}
        if (window.innerWidth <= 720 && typeof cores === 'number' && cores <= 4) score += 1;
        return score >= 3;
    }

    var lite = stored === 'on' ? true : stored === 'off' ? false : detectWeakDevice();
    window.__SPECTRAL_LITE = lite;
    window.__SPECTRAL_LITE_AUTO = stored !== 'on' && stored !== 'off';
    window.__SPECTRAL_LITE_PREFERENCE = stored || 'auto';
    if (lite) document.documentElement.classList.add('lite-mode');
})();
