# SafeLink URL Decoder

A client-side web application for decoding Microsoft SafeLink and Google News URLs to reveal their final destinations. All processing happens locally in your browser for complete privacy.

## Features

- **100% Client-Side**: All URL decoding happens in your browser - no server requests
- **Privacy-First**: No data is transmitted or stored anywhere
- **Easy to Use**: Simply paste a SafeLink URL and click decode
- **Copy to Clipboard**: One-click copying of decoded URLs
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Attractive orange and black design with smooth animations

## How It Works

SafeLink URLs are used by Microsoft Outlook to wrap external links for security. This tool extracts the original destination URL by:

1. Parsing the SafeLink URL to find the `url` or `a` parameter
2. Decoding any URL encoding
3. Checking for nested URLs (such as additional scanner/proxy URLs)
4. Removing URL fragments for a clean final result

### Google News links

Google News article links (`news.google.com/articles/…`, `/rss/articles/…`, `/read/…`) carry a base64url-encoded protobuf ID. The decoder reads that ID locally and returns the embedded publisher URL.

**Limitation:** links created since mid-2024 usually use an opaque ID (it decodes to a token starting with `AU_yqL`) that holds no destination URL. Only Google's servers can resolve these. To keep the zero-network guarantee, the app reports that the link can't be decoded offline rather than contacting Google.

### Example

**SafeLink URL:**
```
https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com&data=...
```

**Decoded URL:**
```
https://example.com
```

## Installation

Simply host the static files on any web server:

- `index.html`
- `style.css`
- `decoder.js`
- `script.js`
- `components/`, `tokens/`, `assets/`

No build process or dependencies required.

## Usage

1. Open the application in your web browser
2. Paste a SafeLink URL into the text area
3. Click "Decode URL" or press Ctrl+Enter
4. View the decoded destination URL
5. Click "Copy" to copy the URL to your clipboard

## Technical Details

- Pure HTML, CSS, and JavaScript
- No external dependencies
- Uses modern Web APIs (URL, URLSearchParams, Clipboard API)
- Fully compatible with modern browsers

## Testing

The decoders are covered by Node's built-in test runner (no dependencies):

```sh
npm test
# or, in a container
docker build -t sanelink-test . && docker run --rm sanelink-test
```

## Privacy

This tool was designed with privacy as a top priority:

- All URL processing happens in your browser
- No analytics or tracking
- No data is sent to any server
- No cookies or local storage used

## License

MIT License - see LICENSE.md for details

## Copyright

Copyright © 2026 Princeton University
