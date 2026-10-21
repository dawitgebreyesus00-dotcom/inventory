// Simple barcode generation utility
export const generateBarcode = (sku) => {
  // Generate EAN-13 compatible barcode from SKU
  const prefix = '200'; // Internal use prefix
  const skuDigits = sku.replace(/\D/g, '').padStart(9, '0').slice(0, 9);
  const baseCode = prefix + skuDigits;
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(baseCode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return baseCode + checkDigit;
};

export const generateQRData = (product) => {
  return JSON.stringify({
    id: product._id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    barcode: product.barcode
  });
};

// Generate barcode SVG
export const generateBarcodeSVG = (barcode) => {
  const bars = [];
  const patterns = {
    '0': '0001101', '1': '0011001', '2': '0010011', '3': '0111101',
    '4': '0100011', '5': '0110001', '6': '0101111', '7': '0111011',
    '8': '0110111', '9': '0001011'
  };
  
  // Start pattern
  bars.push('101');
  
  // Left group
  for (let i = 1; i <= 6; i++) {
    bars.push(patterns[barcode[i]]);
  }
  
  // Center pattern
  bars.push('01010');
  
  // Right group (inverted)
  for (let i = 7; i <= 12; i++) {
    const pattern = patterns[barcode[i]];
    bars.push(pattern.split('').map(b => b === '0' ? '1' : '0').join(''));
  }
  
  // End pattern
  bars.push('101');
  
  const binaryString = bars.join('');
  let svg = '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">';
  
  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      svg += `<rect x="${i * 2}" y="10" width="2" height="70" fill="black"/>`;
    }
  }
  
  svg += `<text x="100" y="95" text-anchor="middle" font-family="Arial" font-size="12">${barcode}</text>`;
  svg += '</svg>';
  
  return svg;
};