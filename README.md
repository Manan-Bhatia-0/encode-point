# Plank Encoder

A text encoding tool that converts messages into decimal numbers and A/10^B representations.

**Live:** [https://Manan-Bhatia-0.github.io/encode-point](https://Manan-Bhatia-0.github.io/encode-point)

## How It Works

Each character maps to a 2-digit number:
- Letters: a=01, b=02, ..., z=26
- Space: 00
- Punctuation: `.`=27, `,`=28, `!`=29, `?`=30, `-`=31, `'`=32, `"`=33, `:`=34, `;`=35, `(`=36, `)`=37, newline=38

The encoded digits form a decimal `0.xxxxx`, which is expressed as **A / 10^B** — where A is the digit string (leading zeros stripped) and B is its length.

### Encryption

Optional AES-256-GCM encryption layer using the Web Crypto API. When enabled, the message is encrypted with a passphrase (PBKDF2 key derivation, 100k iterations) before encoding. The same passphrase is required to decode.

## Development

```
npm install
npm start
```

## Deploy

```
npm run deploy
```
