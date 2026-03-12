/* eslint-env es2020 */
import React, { useState } from 'react';
import './App.css';
import { encrypt, decrypt } from './crypto';

function App() {
  const [inputText, setInputText] = useState('hello, how are you');
  const sampleTexts = [
    'hello, how are you',
    'The quick brown fox jumps over the lazy dog.',
    'In the heart of the forest, where sunlight filters through the canopy like liquid gold, there exists a hidden grove untouched by time. Ancient trees stand sentinel, their roots entwined with the earth in a dance that has lasted for centuries.'
  ];
  const [encodedNumber, setEncodedNumber] = useState('');
  const [a, setA] = useState('');  // A = encoded digits as integer
  const [b, setB] = useState('');  // B = power of 10 (length of encoded string)
  const [decodeInput, setDecodeInput] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
  const [decodeA, setDecodeA] = useState('');
  const [decodeB, setDecodeB] = useState('');
  const [decodeMode, setDecodeMode] = useState('decimal'); // 'decimal' or 'ratio'
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogContent, setDialogContent] = useState(null); // { title, value }
  const [useEncryption, setUseEncryption] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [decodePassphrase, setDecodePassphrase] = useState('');
  const [decodeEncrypted, setDecodeEncrypted] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false); // tracks if current encoding used encryption
  const [copiedField, setCopiedField] = useState(null); // tracks which field was just copied

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const encodeText = (text) => {
    const punctuationMap = {
      ' ': '00',
      '.': '27',
      ',': '28',
      '!': '29',
      '?': '30',
      '-': '31',
      "'": '32',
      '"': '33',
      ':': '34',
      ';': '35',
      '(': '36',
      ')': '37',
      '\n': '38'
    };

    let encoded = '';
    for (let char of text.toLowerCase()) {
      if (char >= 'a' && char <= 'z') {
        const charCode = char.charCodeAt(0) - 96;
        encoded += charCode.toString().padStart(2, '0');
      } else if (punctuationMap[char] !== undefined) {
        encoded += punctuationMap[char];
      } else if (char === '\n' || char === '\r') {
        encoded += '38';
      }
    }

    return encoded;
  };

  const decodeFromDigits = (digitStr) => {
    // digitStr is the raw encoded digit string (e.g., "080512121500...")
    const paddedStr = digitStr.length % 2 === 1 ? '0' + digitStr : digitStr;
    const pairs = paddedStr.match(/.{1,2}/g);
    if (!pairs) return '';

    const punctuationDecode = {
      '27': '.',
      '28': ',',
      '29': '!',
      '30': '?',
      '31': '-',
      '32': "'",
      '33': '"',
      '34': ':',
      '35': ';',
      '36': '(',
      '37': ')',
      '38': '\n'
    };

    let decoded = '';
    for (let pair of pairs) {
      const num = parseInt(pair);
      if (num === 0) {
        decoded += ' ';
      } else if (num >= 1 && num <= 26) {
        decoded += String.fromCharCode(num + 96);
      } else if (punctuationDecode[pair]) {
        decoded += punctuationDecode[pair];
      }
    }

    return decoded.trim();
  };


  const handleDecode = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      let digitStr;
      if (decodeMode === 'decimal') {
        const match = decodeInput.match(/^0\.(\d+)$/);
        if (!match) {
          setDecodedText('Invalid format. Use 0.xxxx format');
          setIsProcessing(false);
          return;
        }
        digitStr = match[1];
      } else {
        if (!decodeA || !decodeB || decodeB === '0') {
          setDecodedText('Invalid A or B values');
          setIsProcessing(false);
          return;
        }
        const bNum = parseInt(decodeB);
        digitStr = decodeA.padStart(bNum, '0');
      }

      if (decodeEncrypted && decodePassphrase) {
        // digitStr is 3-digit-per-byte encrypted data — decrypt first
        const plaintext = await decrypt(digitStr, decodePassphrase);
        setDecodedText(plaintext);
      } else {
        setDecodedText(decodeFromDigits(digitStr));
      }
    } catch (error) {
      setDecodedText('Decryption failed — wrong passphrase or corrupted data.');
    }

    setIsProcessing(false);
  };

  const handleEncode = async () => {
    setIsProcessing(true);

    if (inputText.length > 5000) {
      alert('Text too long. Please limit to 5000 characters for performance.');
      setIsProcessing(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 10));

    let encoded;
    try {
      if (useEncryption && passphrase) {
        // Encrypt first, then the ciphertext bytes become the digit string
        encoded = await encrypt(inputText, passphrase);
        setIsEncrypted(true);
      } else {
        encoded = encodeText(inputText);
        setIsEncrypted(false);
      }
    } catch (error) {
      alert('Encryption failed: ' + error.message);
      setIsProcessing(false);
      return;
    }

    if (encoded.length > 15000) {
      alert('Encoded text too long. Please use a shorter message.');
      setIsProcessing(false);
      return;
    }

    setEncodedNumber(encoded);

    const aValue = encoded.replace(/^0+/, '') || '0';
    const bValue = encoded.length.toString();
    setA(aValue);
    setB(bValue);

    setIsProcessing(false);
  };

  // For plank visualization: A out of 10^B
  const aPercentage = encodedNumber ? (parseFloat('0.' + encodedNumber) * 100) : 0;

  return (
    <div className="App">
      <div className="graffiti-bg" aria-hidden="true">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Row 1 - top */}
          <g transform="translate(50, 40) scale(0.9)" className="haring h1">
            <circle cx="25" cy="10" r="12" />
            <path d="M25 22 L25 55" /><path d="M25 30 L5 50" /><path d="M25 30 L50 18" />
            <path d="M25 55 L10 80" /><path d="M25 55 L40 80" />
            <line x1="52" y1="8" x2="62" y2="5" /><line x1="54" y1="16" x2="64" y2="15" /><line x1="50" y1="24" x2="60" y2="25" />
          </g>
          <g transform="translate(280, 30) scale(0.7)" className="haring h4">
            <path d="M25 18 Q25 0 12 0 Q0 0 0 14 Q0 30 25 48 Q50 30 50 14 Q50 0 38 0 Q25 0 25 18" />
          </g>
          <g transform="translate(500, 50) scale(0.8)" className="haring h2">
            <circle cx="18" cy="8" r="10" />
            <path d="M18 18 L18 45" /><path d="M18 26 L2 38" /><path d="M18 26 L34 38" />
            <path d="M18 45 L8 62" /><path d="M18 45 L28 62" />
          </g>
          <g transform="translate(750, 35) scale(0.65)" className="haring h3">
            <path d="M0 30 L15 30 L15 10 L40 10 L40 0 L60 0 L60 10 L70 15 L70 30 L80 30 L80 50 L60 50 L60 55 L15 55 L15 50 L0 50 Z" />
            <line x1="65" y1="-2" x2="78" y2="-12" /><line x1="68" y1="4" x2="82" y2="0" /><line x1="70" y1="10" x2="84" y2="12" />
          </g>
          <g transform="translate(920, 60)" className="haring h1">
            <line x1="0" y1="0" x2="22" y2="22" /><line x1="22" y1="0" x2="0" y2="22" />
          </g>

          {/* Row 2 */}
          <g transform="translate(30, 200) scale(0.75)" className="haring h3">
            <circle cx="30" cy="10" r="11" />
            <path d="M30 21 L30 50" /><path d="M30 30 L55 16" /><path d="M30 30 L5 16" />
            <path d="M30 50 L18 72" /><path d="M30 50 L42 72" />
            <line x1="12" y1="78" x2="48" y2="78" /><line x1="16" y1="83" x2="44" y2="83" />
          </g>
          <path d="M200 220 Q260 185 320 220 Q380 255 440 220 Q500 185 560 220" className="haring-line hl1" />
          <g transform="translate(620, 190) scale(0.7)" className="haring h2">
            <path d="M25 40 Q10 40 10 25 Q10 10 25 10 Q35 10 35 20 L35 45 L45 55 M25 45 L15 55" />
            <line x1="5" y1="5" x2="-5" y2="-5" /><line x1="20" y1="-2" x2="20" y2="-14" />
            <line x1="38" y1="5" x2="48" y2="-3" /><line x1="42" y1="22" x2="54" y2="20" />
          </g>
          <g transform="translate(850, 210) scale(0.8)" className="haring h4">
            <circle cx="25" cy="25" r="25" />
            <circle cx="15" cy="20" r="4" /><circle cx="35" cy="20" r="4" /><circle cx="25" cy="14" r="3" />
            <path d="M15 33 Q25 40 35 33" />
          </g>

          {/* Row 3 */}
          <g transform="translate(80, 370) scale(0.7)" className="haring h4">
            <path d="M25 18 Q25 0 12 0 Q0 0 0 14 Q0 30 25 48 Q50 30 50 14 Q50 0 38 0 Q25 0 25 18" />
          </g>
          <g transform="translate(250, 350) scale(0.85)" className="haring h1">
            <circle cx="25" cy="10" r="12" />
            <path d="M25 22 L25 55" /><path d="M25 30 L50 18" /><path d="M25 30 L5 50" />
            <path d="M25 55 L10 80" /><path d="M25 55 L40 80" />
          </g>
          <path d="M420 380 L450 345 L480 380 L510 345 L540 380 L570 345" className="haring-line hl2" />
          <g transform="translate(680, 360) scale(0.7)" className="haring h3">
            <path d="M0 30 L15 30 L15 10 L40 10 L40 0 L60 0 L60 10 L70 15 L70 30 L80 30 L80 50 L60 50 L60 55 L15 55 L15 50 L0 50 Z" />
            <line x1="65" y1="-2" x2="78" y2="-12" /><line x1="68" y1="4" x2="82" y2="0" />
          </g>
          <g transform="translate(920, 370)" className="haring h2">
            <line x1="0" y1="0" x2="18" y2="18" /><line x1="18" y1="0" x2="0" y2="18" />
          </g>

          {/* Row 4 */}
          <g transform="translate(40, 530) scale(0.8)" className="haring h2">
            <circle cx="20" cy="8" r="11" />
            <path d="M20 19 L20 48" /><path d="M20 27 L0 18" /><path d="M20 27 L44 38" />
            <path d="M20 48 L5 72" /><path d="M20 48 L38 68" />
          </g>
          <g transform="translate(200, 540) scale(0.6)" className="haring h4">
            <circle cx="25" cy="25" r="25" />
            <circle cx="15" cy="20" r="4" /><circle cx="35" cy="20" r="4" /><circle cx="25" cy="14" r="3" />
            <path d="M15 33 Q25 40 35 33" />
          </g>
          <path d="M380 550 Q440 515 500 550 Q560 585 620 550 Q680 515 740 550" className="haring-line hl1" />
          <g transform="translate(820, 520) scale(0.75)" className="haring h1">
            <circle cx="25" cy="10" r="12" />
            <path d="M25 22 L25 55" /><path d="M25 30 L5 50" /><path d="M25 30 L50 18" />
            <path d="M25 55 L10 80" /><path d="M25 55 L40 80" />
            <line x1="52" y1="8" x2="62" y2="5" /><line x1="54" y1="16" x2="64" y2="15" />
          </g>

          {/* Row 5 */}
          <g transform="translate(60, 700) scale(0.65)" className="haring h3">
            <path d="M0 30 L15 30 L15 10 L40 10 L40 0 L60 0 L60 10 L70 15 L70 30 L80 30 L80 50 L60 50 L60 55 L15 55 L15 50 L0 50 Z" />
            <line x1="65" y1="-2" x2="78" y2="-12" /><line x1="68" y1="4" x2="82" y2="0" /><line x1="70" y1="10" x2="84" y2="12" />
          </g>
          <g transform="translate(280, 710) scale(0.7)" className="haring h4">
            <path d="M25 18 Q25 0 12 0 Q0 0 0 14 Q0 30 25 48 Q50 30 50 14 Q50 0 38 0 Q25 0 25 18" />
          </g>
          <g transform="translate(480, 690) scale(0.8)" className="haring h2">
            <circle cx="18" cy="8" r="10" />
            <path d="M18 18 L18 45" /><path d="M18 26 L2 38" /><path d="M18 26 L34 38" />
            <path d="M18 45 L8 62" /><path d="M18 45 L28 62" />
          </g>
          <path d="M650 720 L680 685 L710 720 L740 685 L770 720 L800 685" className="haring-line hl2" />
          <g transform="translate(880, 700)" className="haring h1">
            <line x1="0" y1="0" x2="22" y2="22" /><line x1="22" y1="0" x2="0" y2="22" />
          </g>

          {/* Row 6 - bottom */}
          <g transform="translate(50, 870) scale(0.8)" className="haring h1">
            <circle cx="25" cy="10" r="12" />
            <path d="M25 22 L25 55" /><path d="M25 30 L50 18" /><path d="M25 30 L5 50" />
            <path d="M25 55 L10 80" /><path d="M25 55 L40 80" />
          </g>
          <path d="M220 890 Q280 855 340 890 Q400 925 460 890 Q520 855 580 890" className="haring-line hl1" />
          <g transform="translate(660, 860) scale(0.7)" className="haring h2">
            <path d="M25 40 Q10 40 10 25 Q10 10 25 10 Q35 10 35 20 L35 45 L45 55 M25 45 L15 55" />
            <line x1="5" y1="5" x2="-5" y2="-5" /><line x1="20" y1="-2" x2="20" y2="-14" />
            <line x1="38" y1="5" x2="48" y2="-3" />
          </g>
          <g transform="translate(880, 880) scale(0.6)" className="haring h4">
            <circle cx="25" cy="25" r="25" />
            <circle cx="15" cy="20" r="4" /><circle cx="35" cy="20" r="4" />
            <path d="M15 33 Q25 40 35 33" />
          </g>
        </svg>
      </div>
      <div className="container">
        <h1>Plank <span className="accent">Encoder</span></h1>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'encode' ? 'active' : ''}`}
            onClick={() => setActiveTab('encode')}
          >
            Encode
          </button>
          <button
            className={`tab-button ${activeTab === 'decode' ? 'active' : ''}`}
            onClick={() => setActiveTab('decode')}
          >
            Decode
          </button>
        </div>

        {activeTab === 'encode' && (
          <>
            <div className="input-section">
              <label htmlFor="message">Enter your message:</label>
              <input
                id="message"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your message..."
              />
              <div className="encryption-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useEncryption}
                    onChange={(e) => setUseEncryption(e.target.checked)}
                  />
                  <span>Encrypt with AES-256</span>
                </label>
                {useEncryption && (
                  <input
                    type="text"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase..."
                    className="passphrase-input"
                  />
                )}
              </div>
              <button onClick={handleEncode} disabled={isProcessing || (useEncryption && !passphrase)}>
              {isProcessing ? 'Encoding...' : 'Encode'}
            </button>
            <div className="sample-texts">
              <p>Try these samples:</p>
              {sampleTexts.map((text, index) => (
                <button
                  key={index}
                  className="sample-button"
                  onClick={() => setInputText(text)}
                >
                  Sample {index + 1}
                </button>
              ))}
            </div>
            </div>

            {encodedNumber && (
              <div className="results">
                <div className="result-section">
                  <h3>Decimal Point: {copiedField === 'decimal' && <span className="copied-badge">Copied!</span>}</h3>
                  <p className="encoded-number copyable" onClick={() => copyToClipboard('0.' + encodedNumber, 'decimal')}>0.{encodedNumber}</p>
                </div>

                <div className="result-section">
                  <h3>A/B Values:</h3>
                  <p className="ab-value copyable" onClick={() => copyToClipboard(a, 'a')}>A = <span className="ab-number">{a}</span> {copiedField === 'a' && <span className="copied-badge">Copied!</span>}</p>
                  <p className="ab-value copyable" onClick={() => copyToClipboard(b, 'b')}>B = {b} {copiedField === 'b' && <span className="copied-badge">Copied!</span>}</p>
                </div>

                <div className="visualization">
                  <h3>Wooden Plank Visualization:</h3>
                  <p className="encoding-info">Point at A / 10<sup>B</sup> along the plank</p>
                  <div className="plank-container">
                    <div className="plank">
                      <div
                        className="section-a"
                        style={{ width: `${aPercentage}%` }}
                      >
                        <span className="label clickable" onClick={() => setDialogContent({ title: 'A', value: a })}>A</span>
                      </div>
                      <div
                        className="section-b"
                        style={{ width: `${100 - aPercentage}%` }}
                      >
                        <span className="label clickable" onClick={() => setDialogContent({ title: <>10<sup>B</sup> = 10<sup>{b}</sup></>, value: '1' + '0'.repeat(parseInt(b)) })}>10<sup>B</sup></span>
                      </div>
                    </div>
                    <div className="plank-info">
                      Total Length: 10<sup>{b}</sup> units
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'decode' && (
          <>
            <div className="decode-mode-selector">
              <label>
                <input
                  type="radio"
                  value="decimal"
                  checked={decodeMode === 'decimal'}
                  onChange={(e) => setDecodeMode(e.target.value)}
                />
                Decode from Decimal (0.xxxx)
              </label>
              <label>
                <input
                  type="radio"
                  value="ratio"
                  checked={decodeMode === 'ratio'}
                  onChange={(e) => setDecodeMode(e.target.value)}
                />
                <span>Decode from A / 10<sup>B</sup></span>
              </label>
            </div>

            {decodeMode === 'decimal' && (
              <div className="input-section">
                <label htmlFor="decodeNumber">Enter encoded decimal (0.xxxx):</label>
                <input
                  id="decodeNumber"
                  type="text"
                  value={decodeInput}
                  onChange={(e) => setDecodeInput(e.target.value)}
                  placeholder="0.080512121500081523000118050025152128"
                />
              </div>
            )}

            {decodeMode === 'ratio' && (
              <div className="input-section">
                <label htmlFor="decodeA">Enter A (integer):</label>
                <input
                  id="decodeA"
                  type="text"
                  value={decodeA}
                  onChange={(e) => setDecodeA(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 80512121500081523000118050025152128"
                />
                <label htmlFor="decodeB">Enter B (power of 10):</label>
                <input
                  id="decodeB"
                  type="text"
                  value={decodeB}
                  onChange={(e) => setDecodeB(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 36"
                />
                <p className="encoding-info">Decodes A / 10<sup>B</sup> back to text</p>
              </div>
            )}

            <div className="encryption-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={decodeEncrypted}
                  onChange={(e) => setDecodeEncrypted(e.target.checked)}
                />
                <span>Encrypted with AES-256</span>
              </label>
              {decodeEncrypted && (
                <input
                  type="text"
                  value={decodePassphrase}
                  onChange={(e) => setDecodePassphrase(e.target.value)}
                  placeholder="Enter passphrase..."
                  className="passphrase-input"
                />
              )}
            </div>
            <button onClick={handleDecode} disabled={isProcessing || (decodeEncrypted && !decodePassphrase)}>
              {isProcessing ? 'Decoding...' : 'Decode'}
            </button>

            {decodedText && (
              <div className="results">
                <div className="result-section">
                  <h3>Decoded Message:</h3>
                  <p className="decoded-text">{decodedText}</p>
                </div>
              </div>
            )}

            {a && b && decodeMode === 'decimal' && (
              <div className="ratio-helper">
                <p>From encoding: A={a.length > 30 ? a.slice(0, 27) + '...' : a}, B={b}</p>
                <button
                  onClick={() => {
                    setDecodeInput('0.' + encodedNumber);
                    if (isEncrypted) {
                      setDecodeEncrypted(true);
                    }
                  }}
                >
                  Use encoded values
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {dialogContent && (
        <div className="dialog-overlay" onClick={() => setDialogContent(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{dialogContent.title}</h3>
              <button className="dialog-close" onClick={() => setDialogContent(null)}>&times;</button>
            </div>
            <div className="dialog-body">
              <p className="dialog-number">{dialogContent.value}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
