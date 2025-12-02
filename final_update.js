const fs = require('fs');

console.log('Starting HTML modification...');

// Read the HTML file
let html;
try {
    html = fs.readFileSync('index.html', 'utf8');
    console.log('✓ Read index.html successfully');
} catch (err) {
    console.error('Error reading index.html:', err.message);
    process.exit(1);
}

// Function to replace content between start and end markers
function replaceBetween(text, startMarker, endMarker, newContent) {
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        return { modified: false, text };
    }

    const result = text.substring(0, startIndex) + startMarker + newContent + text.substring(endIndex);
    return { modified: true, text: result };
}

// Replace Tab 1 - All Products
console.log('Replacing Tab 1 content...');
let result = replaceBetween(
    html,
    '<div id="tab-1" class="tab-pane fade show p-0 active">',
    '<div id="tab-2"',
    `\n                        <div class="row g-4" id="products-all">\n                        </div>\n                    </div>\n                    `
);
if (result.modified) {
    html = result.text;
    console.log('✓ Tab 1 replaced successfully');
} else {
    console.log('✗ Failed to find Tab 1 markers');
}

// Replace Tab 2 - New Arrivals  
console.log('Replacing Tab 2 content...');
result = replaceBetween(
    html,
    '<div id="tab-2" class="tab-pane fade show p-0">',
    '<div id="tab-3"',
    `\n                        <div class="row g-4" id="products-new">\n                        </div>\n                    </div>\n                    `
);
if (result.modified) {
    html = result.text;
    console.log('✓ Tab 2 replaced successfully');
} else {
    console.log('✗ Failed to find Tab 2 markers');
}

// Replace Tab 3 - Featured
console.log('Replacing Tab 3 content...');
result = replaceBetween(
    html,
    '<div id="tab-3" class="tab-pane fade show p-0">',
    '<div id="tab-4"',
    `\n                        <div class="row g-4" id="products-featured">\n                        </div>\n                    </div>\n                    `
);
if (result.modified) {
    html = result.text;
    console.log('✓ Tab 3 replaced successfully');
} else {
    console.log('✗ Failed to find Tab 3 markers');
}

// Replace Tab 4 - Top Selling
console.log('Replacing Tab 4 content...');
result = replaceBetween(
    html,
    '<div id="tab-4" class="tab-pane fade show p-0">',
    '<!-- Our Products End -->',
    `\n                        <div class="row g-4" id="products-selling">\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n    `
);
if (result.modified) {
    html = result.text;
    console.log('✓ Tab 4 replaced successfully');
} else {
    console.log('✗ Failed to find Tab 4 markers');
}

// Add script tag if not present
if (!html.includes('js/load-products.js')) {
    html = html.replace('</body>', '    <script src="js/load-products.js"></script>\n</body>');
    console.log('✓ Added load-products.js script tag');
} else {
    console.log('✓ load-products.js script tag already present');
}

// Write the modified HTML back
try {
    fs.writeFileSync('index.html', html);
    console.log('\n✓ Successfully wrote changes to index.html');
    console.log('\nDynamic product containers created:');
    console.log('  • #products-all (All Products tab)');
    console.log('  • #products-new (New Arrivals tab)');
    console.log('  • #products-featured (Featured tab)');
    console.log('  • #products-selling (Top Selling tab)');
    console.log('\nAll mock product data has been removed.');
    console.log('Products will now load dynamically from the backend API.');
} catch (err) {
    console.error('Error writing index.html:', err.message);
    process.exit(1);
}
