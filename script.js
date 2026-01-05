/**
 * SafeLink URL Decoder - Client-side URL decoder
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
        const safelinkUrl = input.value.trim();

        if (!safelinkUrl) {
            showError('Please enter a SafeLink URL');
            return;
        }

        try {
            const finalUrl = decodeSafeLink(safelinkUrl);
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
     * Main decoding function that processes SafeLink URLs
     * @param {string} safelinkUrl - The SafeLink URL to decode
     * @returns {string} The final decoded URL
     */
    function decodeSafeLink(safelinkUrl) {
        try {
            // Parse the SafeLink URL
            const parsedUrl = new URL(safelinkUrl);

            // Extract query parameters
            const queryParams = parsedUrl.searchParams;

            let decodedUrl;

            // Check for 'a' or 'url' parameter
            if (queryParams.has('a')) {
                decodedUrl = decodeURIComponent(queryParams.get('a'));
            } else if (queryParams.has('url')) {
                decodedUrl = decodeURIComponent(queryParams.get('url'));
            } else {
                throw new Error("The provided SafeLink URL does not contain 'a' or 'url' parameter.");
            }

            // Parse the decoded URL to check for nested parameters
            let finalUrl = decodedUrl;

            try {
                const decodedParsedUrl = new URL(decodedUrl);
                const nestedParams = decodedParsedUrl.searchParams;

                // Check for nested 'u' parameter
                if (nestedParams.has('u')) {
                    const nestedUrl = nestedParams.get('u');
                    finalUrl = decodeURIComponent(nestedUrl);
                }
            } catch (e) {
                // If the decoded URL is not a valid URL, use it as is
                finalUrl = decodedUrl;
            }

            // Remove any fragments from the final URL
            try {
                const finalParsedUrl = new URL(finalUrl);
                finalParsedUrl.hash = '';
                finalUrl = finalParsedUrl.toString();
            } catch (e) {
                // If parsing fails, return the URL as is
            }

            // Validate that we have a proper URL
            if (!finalUrl || !isValidUrl(finalUrl)) {
                throw new Error('The decoded result is not a valid URL');
            }

            return finalUrl;

        } catch (error) {
            if (error.message.includes('Invalid URL')) {
                throw new Error('Invalid SafeLink URL format. Please check the URL and try again.');
            }
            throw error;
        }
    }

    /**
     * Validates if a string is a proper URL
     * @param {string} string - The string to validate
     * @returns {boolean} True if valid URL
     */
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

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
