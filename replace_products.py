import re

# Read the HTML file
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Pattern to find and replace tab content
# We'll replace the content between the tab div and its closing, keeping only the row with the new ID

# Tab 1 - All Products
tab1_start = '<div id="tab-1" class="tab-pane fade show p-0 active">'
tab1_end_pattern = r'(<div id="tab-1" class="tab-pane fade show p-0 active">)(.*?)(</div>\s*<div id="tab-2")'
tab1_replacement = r'\1\n                        <div class="row g-4" id="products-all">\n                        </div>\n                    \3'
html = re.sub(tab1_end_pattern, tab1_replacement, html, flags=re.DOTALL)

# Tab 2 - New Arrivals
tab2_end_pattern = r'(<div id="tab-2" class="tab-pane fade show p-0">)(.*?)(</div>\s*<div id="tab-3")'
tab2_replacement = r'\1\n                        <div class="row g-4" id="products-new">\n                        </div>\n                    \3'
html = re.sub(tab2_end_pattern, tab2_replacement, html, flags=re.DOTALL)

# Tab 3 - Featured
tab3_end_pattern = r'(<div id="tab-3" class="tab-pane fade show p-0">)(.*?)(</div>\s*<div id="tab-4")'
tab3_replacement = r'\1\n                        <div class="row g-4" id="products-featured">\n                        </div>\n                    \3'
html = re.sub(tab3_end_pattern, tab3_replacement, html, flags=re.DOTALL)

# Tab 4 - Top Selling
tab4_end_pattern = r'(<div id="tab-4" class="tab-pane fade show p-0">)(.*?)(</div>\s*</div>\s*</div>)'
tab4_replacement = r'\1\n                        <div class="row g-4" id="products-selling">\n                        </div>\n                    \3'
html = re.sub(tab4_end_pattern, tab4_replacement, html, flags=re.DOTALL)

# Write the modified HTML back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully replaced all mock product data with dynamic containers!")
