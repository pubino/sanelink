/**
 * Siempre Customizer Utility
 * Calculates HSL color variations from a base accent color in real-time
 * and updates CSS variables in :root, matching the Siempre theme PHP logic.
 */
(function() {
  function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function generatePalette(baseHex) {
    if (baseHex.toLowerCase() === '#e77500') {
      return {
        base: '#e77500',
        medium: '#C1560E',
        light: '#F7964A',
        lighter: '#FEECDE',
        lightest: '#FFF7F2',
        dark: '#C1560E',
        darker: '#6D2E03',
        darkest: '#411C02',
        rgba_5: 'rgba(231, 117, 0, 0.05)',
        rgba_10: 'rgba(231, 117, 0, 0.10)',
        rgba_15: 'rgba(231, 117, 0, 0.15)',
      };
    }

    const rgb = hexToRgb(baseHex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      base: baseHex,
      medium: hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 5)),
      light: hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 10)),
      lighter: hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20)),
      lightest: hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 25)),
      dark: hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 10)),
      darker: hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20)),
      darkest: hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(0, hsl.l - 30)),
      rgba_5: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
      rgba_10: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)`,
      rgba_15: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    };
  }

  window.updateSiempreAccent = function(baseHex) {
    const colors = generatePalette(baseHex);
    if (!colors) return;

    let styleEl = document.getElementById('siempre-custom-theme');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'siempre-custom-theme';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      :root {
        --siempre-accent: ${colors.base};
        --siempre-accent-medium: ${colors.medium};
        --siempre-accent-light: ${colors.light};
        --siempre-accent-lighter: ${colors.lighter};
        --siempre-accent-lightest: ${colors.lightest};
        --siempre-accent-dark: ${colors.dark};
        --siempre-accent-darker: ${colors.darker};
        --siempre-accent-darkest: ${colors.darkest};
        --siempre-accent-bg-light: ${colors.rgba_5};
        --siempre-accent-bg-medium: ${colors.rgba_10};
        --siempre-accent-shadow: ${colors.rgba_15};
      }
    `;

    localStorage.setItem('siempre-accent-color', baseHex);

    // Sync form inputs on page if they exist
    const colorPickers = document.querySelectorAll('.siempre-color-picker');
    colorPickers.forEach(el => {
      if (el.value !== baseHex) el.value = baseHex;
    });
    const colorTexts = document.querySelectorAll('.siempre-color-text');
    colorTexts.forEach(el => {
      if (el.value !== baseHex) el.value = baseHex;
    });
  };

  // On page load, initialize from local storage or defaults
  document.addEventListener('DOMContentLoaded', () => {
    const storedColor = localStorage.getItem('siempre-accent-color') || '#e77500';
    window.updateSiempreAccent(storedColor);

    // Bind event handlers to picker elements
    document.body.addEventListener('input', (e) => {
      if (e.target.classList.contains('siempre-color-picker') || e.target.classList.contains('siempre-color-text')) {
        window.updateSiempreAccent(e.target.value);
      }
    });

    // Reset button handler
    document.body.addEventListener('click', (e) => {
      if (e.target.classList.contains('siempre-color-reset')) {
        window.updateSiempreAccent('#e77500');
      }
    });
  });
})();
