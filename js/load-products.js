
// Backend base (ensure this matches your running API)
const BACKEND_BASE = 'http://localhost:5000';

// Product endpoints and container mapping
const PRODUCT_CONFIGS = [
    { endpoint: '/api/products/new-arrivals?limit=4', containerId: 'justInGrid' },
    { endpoint: '/api/products?limit=50', containerId: 'products-tab-1' }, // All Products - show all
    { endpoint: '/api/products/new-arrivals?limit=50', containerId: 'products-tab-2' }, // New Arrivals
    { endpoint: '/api/products/featured?limit=50', containerId: 'products-tab-3' }, // Featured
    { endpoint: '/api/products/deals?limit=50', containerId: 'products-tab-4' }, // Deals/Top Selling
    { endpoint: '/api/products?limit=200', containerId: 'productListCarousel', isCarousel: true }
];

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting product loading...');
    // Replace any references to missing product-default.png with a safe fallback
    try {
        document.querySelectorAll('img').forEach(img => {
            if (img.getAttribute('src') === 'img/product-default.png') {
                img.src = 'img/product-1.png';
            }
            img.addEventListener('error', function () {
                if (!this.dataset.fallbackApplied) {
                    this.dataset.fallbackApplied = '1';
                    this.src = 'img/product-1.png';
                }
            });
        });
    } catch (e) {
        console.warn('Image fallback registration failed:', e);
    }
    // Consolidate product loading into a single request to avoid backend rate limits
    (async () => {
        await loadAllProductsOnce();
    })();
});

// Helper: fetch with retries on 429 Too Many Requests
async function fetchWithRetries(url, options = {}, maxAttempts = 3, baseDelay = 400) {
    let attempt = 0;
    let lastResp = null;
    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            const resp = await fetch(url, options);
            lastResp = resp;
            if (resp.ok) return resp;
            // If 429, wait and retry
            if (resp.status === 429) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.warn(`${url} returned 429, retrying in ${delay}ms (attempt ${attempt})`);
                // eslint-disable-next-line no-await-in-loop
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            // For other non-ok statuses, don't retry
            return resp;
        } catch (err) {
            console.warn(`Fetch error for ${url} (attempt ${attempt}):`, err);
            const delay = baseDelay * Math.pow(2, attempt - 1);
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return lastResp;
}

// Global cache for product details to populate modal quickly
window._productCache = window._productCache || {};

