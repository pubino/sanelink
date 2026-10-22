/**
 * Link decoders - pure functions shared by the browser UI and the test suite.
 * Supports Microsoft SafeLink URLs and Google News article links.
 * No network requests are made; everything is decoded locally.
 */

(function (root) {
    'use strict';

    const GOOGLE_NEWS_HOST = 'news.google.com';

    // Newer Google News IDs wrap an opaque token with this prefix instead of the URL
    const GOOGLE_NEWS_OPAQUE_PREFIX = 'AU_yqL';

    /**
     * Decode any supported link, choosing the decoder from the URL's host
     * @param {string} input - The wrapped URL to decode
     * @returns {string} The final decoded URL
     */
    function decodeLink(input) {
        let parsedUrl;
        try {
            parsedUrl = new URL(input);
        } catch (e) {
            throw new Error('Invalid URL format. Please check the URL and try again.');
        }

        if (parsedUrl.hostname === GOOGLE_NEWS_HOST) {
            return decodeGoogleNews(input);
        }
        return decodeSafeLink(input);
    }

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
     * Decode a Google News article link (/articles/, /rss/articles/, /read/ paths).
     * The article ID is a base64url-encoded protobuf; older IDs embed the
     * destination URL, newer ones hold an opaque token only Google can resolve.
     * @param {string} newsUrl - The Google News URL to decode
     * @returns {string} The final decoded URL
     */
    function decodeGoogleNews(newsUrl) {
        const parsedUrl = new URL(newsUrl);
        const articleId = extractGoogleNewsId(parsedUrl.pathname);

        let bytes;
        try {
            bytes = base64UrlToBytes(articleId);
        } catch (e) {
            throw new Error('The Google News article ID could not be decoded.');
        }

        const strings = readProtobufStrings(bytes);

        const embeddedUrl = strings.find(isValidUrl);
        if (embeddedUrl) {
            return embeddedUrl;
        }

        if (strings.some((s) => s.startsWith(GOOGLE_NEWS_OPAQUE_PREFIX))) {
            throw new Error(
                'This Google News link uses an encrypted article ID that only Google can resolve. ' +
                'It cannot be decoded offline without contacting Google.'
            );
        }

        throw new Error('The Google News article ID does not contain a destination URL.');
    }

    /**
     * Pull the article ID out of a Google News path
     * @param {string} pathname - The URL path
     * @returns {string} The article ID
     */
    function extractGoogleNewsId(pathname) {
        const segments = pathname.split('/').filter(Boolean);
        const markerIndex = segments.findIndex((s) => s === 'articles' || s === 'read');

        if (markerIndex === -1 || markerIndex + 1 >= segments.length) {
            throw new Error('The Google News URL does not contain an article ID.');
        }
        return segments[markerIndex + 1];
    }

    /**
     * Decode a base64url string (padding optional) to bytes
     * @param {string} value - base64url text
     * @returns {Uint8Array} Decoded bytes
     */
    function base64UrlToBytes(value) {
        if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
            throw new Error('Not base64url');
        }
        let base64 = value.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
        base64 += '='.repeat((4 - (base64.length % 4)) % 4);

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Walk a protobuf message and collect every length-delimited field that is
     * valid UTF-8. Parsing stops quietly at the first malformed field.
     * @param {Uint8Array} bytes - Encoded protobuf message
     * @returns {string[]} Decoded string fields, in order
     */
    function readProtobufStrings(bytes) {
        const utf8 = new TextDecoder('utf-8', { fatal: true });
        const strings = [];
        let pos = 0;

        function readVarint() {
            let result = 0;
            let shift = 0;
            while (pos < bytes.length && shift < 35) {
                const byte = bytes[pos++];
                result += (byte & 0x7f) * Math.pow(2, shift);
                if ((byte & 0x80) === 0) {
                    return result;
                }
                shift += 7;
            }
            throw new Error('Malformed varint');
        }

        try {
            while (pos < bytes.length) {
                const wireType = readVarint() % 8;

                if (wireType === 0) {
                    readVarint();
                } else if (wireType === 1) {
                    pos += 8;
                } else if (wireType === 5) {
                    pos += 4;
                } else if (wireType === 2) {
                    const length = readVarint();
                    if (pos + length > bytes.length) {
                        break;
                    }
                    try {
                        strings.push(utf8.decode(bytes.subarray(pos, pos + length)));
                    } catch (e) {
                        // Not text (e.g. a nested message); skip it
                    }
                    pos += length;
                } else {
                    break;
                }
            }
        } catch (e) {
            // Keep whatever was read before the malformed field
        }

        return strings;
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

    const api = { decodeLink, decodeSafeLink, decodeGoogleNews, isValidUrl };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.LinkDecoder = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
