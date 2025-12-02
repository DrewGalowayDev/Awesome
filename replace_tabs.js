const fs = require('fs');

// Read the HTML file
let html = fs.readFileSync('index.html', 'utf8');

// Find the position of each tab and replace its content
// Tab 1 - All Products
const tab1Start = html.indexOf('<div id="tab-1" class="tab-pane fade show p-0 active">');
const tab1End = html.indexOf('<div id="tab-2"', tab1Start);
if (tab1Start !== -1 && tab1End !== -1) {
    const tab1Content = `<div id="tab-1" class="tab-pane fade show p-0 active">
                        <div class="row g-4" id="products-all">
                        </div>
                    </div>
                    `;
    html = html.substring(0, tab1Start) + tab1Content + html.substring(tab1End);
}

// Re-find positions after first replacement
const tab2Start = html.indexOf('<div id="tab-2" class="tab-pane fade show p-0">');
const tab2End = html.indexOf('<div id="tab-3"', tab2Start);
if (tab2Start !== -1 && tab2End !== -1) {
    const tab2Content = `<div id="tab-2" class="tab-pane fade show p-0">
                        <div class="row g-4" id="products-new">
                        </div>
                    </div>
                    `;
    html = html.substring(0, tab2Start) + tab2Content + html.substring(tab2End);
}

// Re-find positions
const tab3Start = html.indexOf('<div id="tab-3" class="tab-pane fade show p-0">');
const tab3End = html.indexOf('<div id="tab-4"', tab3Start);
if (tab3Start !== -1 && tab3End !== -1) {
    const tab3Content = `<div id="tab-3" class="tab-pane fade show p-0">
                        <div class="row g-4" id="products-featured">
                        </div>
                    </div>
                    `;
    html = html.substring(0, tab3Start) + tab3Content + html.substring(tab3End);
}

// Re-find positions
const tab4Start = html.indexOf('<div id="tab-4" class="tab-pane fade show p-0">');
const tab4EndMarker = '</div>\n                </div>\n            </div>\n        </div>\n    </div>\n    <!-- Our Products End -->';
const tab4End = html.indexOf(tab4EndMarker, tab4Start);
if (tab4Start !== -1 && tab4End !== -1) {
    const tab4Content = `<div id="tab-4" class="tab-pane fade show p-0">
                        <div class="row g-4" id="products-selling">
                        </div>
                    </div>
                `;
    html = html.substring(0, tab4Start) + tab4Content + html.substring(tab4End);
}

// Write the modified HTML back
fs.writeFileSync('index.html', html);
console.log('Successfully replaced all product tabs with dynamic containers!');
console.log('Tab containers created:');
console.log('- #products-all');
console.log('- #products-new');
console.log('- #products-featured');
console.log('- #products-selling');
