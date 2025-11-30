/**
 * Admin Products Management Module
 * Handles product CRUD operations with real-time database integration
 */

let productsData = [];
let productsTable = null;
let categoriesData = [];

// ============================================
// LOAD PRODUCTS FROM DATABASE
// ============================================

async function loadProducts() {
    try {
        showSpinner(true);

        // Fetch from backend API
        const data = await apiRequest('/products');

        if (data.success && data.products) {
            productsData = data.products.map(product => ({
                id: product.id,
                name: product.name,
                brand: product.brand || 'N/A',
                price: parseFloat(product.price),
                oldPrice: product.old_price ? parseFloat(product.old_price) : null,
                stock: parseInt(product.stock),
                category: product.category_id,
                condition: product.condition,
                image: product.images && product.images.length > 0 ? product.images[0] : 'img/product-default.png',
                featured: product.is_featured,
                slug: product.slug,
                description: product.description,
                specifications: product.specifications
            }));

            renderProductsTable();
            showToast('success', `Loaded ${productsData.length} products`);
        } else {
            productsData = [];
            renderProductsTable();
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading products:', error);
        showAPIError(error);
        productsData = [];
        renderProductsTable();
        showSpinner(false);
    }
}

// ============================================
// LOAD CATEGORIES FOR DROPDOWNS
// ============================================

async function loadCategoriesForProducts() {
    try {
        const data = await apiRequest('/categories');
        if (data.success && data.categories) {
            categoriesData = data.categories;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ============================================
// RENDER PRODUCTS TABLE
// ============================================

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (productsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-box fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No products found</p>
                    <button class="btn btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus me-2"></i>Add Your First Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productsData.map(product => `
        <tr data-product-id="${product.id}">
            <td>
                <input type="checkbox" class="product-checkbox" value="${product.id}">
            </td>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-img" 
                     onerror="this.src='img/product-default.png'">
            </td>
            <td>
                <strong>${product.name}</strong>
                ${product.featured ? '<span class="badge bg-warning ms-2">Featured</span>' : ''}
            </td>
            <td>${product.brand}</td>
            <td>
                <strong>${formatCurrency(product.price)}</strong>
                ${product.oldPrice ? `<br><del class="text-muted small">${formatCurrency(product.oldPrice)}</del>` : ''}
            </td>
            <td>
                <span class="badge ${getStockBadgeClass(product.stock)}">${product.stock}</span>
            </td>
            <td>
                <span class="status-badge ${product.condition}">${product.condition}</span>
            </td>
            <td>
                <button class="action-btn edit" onclick="editProduct('${product.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn view" onclick="viewProduct('${product.id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn" onclick="sendProductWhatsApp('${product.id}')" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp text-success"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Initialize select all checkbox
    initSelectAll();
}

// Get stock badge class
function getStockBadgeClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
}

// ============================================
// ADD PRODUCT
// ============================================

function showAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
    document.getElementById('addProductForm').reset();

    // Populate category dropdown
    populateCategoryDropdown('addProductForm');

    modal.show();
}

function populateCategoryDropdown(formId) {
    const select = document.querySelector(`#${formId} select[name="category"]`);
    if (select && categoriesData.length > 0) {
        select.innerHTML = '<option value="">Select category...</option>' +
            categoriesData.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
}

async function saveProduct() {
    const form = document.getElementById('addProductForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const productData = {
        name: formData.get('name'),
        slug: formData.get('name').toLowerCase().replace(/\s+/g, '-'),
        brand: formData.get('brand'),
        price: parseFloat(formData.get('price')),
        old_price: formData.get('oldPrice') ? parseFloat(formData.get('oldPrice')) : null,
        stock: parseInt(formData.get('stock')),
        category_id: formData.get('category'),
        condition: formData.get('condition'),
        description: formData.get('description') || '',
        is_featured: formData.get('featured') === 'on',
        images: ['img/product-default.png'], // TODO: Implement image upload
        specifications: {}
    };

    try {
        const response = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        if (response.success) {
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            await loadProducts();
            showToast('success', 'Product added successfully!');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showAPIError(error);
    }
}

// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
        title: 'Edit Product',
        html: `
            <form id="editProductForm" class="text-start">
                <div class="mb-3">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-control" value="${product.name}" id="editName" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Brand</label>
                    <input type="text" class="form-control" value="${product.brand}" id="editBrand" required>
                </div>
                <div class="row">
                    <div class="col-6 mb-3">
                        <label class="form-label">Price (KSh)</label>
                        <input type="number" class="form-control" value="${product.price}" id="editPrice" required>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label">Stock</label>
                        <input type="number" class="form-control" value="${product.stock}" id="editStock" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="editDescription" rows="3">${product.description || ''}</textarea>
                </div>
            </form>
        `,
        width: 600,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        confirmButtonColor: '#2575fc',
        preConfirm: async () => {
            const updatedData = {
                name: document.getElementById('editName').value,
                slug: document.getElementById('editName').value.toLowerCase().replace(/\s+/g, '-'),
                brand: document.getElementById('editBrand').value,
                price: parseFloat(document.getElementById('editPrice').value),
                stock: parseInt(document.getElementById('editStock').value),
                description: document.getElementById('editDescription').value
            };

            try {
                const response = await apiRequest(`/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });

                if (response.success) {
                    await loadProducts();
                    showToast('success', 'Product updated successfully!');
                }
            } catch (error) {
                Swal.showValidationMessage(`Error: ${error.message}`);
                return false;
            }
        }
    });
}

// ============================================
// VIEW PRODUCT
// ============================================

function viewProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const categoryName = categoriesData.find(c => c.id === product.category)?.name || 'N/A';

    Swal.fire({
        title: product.name,
        html: `
            <div class="text-start">
                <img src="${product.image}" alt="${product.name}" class="img-fluid mb-3 rounded" 
                     onerror="this.src='img/product-default.png'">
                <p><strong>Brand:</strong> ${product.brand}</p>
                <p><strong>Price:</strong> ${formatCurrency(product.price)}</p>
                ${product.oldPrice ? `<p><strong>Old Price:</strong> ${formatCurrency(product.oldPrice)}</p>` : ''}
                <p><strong>Stock:</strong> ${product.stock} units</p>
                <p><strong>Category:</strong> ${categoryName}</p>
                <p><strong>Condition:</strong> ${product.condition}</p>
                ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
                ${product.featured ? '<span class="badge bg-warning">Featured Product</span>' : ''}
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: 600
    });
}

// ============================================
// DELETE PRODUCT
// ============================================

function deleteProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
        title: 'Delete Product',
        text: `Are you sure you want to delete "${product.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await apiRequest(`/products/${productId}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    await loadProducts();
                    showToast('success', 'Product deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                showAPIError(error);
            }
        }
    });
}

// ============================================
// WHATSAPP SHARE
// ============================================

function sendProductWhatsApp(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
        title: 'Share Product',
        html: `
            <div class="text-start">
                <p class="mb-3">Send ${product.name} via WhatsApp</p>
                <label class="form-label">Customer Phone</label>
                <input type="tel" class="form-control" id="customerPhone" placeholder="+254 7XX XXX XXX">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send via WhatsApp',
        confirmButtonColor: '#25D366',
        preConfirm: () => {
            const phone = document.getElementById('customerPhone').value;
            if (!phone) {
                Swal.showValidationMessage('Please enter phone number');
                return false;
            }

            const discount = product.oldPrice ? product.oldPrice - product.price : 0;
            const message = `Hello! Check out this product:\n\n*${product.name}*\nBrand: ${product.brand}\nPrice: ${formatCurrency(product.price)}\n${product.oldPrice ? `Save ${formatCurrency(discount)}!` : ''}\n\nStock: ${product.stock} units available\n\nOrder now! 😊`;

            const whatsappURL = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        }
    });
}

// ============================================
// EXPORT PRODUCTS
// ============================================

function exportProducts() {
    showToast('info', 'Exporting products...');

    // Create CSV content
    const headers = ['ID', 'Name', 'Brand', 'Price', 'Stock', 'Condition'];
    const rows = productsData.map(p => [
        p.id, p.name, p.brand, p.price, p.stock, p.condition
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showToast('success', 'Products exported successfully!');
}

// ============================================
// SELECT ALL FUNCTIONALITY
// ============================================

function initSelectAll() {
    const selectAll = document.getElementById('selectAll');
    if (!selectAll) return;

    selectAll.addEventListener('change', (e) => {
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
}

// ============================================
// SEARCH & FILTER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                const filtered = productsData.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    p.brand.toLowerCase().includes(query)
                );

                const tempData = productsData;
                productsData = filtered;
                renderProductsTable();
                productsData = tempData;
            }, 300);
        });
    }

    const filterSelect = document.getElementById('productFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', async (e) => {
            const category = e.target.value;
            if (!category) {
                await loadProducts();
                return;
            }

            try {
                const data = await apiRequest(`/products/category/${category}`);
                if (data.success && data.products) {
                    const tempData = productsData;
                    productsData = data.products.map(product => ({
                        id: product.id,
                        name: product.name,
                        brand: product.brand || 'N/A',
                        price: parseFloat(product.price),
                        oldPrice: product.old_price ? parseFloat(product.old_price) : null,
                        stock: parseInt(product.stock),
                        category: product.category_id,
                        condition: product.condition,
                        image: product.images && product.images.length > 0 ? product.images[0] : 'img/product-default.png',
                        featured: product.is_featured
                    }));
                    renderProductsTable();
                }
            } catch (error) {
                console.error('Error filtering products:', error);
                showAPIError(error);
            }
        });
    }

    // Load categories for filter dropdown
    loadCategoriesForProducts();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}
