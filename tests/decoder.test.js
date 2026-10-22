'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { decodeLink, decodeSafeLink, decodeGoogleNews } = require('../decoder.js');

// Real link from news.google.com (2026) - opaque AU_yqL token, no embedded URL
const OPAQUE_NEWS_URL =
    'https://news.google.com/read/CBMiZkFVX3lxTE1vSE9VbTI5U0NaZXkwMllWUnhwNFRHQW9rSWhjUms4WWJUWG4tdVBGa3BtcUxCUEUwZ0pIbk9TZDY1MHhiekw2bFJKSGs3WjEwVDZZU1FXaEhIS2V1OVphVDFVWU41dw?hl=en-US&gl=US&ceid=US%3Aen';

/**
 * Build a legacy-format Google News article ID: field 1 = 19, field 4 = url,
 * optional field 26 = AMP url, base64url-encoded without padding.
 */
function legacyNewsId(url, ampUrl = '') {
    const field = (tag, value) => {
        const body = Buffer.from(value, 'utf8');
        const len = [];
        let n = body.length;
        do {
            len.push((n & 0x7f) | (n > 0x7f ? 0x80 : 0));
            n >>= 7;
        } while (n > 0);
        return Buffer.concat([Buffer.from(tag), Buffer.from(len), body]);
    };
    const msg = Buffer.concat([
        Buffer.from([0x08, 0x13]),
        field([0x22], url),
        field([0xd2, 0x01], ampUrl),
    ]);
    return msg.toString('base64url');
}

test('decodes legacy Google News /articles/ link', () => {
    const id = legacyNewsId('https://www.example.com/news/story-123');
    assert.equal(
        decodeLink(`https://news.google.com/articles/${id}?hl=en-US&gl=US&ceid=US%3Aen`),
        'https://www.example.com/news/story-123'
    );
});

test('decodes legacy Google News /rss/articles/ and /read/ links', () => {
    const id = legacyNewsId('https://example.org/a?b=1', 'https://example.org/amp/a');
    assert.equal(decodeLink(`https://news.google.com/rss/articles/${id}?oc=5`), 'https://example.org/a?b=1');
    assert.equal(decodeLink(`https://news.google.com/read/${id}`), 'https://example.org/a?b=1');
});

test('decodes legacy Google News link whose URL needs a multi-byte length', () => {
    const longUrl = 'https://example.com/' + 'x'.repeat(300);
    assert.equal(decodeGoogleNews(`https://news.google.com/articles/${legacyNewsId(longUrl)}`), longUrl);
});

test('accepts padded base64 article IDs', () => {
    const id = legacyNewsId('https://example.com/p');
    const padded = id + '='.repeat((4 - (id.length % 4)) % 4);
    assert.equal(decodeGoogleNews(`https://news.google.com/articles/${padded}`), 'https://example.com/p');
});

test('reports opaque Google News IDs as not decodable offline', () => {
    assert.throws(() => decodeLink(OPAQUE_NEWS_URL), /only Google can resolve/);
});

test('rejects Google News URL without an article ID', () => {
    assert.throws(() => decodeLink('https://news.google.com/home?hl=en-US'), /does not contain an article ID/);
    assert.throws(() => decodeLink('https://news.google.com/articles/'), /does not contain an article ID/);
});

test('rejects Google News article ID that is not base64url', () => {
    assert.throws(() => decodeLink('https://news.google.com/articles/not%20base64!'), /could not be decoded/);
});

test('rejects Google News ID that embeds a non-http URL', () => {
    const id = legacyNewsId('javascript:alert(1)');
    assert.throws(() => decodeLink(`https://news.google.com/articles/${id}`), /does not contain a destination URL/);
});

test('decodes SafeLink url parameter and strips fragment', () => {
    const wrapped = 'https://can01.safelinks.protection.outlook.com/?url=' +
        encodeURIComponent('https://example.com/page?x=1#frag') + '&data=abc';
    assert.equal(decodeLink(wrapped), 'https://example.com/page?x=1');
});

test('decodes SafeLink a parameter with nested u parameter', () => {
    const inner = 'https://scanner.example.net/?u=' + encodeURIComponent('https://dest.example.com/');
    const wrapped = 'https://nam.safelinks.protection.outlook.com/?a=' + encodeURIComponent(inner);
    assert.equal(decodeSafeLink(wrapped), 'https://dest.example.com/');
});

test('rejects SafeLink without url or a parameter', () => {
    assert.throws(
        () => decodeLink('https://can01.safelinks.protection.outlook.com/?data=abc'),
        /does not contain 'a' or 'url' parameter/
    );
});

test('rejects input that is not a URL', () => {
    assert.throws(() => decodeLink('not a url'), /Invalid URL format/);
});