async function loadProducts(endpoint, containerId, isCarousel = false) {
    try {
        // Try the specific endpoint first. If it 404s or fails, try a more general fallback.
        let response;
        try {
            response = await fetchWithRetries(`${BACKEND_BASE}${endpoint}`);
        } catch (err) {
            console.warn(`Fetch to ${BACKEND_BASE}${endpoint} failed:`, err);
            response = null;
        }

        // If the specific endpoint returned 404 or other non-ok, try fallbacks
        if (!response || !response.ok) {
            console.warn(`${BACKEND_BASE}${endpoint} returned ${response ? response.status : 'no response'}. Trying fallback endpoints.`);
            const fallbacks = [
                `${BACKEND_BASE}/api/products?limit=100`, // general products endpoint on backend
                `/api/products?limit=100` // relative endpoint when backend is same origin or proxied
            ];

            for (const fb of fallbacks) {
                try {
                    const fbResp = await fetchWithRetries(fb);
                    if (fbResp && fbResp.ok) {
                        response = fbResp;
                        console.log(`Fallback succeeded: ${fb}`);
                        break;
                    } else {
                        console.warn(`Fallback ${fb} returned ${fbResp ? fbResp.status : 'no response'}`);
                    }
                } catch (err) {
                    console.warn(`Fallback fetch to ${fb} failed:`, err);
                }
            }
        }

        if (!response) {
            console.error(`All fetch attempts failed for ${endpoint}.`);
            return;
        }

        if (!response.ok) {
            // Non-OK response (e.g., 429 retried out or 404). Try to read text for debugging then abort.
            let txt = null;
            try { txt = await response.text(); } catch (e) { /* ignore */ }
            console.error(`${BACKEND_BASE}${endpoint} returned ${response.status}. Response text:`, txt);
            return;
        }

        // Ensure we only call json() for JSON responses
        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.error('Failed to parse JSON response for', endpoint, e);
                return;
            }
        } else {
            // Not JSON — log and abort
            const txt = await response.text().catch(() => null);
            console.error('Expected JSON but got:', txt);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        // API may return different shapes: { products: [...] }, { data: [...] }, or an array directly
        const products = data.products || data.data || (Array.isArray(data) ? data : null);
        
        if (products && Array.isArray(products) && products.length > 0) {
            // If we fell back to a generic products list, perform client-side filtering
            let selected = products;

            try {
                // Infer desired filter from the original endpoint string
                if (endpoint.includes('new-arrivals')) {
                    // Prefer explicit flag, otherwise take top N
                    const filtered = products.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : products).slice(0, limit);
                } else if (endpoint.includes('featured')) {
                    const filtered = products.filter(p => p.is_featured || p.featured);
                    selected = filtered.length > 0 ? filtered : products.slice(0, 12);
                } else if (endpoint.includes('deals') || endpoint.includes('deal')) {
                    const filtered = products.filter(p => p.is_deal || p.deal || p.on_sale || (p.old_price && p.old_price > p.price));
                    selected = filtered.length > 0 ? filtered : products.slice(0, 12);
                } else {
                    // Generic products listing: respect requested limit if present
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : products.length;
                    selected = products.slice(0, limit);
                }
            } catch (e) {
                console.warn('Client-side filtering failed, falling back to original products array:', e);
                selected = products.slice(0, 12);
            }

            console.log(`Loading ${selected.length} products into ${containerId}`);

            // cache products by id for later detail lookup
            selected.forEach(p => { if (p && (p.id || p._id || p.product_id)) {
                const pid = p.id || p._id || p.product_id;
                window._productCache[pid] = p;
            }});

            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
                // Show the "All Products" section only if products were loaded
                if (containerId === 'productListCarousel' && selected.length > 0) {
                    const section = document.getElementById('allProductsSection');
                    if (section) section.style.display = 'block';
                }
            } else {
                container.innerHTML = selected.map((product, index) => renderProduct(product, index)).join('');
            }

            // Re-initialize animations
            reinitAnimations();
        } else {
            console.warn(`No products found for ${containerId}:`, data);
            // Hide the section if no products
            if (containerId === 'productListCarousel') {
                const section = document.getElementById('allProductsSection');
                if (section) section.style.display = 'none';
            }
        }
    } catch (error) {
        console.error(`Error loading products for ${containerId}:`, error);
        // Hide the section on error
        if (containerId === 'productListCarousel') {
            const section = document.getElementById('allProductsSection');
            if (section) section.style.display = 'none';
        }
    }
}

