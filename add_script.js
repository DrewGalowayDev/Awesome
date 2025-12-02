const fs = require('fs');

// Read the HTML file
let html = fs.readFileSync('index.html', 'utf8');

// Check if the script is already added
if (html.includes('js/load-products.js')) {
    console.log('load-products.js script tag is already present');
} else {
    // Add the script tag before </body>
    html = html.replace('</body>', '    <script src="js/load-products.js"></script>\n</body>');
    fs.writeFileSync('index.html', html);
    console.log('Added load-products.js script tag before </body>');
}
