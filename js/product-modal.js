// Product Modal — creates a Bootstrap modal for showing product details
(function () {
    // Create modal HTML and append to body
    const modalHtml = `
    <div class="modal fade" id="productDetailModal" tabindex="-1" aria-labelledby="productDetailModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title" id="productDetailModalLabel">Product Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div id="productModalCarousel" class="carousel slide" data-bs-ride="carousel">
                  <div class="carousel-inner" id="productModalImages"></div>
                  <button class="carousel-control-prev" type="button" data-bs-target="#productModalCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#productModalCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <h3 id="productModalTitle" class="mb-2"></h3>
                <p id="productModalShort" class="text-muted"></p>
                <h4 id="productModalPrice" class="text-primary mb-3"></h4>
                <div id="productModalSpecs" class="mb-3"></div>
                <p id="productModalDescription" class="small text-justify"></p>

                <div class="d-flex gap-2 mt-4">
                  <input id="productModalQty" type="number" min="1" value="1" class="form-control w-auto" style="max-width:100px">
                  <button id="productModalAddToCart" class="btn btn-warning">Add to Cart</button>
                  <button id="productModalWhatsapp" class="btn btn-success">Chat on WhatsApp</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('productDetailModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        // Event delegation: open modal when clicking product card or view button
        document.body.addEventListener('click', async (e) => {
            const btn = e.target.closest('.view-product-btn');
            const card = e.target.closest('.product-card');
            if (btn || card) {
                e.preventDefault();
                const el = btn || card;
                // If button has data-product-id, prefer that
                const productId = el.dataset && el.dataset.productId ? el.dataset.productId : (card && card.dataset ? card.dataset.productId : null);
                if (productId) {
                    try {
                        const resp = await fetch(`/api/products/${productId}`);
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data && data.product) openProductModal(data.product);
                            else openProductModal(data);
                        } else {
                            // fallback to reading from DOM
                            openProductModal(extractProductFromElement(el));
                        }
                    } catch (err) {
                        openProductModal(extractProductFromElement(el));
                    }
                } else {
                    openProductModal(extractProductFromElement(el));
                }
            }
        });

        // Add to cart
        document.getElementById('productModalAddToCart').addEventListener('click', () => {
            const id = document.getElementById('productDetailModal').dataset.productId;
            const title = document.getElementById('productModalTitle').textContent;
            const priceText = document.getElementById('productModalPrice').textContent.replace(/[KSh,\s]/g, '');
            const price = parseFloat(priceText) || 0;
            const qty = parseInt(document.getElementById('productModalQty').value) || 1;
            if (window.cartManager && id) {
                window.cartManager.addItem({ id, name: title, price, qty, image: document.querySelector('#productModalImages img')?.src || '' });
                const modal = bootstrap.Modal.getInstance(document.getElementById('productDetailModal'));
                if (modal) modal.hide();
            } else {
                alert('Cart not available');
            }
        });

        // WhatsApp button
        document.getElementById('productModalWhatsapp').addEventListener('click', () => {
            const title = document.getElementById('productModalTitle').textContent;
            const qty = parseInt(document.getElementById('productModalQty').value) || 1;
            const priceText = document.getElementById('productModalPrice').textContent.replace(/[KSh,\s]/g, '');
            const price = parseFloat(priceText) || 0;
            const total = (price * qty).toFixed(0);
            const msg = `Hello, I'm interested in *${title}* (x${qty}). Total KSh ${total}. Please advise availability and delivery.`;
            const waNumber = (window.WHATSAPP_NUMBER || '+254704546916').replace(/\D/g, '');
            const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        });
    });

    function extractProductFromElement(el) {
        // look for common selectors inside card
        const root = el.closest('.product-card') || el;
        const img = root.querySelector('img') ? root.querySelector('img').src : '';
        const title = root.querySelector('.product-title') ? root.querySelector('.product-title').textContent.trim() : (root.querySelector('h3') ? root.querySelector('h3').textContent.trim() : 'Product');
        const price = root.querySelector('.product-price') ? root.querySelector('.product-price').textContent.trim() : (root.querySelector('.price') ? root.querySelector('.price').textContent.trim() : '');
        const desc = root.querySelector('.product-desc') ? root.querySelector('.product-desc').textContent.trim() : (root.querySelector('.description') ? root.querySelector('.description').textContent.trim() : '');
        return { id: root.dataset && root.dataset.productId ? root.dataset.productId : null, name: title, price: parsePrice(price), short_description: desc, images: img ? [img] : [] };
    }

    function parsePrice(text) {
        if (!text) return 0;
        const num = text.replace(/[^0-9.]/g, '');
        return parseFloat(num) || 0;
    }

    // Open modal with product object
    window.openProductModal = function (product) {
        const modalEl = document.getElementById('productDetailModal');
        modalEl.dataset.productId = product.id || '';
        document.getElementById('productModalTitle').textContent = product.name || product.title || 'Product';
        document.getElementById('productModalShort').textContent = product.short_description || product.summary || '';
        document.getElementById('productModalPrice').textContent = product.price ? `KSh ${Number(product.price).toLocaleString('en-KE')}` : (product.price_display || '');
        document.getElementById('productModalDescription').textContent = product.description || product.long_description || '';

        const specsEl = document.getElementById('productModalSpecs');
        specsEl.innerHTML = '';
        if (product.specs) {
            const ul = document.createElement('ul');
            ul.className = 'small';
            for (const key in product.specs) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${product.specs[key]}`;
                ul.appendChild(li);
            }
            specsEl.appendChild(ul);
        }

        const imagesContainer = document.getElementById('productModalImages');
        imagesContainer.innerHTML = '';
        const images = product.images && product.images.length ? product.images : (product.image ? [product.image] : []);
        if (images.length === 0) images.push('img/header-img.jpg');
        images.forEach((src, i) => {
            const active = i === 0 ? 'active' : '';
            const item = document.createElement('div');
            item.className = `carousel-item ${active}`;
            item.innerHTML = `<img src="${src}" class="d-block w-100" style="object-fit:contain; max-height:420px;">`;
            imagesContainer.appendChild(item);
        });

        const modal = new bootstrap.Modal(modalEl, { keyboard: true });
        modal.show();
    };

})();