// Fetch all products once and partition client-side for each PRODUCTS_CONFIG entry.
async function loadAllProductsOnce() {
    try {
        // single fetch for all products (adjust limit as needed)
        const resp = await fetchWithRetries(`${BACKEND_BASE}/api/products?limit=200`);
        if (!resp) {
            console.error('Failed to fetch products: no response');
            // try local mock
            return await _attemptLocalMockLoad();
        }
        if (!resp.ok) {
            const txt = await resp.text().catch(() => null);
            console.error('Products endpoint returned non-ok:', resp.status, txt);
            // try local mock
            return await _attemptLocalMockLoad();
        }
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            const txt = await resp.text().catch(() => null);
            console.error('Expected JSON from products endpoint but got:', txt);
            // try local mock
            return await _attemptLocalMockLoad();
        }
        const allData = await resp.json();
        const allProducts = allData.products || allData.data || (Array.isArray(allData) ? allData : []);
        console.log('✅ Fetched products from API:', allProducts.length, 'products');
        if (!Array.isArray(allProducts) || allProducts.length === 0) {
            console.warn('No products returned from consolidated fetch:', allData);
            return;
        }

        // cache by id
        allProducts.forEach(p => {
            const pid = p && (p.id || p._id || p.product_id);
            if (pid) window._productCache[pid] = p;
        });
        console.log('📦 Cached', allProducts.length, 'products');

        // For each PRODUCT_CONFIG, compute a filtered subset and render into container
        for (const config of PRODUCT_CONFIGS) {
            const { endpoint, containerId, isCarousel } = config;
            const container = document.getElementById(containerId);
            if (!container) continue;

            let selected = [];
            try {
                if (endpoint.includes('new-arrivals')) {
                    const filtered = allProducts.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : allProducts).slice(0, limit);
                } else if (endpoint.includes('featured')) {
                    const filtered = allProducts.filter(p => p.is_featured || p.featured);
                    selected = filtered.length > 0 ? filtered : allProducts.slice(0, 12);
                } else if (endpoint.includes('deals') || endpoint.includes('deal')) {
                    const filtered = allProducts.filter(p => p.is_deal || p.deal || p.on_sale || (p.old_price && p.old_price > p.price));
                    selected = filtered.length > 0 ? filtered : allProducts.slice(0, 12);
                } else {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                }
            } catch (e) {
                console.warn('Filtering error, using fallback slice', e);
                selected = allProducts.slice(0, 12);
            }

            // cache selected items (redundant but safe)
            selected.forEach(p => {
                const pid = p && (p.id || p._id || p.product_id);
                if (pid) window._productCache[pid] = p;
            });

            // render
            console.log(`🎨 Rendering ${selected.length} products into ${containerId}`);
            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
                // Show the "All Products" section only if products were loaded
                if (containerId === 'productListCarousel' && selected.length > 0) {
                    const section = document.getElementById('allProductsSection');
                    if (section) section.style.display = 'block';
                }
            } else {
                const html = selected.map((product, index) => renderProduct(product, index)).join('');
                container.innerHTML = html;
                console.log(`✅ Rendered ${selected.length} product cards into ${containerId}`);
            }
        }

        // re-init animations after DOM injection
        reinitAnimations();
    } catch (err) {
        console.error('loadAllProductsOnce failed:', err);
    }
}

// Attempt to load local mock JSON to keep UI functional when API is down
async function _attemptLocalMockLoad() {
    try {
        console.warn('Attempting to load local mock products: js/mock-products.json');
        const mresp = await fetch('js/mock-products.json');
        if (!mresp || !mresp.ok) {
            console.error('Local mock products not available.');
            return;
        }
        const mock = await mresp.json();
        if (!Array.isArray(mock) || mock.length === 0) {
            console.error('Local mock products file is empty or invalid');
            return;
        }

        // same render path as success
        const allProducts = mock;
        allProducts.forEach(p => {
            const pid = p && (p.id || p._id || p.product_id);
            if (pid) window._productCache[pid] = p;
        });

        for (const config of PRODUCT_CONFIGS) {
            const { endpoint, containerId, isCarousel } = config;
            const container = document.getElementById(containerId);
            if (!container) continue;

            let selected = [];
            try {
                if (endpoint.includes('new-arrivals')) {
                    const filtered = allProducts.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : allProducts).slice(0, limit);
                } else if (endpoint.includes('featured')) {
                    const filtered = allProducts.filter(p => p.is_featured || p.featured);
                    selected = filtered.length > 0 ? filtered : allProducts.slice(0, 12);
                } else if (endpoint.includes('deals') || endpoint.includes('deal')) {
                    const filtered = allProducts.filter(p => p.is_deal || p.deal || p.on_sale || (p.old_price && p.old_price > p.price));
                    selected = filtered.length > 0 ? filtered : allProducts.slice(0, 12);
                } else {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                }
            } catch (e) {
                console.warn('Filtering error on mock data, using fallback slice', e);
                selected = allProducts.slice(0, 12);
            }

            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
            } else {
                container.innerHTML = selected.map((product, index) => renderProduct(product, index)).join('');
            }
        }

        reinitAnimations();
        console.warn('Rendered local mock products');
    } catch (e) {
        console.error('Loading mock products failed:', e);
    }
}

