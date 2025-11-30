/**
 * Admin WhatsApp Module
 * Handles WhatsApp marketing and customer communication
 */

// Initialize WhatsApp Forms
document.addEventListener('DOMContentLoaded', () => {
    // Initialize product selector for WhatsApp
    loadProductSelector();

    // WhatsApp Product Form
    const productForm = document.getElementById('whatsappProductForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendProductViaWhatsApp();
        });
    }

    // WhatsApp Broadcast Form
    const broadcastForm = document.getElementById('whatsappBroadcastForm');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendBroadcast();
        });
    }
});

// Load Product Selector
function loadProductSelector() {
    const select = document.getElementById('whatsappProduct');
    if (!select) return;
    // Fetch products from API to populate selector
    const API_BASE = '/api';
    select.innerHTML = '<option value="">Loading products...</option>';

    fetch(`${API_BASE}/products?limit=1000`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(json => {
            const products = json.products || [];
            window.adminProductsCache = products; // small global cache for admin tools
            select.innerHTML = '<option value="">Choose a product...</option>' +
                products.map(p => `<option value="${p.id}">${p.name} - KSh ${Number(p.price || p.price_display || 0).toLocaleString()}</option>`).join('');
        })
        .catch(err => {
            console.error('Failed to load products for admin selector', err);
            select.innerHTML = '<option value="">Failed to load products</option>';
        });
}

// Send Product via WhatsApp
function sendProductViaWhatsApp() {
    const productId = document.getElementById('whatsappProduct').value;
    const phone = document.getElementById('customerPhone').value;

    if (!productId || !phone) {
        showToast('error', 'Please select a product and enter customer phone');
        return;
    }

    // Find product in cache, otherwise fetch single product
    const API_BASE = '/api';
    function buildMessage(product) {
        if (!product) return null;
        const name = product.name || product.title || 'Product';
        const price = Number(product.price || product.price_display || 0);
        const oldPrice = Number(product.oldPrice || product.old_price || 0) || null;

        let msg = `Hello! 👋\n\n` +
            `🛍️ Check out this product:\n\n` +
            `*${name}*\n\n` +
            `💰 Price: KSh ${price.toLocaleString()}\n`;

        if (oldPrice) {
            msg += `🏷️ Was: KSh ${oldPrice.toLocaleString()}\n`;
            msg += `💸 Save: KSh ${(oldPrice - price).toLocaleString()}!\n`;
        }

        msg += `\n✅ In Stock\n` +
            `🚚 Free Delivery\n\n` +
            `Order now and don't miss out!\n\n` +
            `Awesome Technologies 🎯`;

        return msg;
    }

    (async () => {
        try {
            let product = (window.adminProductsCache || []).find(p => String(p.id) === String(productId));
            if (!product) {
                const resp = await fetch(`${API_BASE}/products/${productId}`);
                if (resp.ok) {
                    const json = await resp.json();
                    product = json.product || null;
                }
            }

            const message = buildMessage(product);
            if (!message) {
                showToast('error', 'Product not found');
                return;
            }

            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

            window.open(whatsappURL, '_blank');
            showToast('success', 'WhatsApp opened with product details!');

            // Reset form
            document.getElementById('whatsappProductForm').reset();
        } catch (err) {
            console.error('Error sending product via WhatsApp', err);
            showToast('error', 'Failed to prepare WhatsApp message');
        }
    })();

}

// Send Broadcast
function sendBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    const target = document.getElementById('broadcastTarget').value;

    if (!message) {
        showToast('error', 'Please enter a message');
        return;
    }

    Swal.fire({
        title: 'Confirm Broadcast',
        html: `
            <div class="text-start">
                <p><strong>Target:</strong> ${target === 'all' ? 'All Customers' : target === 'active' ? 'Active Customers' : 'VIP Customers'}</p>
                <p><strong>Message:</strong></p>
                <div class="p-3 bg-light rounded">${message}</div>
                <p class="mt-3 text-muted small">
                    <i class="fas fa-info-circle"></i> This will open WhatsApp Web multiple times. 
                    You'll need to send each message manually to comply with WhatsApp policies.
                </p>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Send Broadcast',
        confirmButtonColor: '#25D366'
    }).then((result) => {
        if (result.isConfirmed) {
            // Sample customer numbers
            const customers = {
                all: ['+254712345678', '+254723456789', '+254734567890'],
                active: ['+254712345678', '+254723456789'],
                vip: ['+254712345678']
            }[target];

            let sentCount = 0;
            const fullMessage = `${message}\n\n_Sent from Awesome Technologies_`;

            customers.forEach((phone, index) => {
                setTimeout(() => {
                    const whatsappURL = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(fullMessage)}`;
                    window.open(whatsappURL, '_blank');
                    sentCount++;

                    if (sentCount === customers.length) {
                        showToast('success', `Broadcast sent to ${sentCount} customers!`);
                    }
                }, index * 2000); // Delay to avoid overwhelming
            });

            // Reset form
            document.getElementById('whatsappBroadcastForm').reset();
        }
    });
}

// Quick WhatsApp Templates
const whatsappTemplates = {
    newArrival: `🎉 New Arrival Alert!\n\nCheck out our latest products at amazing prices! Limited stock available.\n\nVisit our store today! 🛍️`,

    promotion: `💥 FLASH SALE!\n\nUp to 40% OFF on selected items!\nOffer valid for 48 hours only.\n\nDon't miss out! 🏃‍♂️`,

    thankYou: `Thank you for shopping with us! 💖\n\nYour order has been confirmed and will be delivered soon.\n\nAwesome Technologies - Your Tech Partner! ✨`
};
