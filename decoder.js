/**
 * Link decoders - pure functions shared by the browser UI and the test suite.
 * Supports Microsoft SafeLink URLs.
 * No network requests are made; everything is decoded locally.
 */

(function (root) {
    'use strict';

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

    const api = { decodeSafeLink, isValidUrl };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.LinkDecoder = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