function renderProduct(product, index) {
    // Calculate delay for animation based on index
    const delay = 0.1 + (index % 4) * 0.15;

    // Get image - handle JSONB array or single image field
    let image = 'img/product-1.png';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        image = product.images[0];
    } else if (product.image_url) {
        image = product.image_url;
    } else if (product.image) {
        image = product.image;
    }

    // Determine badges
    let badgeHtml = '';
    if (product.is_new_arrival) {
        badgeHtml = '<div class="product-badge badge-new">New</div>';
    } else if (product.old_price && product.old_price > product.price) {
        badgeHtml = '<div class="product-badge badge-sale">Sale</div>';
    } else if (product.is_deal) {
        badgeHtml = '<div class="product-badge badge-deal">Deal</div>';
    }

    // Extract data
    const title = product.name || 'Product';
    const price = product.price || 0;
    const oldPrice = product.old_price || product.original_price || price;
    const category = (product.categories && product.categories.name) || product.category || 'Electronics';
    const rating = Math.round(product.rating || 5);
    const productId = product.id || product._id || product.product_id || index;

    return `
    <div class="col-md-6 col-lg-4 col-xl-3">
        <div class="product-card wow fadeInUp" data-wow-delay="${delay}s">
            <div class="product-image-wrapper">
                <img src="${image}" class="product-image" alt="${title}" onerror="this.src='img/product-1.png'">
                ${badgeHtml}
                <div class="product-overlay">
                    <button class="btn-view" onclick="viewProduct('${productId}'); return false;" title="Quick View">
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-content">
                <div class="product-category">${category}</div>
                <h3 class="product-title" title="${title}">${title}</h3>
                <div class="product-rating">
                    ${renderStars(rating)}
                </div>
                <div class="product-price">
                    ${oldPrice > price ? `<span class="price-old">KSh ${Math.round(oldPrice).toLocaleString()}</span>` : ''}
                    <span class="price-current">KSh ${Math.round(price).toLocaleString()}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-cart" onclick="addToCart('${productId}'); return false;">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Add To Cart</span>
                </button>
                <div class="product-actions-icons">
                    <button class="btn-icon" title="Compare"><i class="fas fa-random"></i></button>
                    <button class="btn-icon" title="Wishlist"><i class="fas fa-heart"></i></button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderCarouselProduct(product) {
    // Get image - handle JSONB array or single image field
    let image = 'img/product-1.png';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        image = product.images[0];
    } else if (product.image_url) {
        image = product.image_url;
    } else if (product.image) {
        image = product.image;
    }

    const title = product.name || 'Product';
    const price = product.price || 0;
    const oldPrice = product.old_price || product.original_price || price;
    const category = (product.categories && product.categories.name) || product.category || 'Electronics';

    return `
    <div class="productImg-item products-mini-item border">
        <div class="row g-0">
            <div class="col-5">
                <div class="products-mini-img border-end h-100">
                    <img src="${image}" class="img-fluid w-100 h-100" alt="${title}" style="object-fit: cover;" onerror="this.src='img/product-1.png'">
                    <div class="products-mini-icon rounded-circle bg-primary">
                        <a href="#" onclick="viewProduct('${product.id}'); return false;"><i class="fa fa-eye fa-1x text-white"></i></a>
                    </div>
                </div>
            </div>
            <div class="col-7">
                <div class="products-mini-content p-3">
                    <a href="#" class="d-block mb-2">${category}</a>
                    <a href="#" class="d-block h4 text-truncate" title="${title}">${title}</a>
                    ${oldPrice > price ? `<del class="me-2 fs-5">KSh ${Math.round(oldPrice).toLocaleString()}</del>` : ''}
                    <span class="text-primary fs-5">KSh ${Math.round(price).toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div class="products-mini-add border p-3">
            <a href="#" onclick="addToCart('${product.id}'); return false;" class="btn btn-primary border-secondary rounded-pill py-2 px-4"><i class="fas fa-shopping-cart me-2"></i> Add To Cart</a>
            <div class="d-flex">
                <a href="#" class="text-primary d-flex align-items-center justify-content-center me-3"><span class="rounded-circle btn-sm-square border"><i class="fas fa-random"></i></span></a>
                <a href="#" class="text-primary d-flex align-items-center justify-content-center me-0"><span class="rounded-circle btn-sm-square border"><i class="fas fa-heart"></i></span></a>
            </div>
        </div>
    </div>
    `;
}

function reinitAnimations() {
    // Re-init WOW animations
    if (typeof WOW !== 'undefined') {
        try {
            new WOW().init();
        } catch (e) {
            console.warn('WOW animation re-init failed:', e);
        }
    }

    // Re-init Owl Carousels
    if (typeof $ !== 'undefined' && typeof $.fn.owlCarousel !== 'undefined') {
        // Destroy existing instances
        const carousels = ['.productList-carousel', '.productImg-carousel'];
        carousels.forEach(selector => {
            $(selector).each(function() {
                if ($(this).data('owl.carousel')) {
                    $(this).owlCarousel('destroy');
                }
            });
        });

        // Re-initialize
        setTimeout(() => {
            $('.productList-carousel').owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: false,
                dots: false,
                loop: true,
                margin: 25,
                nav: false,
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    992: { items: 4 }
                }
            });

            $('.productImg-carousel').owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: false,
                dots: false,
                loop: true,
                margin: 25,
                nav: false,
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    992: { items: 4 }
                }
            });
        }, 100);
    }
}

function renderStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star text-primary"></i>';
        } else {
            starsHtml += '<i class="fas fa-star"></i>';
        }
    }
    return starsHtml;
}

// Placeholder functions for interactions
function viewProduct(id) {
    // Try to get cached product
    const pid = id;
    const product = (window._productCache && (window._productCache[pid] || window._productCache[String(pid)])) || null;

    // If not cached, attempt to fetch from API (best effort)
    const showModalWith = (prod) => {
        try {
            const modalEl = document.getElementById('productDetailModal');
            if (!modalEl) {
                console.warn('Product modal element not found');
                return;
            }

            // Populate modal fields - ensure image is always set
            const imageEl = modalEl.querySelector('.pd-image');
            const imageSrc = (prod.images && Array.isArray(prod.images) && prod.images[0]) || prod.image_url || prod.image || 'img/product-1.png';
            if (imageEl) {
                imageEl.setAttribute('src', imageSrc);
                imageEl.onerror = function() { this.src = 'img/product-1.png'; };
            }
            
            const titleEl = modalEl.querySelector('.pd-title');
            if (titleEl) titleEl.textContent = prod.name || prod.title || 'Product';
            
            const categoryEl = modalEl.querySelector('.pd-category');
            if (categoryEl) categoryEl.textContent = (prod.categories && prod.categories.name) || prod.category || '';
            const priceEl = modalEl.querySelector('.pd-price');
            if (priceEl) priceEl.textContent = `KSh ${Math.round(prod.price || 0).toLocaleString()}`;
            
            const oldEl = modalEl.querySelector('.pd-oldprice');
            if (oldEl) {
                if (prod.old_price && prod.old_price > prod.price) {
                    oldEl.textContent = `KSh ${Math.round(prod.old_price).toLocaleString()}`;
                    oldEl.style.display = 'inline-block';
                } else {
                    oldEl.style.display = 'none';
                }
            }

            const descEl = modalEl.querySelector('.pd-desc');
            if (descEl) descEl.textContent = prod.description || prod.summary || prod.short_description || 'No description available.';

            const featuresEl = modalEl.querySelector('.pd-features');
            if (featuresEl) {
                featuresEl.innerHTML = '';
                if (prod.features && Array.isArray(prod.features)) {
                    prod.features.forEach(f => {
                        const li = document.createElement('li');
                        li.textContent = f;
                        featuresEl.appendChild(li);
                    });
                }
            }

            // Show Bootstrap modal
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        } catch (e) {
            console.error('Failed to show product modal:', e);
        }
    };

    if (product) {
        showModalWith(product);
        return;
    }

    // Fallback: try fetching single product from backend
    (async () => {
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/products/${pid}`);
            if (resp.ok) {
                const prod = await resp.json();
                // Some APIs wrap the object under data/products
                const obj = prod.product || prod.data || prod;
                if (obj) {
                    window._productCache[pid] = obj;
                    showModalWith(obj);
                    return;
                }
            }
        } catch (e) {
            console.warn('Product fetch failed for', pid, e);
        }
        alert('Product details are not available.');
    })();
}

function addToCart(id) {
    console.log('Add to cart:', id);
    // TODO: Integrate with cart manager if available
    if (window.cartManager && typeof window.cartManager.addToCart === 'function') {
        window.cartManager.addToCart(id);
    }
}

function addToCartPlaceholder() {
    alert('Add to cart clicked from details modal.');
}

