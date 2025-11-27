/**
 * Awesome Technologies - Shopping Cart Manager
 * Handles cart operations with localStorage persistence
 */

const CART_STORAGE_KEY = 'awesomeTech_cart';
const WHATSAPP_NUMBER = '+254704546916';

class CartManager {
    constructor() {
        this.items = this.loadFromStorage();
        this.listeners = [];
    }

    // Load cart from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
            this.notifyListeners();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add listener for cart changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.items));
        this.updateCartBadge();
    }

    // Update cart count badge in header
    updateCartBadge() {
        const count = this.getTotalItems();
        const badges = document.querySelectorAll('[id*="cartCount"], [id*="CartCount"]');
        badges.forEach(badge => {
            badge.textContent = count;
        });
    }

    // Get total number of items
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get cart items
    getItems() {
        return [...this.items];
    }

    // Find item by ID
    findItem(productId) {
        return this.items.find(item => item.id === productId);
    }

    // Add item to cart
    addItem(product, quantity = 1) {
        const existingItem = this.findItem(product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
            this.showNotification('Updated cart', `${product.name} quantity increased`);
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                oldPrice: product.oldPrice || null,
                image: product.image,
                specs: product.specs || {},
                quantity: quantity
            });
            this.showNotification('Added to cart', `${product.name} added successfully`);
        }

        this.saveToStorage();
        return true;
    }

    // Update item quantity
    updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            return this.removeItem(productId);
        }

        const item = this.findItem(productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Remove item from cart
    removeItem(productId) {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.id !== productId);
        
        if (this.items.length < initialLength) {
            this.saveToStorage();
            this.showNotification('Removed from cart', 'Item removed successfully');
            return true;
        }
        return false;
    }

    // Clear entire cart
    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.showNotification('Cart cleared', 'All items removed');
    }

    // Calculate cart totals
    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const discount = this.items.reduce((sum, item) => {
            if (item.oldPrice && item.oldPrice > item.price) {
                return sum + ((item.oldPrice - item.price) * item.quantity);
            }
            return sum;
        }, 0);

        const delivery = 0; // Free delivery
        const total = subtotal + delivery;

        return { subtotal, discount, delivery, total, savings: discount };
    }

    // Generate WhatsApp order message
    generateWhatsAppMessage() {
        if (this.items.length === 0) {
            return null;
        }

        const { subtotal, discount, total } = this.calculateTotals();
        
        let message = "Hello! I would like to order the following items:\n\n";
        
        // List all items
        this.items.forEach((item, index) => {
            message += `${index + 1}. *${item.quantity}x ${item.name}*\n`;
            message += `   Brand: ${item.brand}\n`;
            
            if (item.specs && Object.keys(item.specs).length > 0) {
                const specs = [];
                if (item.specs.processor) specs.push(item.specs.processor);
                if (item.specs.ram) specs.push(item.specs.ram);
                if (item.specs.storage) specs.push(item.specs.storage);
                if (specs.length > 0) {
                    message += `   Specs: ${specs.join(', ')}\n`;
                }
            }
            
            message += `   Price: KSh ${(item.price * item.quantity).toLocaleString()}\n`;
            
            if (item.oldPrice && item.oldPrice > item.price) {
                const saved = (item.oldPrice - item.price) * item.quantity;
                message += `   (Save: KSh ${saved.toLocaleString()})\n`;
            }
            
            message += "\n";
        });

        // Add summary
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        message += `📦 Subtotal: KSh ${subtotal.toLocaleString()}\n`;
        
        if (discount > 0) {
            message += `🎉 Discount: -KSh ${discount.toLocaleString()}\n`;
        }
        
        message += `🚚 Delivery: FREE\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *TOTAL: KSh ${total.toLocaleString()}*\n\n`;
        
        if (discount > 0) {
            message += `✨ You save KSh ${discount.toLocaleString()}!\n\n`;
        }
        
        message += "Please confirm availability and estimated delivery time. Thank you! 😊";

        return message;
    }

    // Open WhatsApp with order details
    checkoutViaWhatsApp() {
        const message = this.generateWhatsAppMessage();
        
        if (!message) {
            this.showNotification('Cart is empty', 'Please add items to your cart first', 'warning');
            return false;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappURL, '_blank');
        
        this.showNotification('Opening WhatsApp', 'Your order is ready to send!', 'success');
        return true;
    }

    // Show notification
    showNotification(title, message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 99999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        const iconColor = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        }[type] || '#28a745';

        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }[type] || 'fa-check-circle';

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <i class="fas ${icon}" style="color: ${iconColor}; font-size: 2rem;"></i>
                <div>
                    <strong style="display: block; margin-bottom: 5px; color: #333;">${title}</strong>
                    <span style="color: #666; font-size: 0.9rem;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 1.2rem;
                ">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Get mini cart HTML for dropdown
    getMiniCartHTML() {
        if (this.items.length === 0) {
            return `
                <div style="padding: 30px; text-align: center;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p style="color: #999;">Your cart is empty</p>
                    <a href="shop-new.html" class="btn btn-primary btn-sm">Start Shopping</a>
                </div>
            `;
        }

        const { total } = this.calculateTotals();
        
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        
        this.items.slice(0, 3).forEach(item => {
            html += `
                <div style="display: flex; gap: 10px; padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 5px; background: #f8f9fa;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${item.name.substring(0, 40)}...</div>
                        <div style="color: #999; font-size: 0.8rem;">${item.quantity}x KSh ${item.price.toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (this.items.length > 3) {
            html += `<div style="padding: 10px; text-align: center; color: #999; font-size: 0.9rem;">+${this.items.length - 3} more items</div>`;
        }
        
        html += `
            <div style="padding: 15px; border-top: 2px solid #f0f0f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: 700; font-size: 1.1rem;">
                    <span>Total:</span>
                    <span style="color: var(--bs-primary);">KSh ${total.toLocaleString()}</span>
                </div>
                <a href="cart-new.html" class="btn btn-primary w-100">View Cart</a>
            </div>
        `;
        
        return html;
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create global cart instance
window.cartManager = new CartManager();

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager.updateCartBadge();
});
