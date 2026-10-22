/**
 * SafeLink URL Decoder - Client-side UI (decoding logic lives in decoder.js)
 * All processing happens in the browser for maximum privacy
 */

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('safelink-input');
    const decodeBtn = document.getElementById('decode-btn');
    const resultSection = document.getElementById('result-section');
    const errorSection = document.getElementById('error-section');
    const decodedUrlElement = document.getElementById('decoded-url');
    const errorMessage = document.getElementById('error-message');
    const copyBtn = document.getElementById('copy-btn');

    // Decode button click handler
    decodeBtn.addEventListener('click', () => {
        const wrappedUrl = input.value.trim();

        if (!wrappedUrl) {
            showError('Please enter a SafeLink or Google News URL');
            return;
        }

        try {
            const finalUrl = window.LinkDecoder.decodeLink(wrappedUrl);
            showResult(finalUrl);
        } catch (error) {
            showError(error.message);
        }
    });

    // Allow Enter key to trigger decode
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            decodeBtn.click();
        }
    });

    // Copy button click handler
    copyBtn.addEventListener('click', async () => {
        const url = decodedUrlElement.textContent;

        try {
            await navigator.clipboard.writeText(url);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
            copyBtn.classList.add('copied');

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    /**
     * Display the decoded result
     * @param {string} url - The decoded URL to display
     */
    function showResult(url) {
        decodedUrlElement.textContent = url;
        decodedUrlElement.href = url;

        resultSection.classList.remove('hidden');
        errorSection.classList.add('hidden');

        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Display an error message
     * @param {string} message - The error message to display
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorSection.classList.remove('hidden');
        resultSection.classList.add('hidden');

        // Scroll to error
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
