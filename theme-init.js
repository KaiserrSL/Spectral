// Set the saved palette before visible markup is parsed to avoid a dark flash.
try {
    if (localStorage.getItem('spectral_theme') === 'light') {
        document.body.classList.add('light-theme');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f7f8f6');
    }
} catch (error) {
    // Storage can be disabled; the default dark palette still works.
}
