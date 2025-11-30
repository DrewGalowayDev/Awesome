/**
 * Admin Orders Management Module
 * Handles order viewing, status updates, and invoice generation with real-time data
 */

let ordersData = [];

// ============================================
// LOAD ORDERS FROM DATABASE
// ============================================

async function loadOrders(status = 'all') {
    try {
        showSpinner(true);

        // Fetch from backend API (admin endpoint)
        const data = await apiRequest('/orders/admin/all');

        if (data.success && data.orders) {
            // Map backend data to frontend structure
            ordersData = data.orders.map(order => ({
                id: order.id,
                orderNumber: order.order_number,
                date: order.created_at,
                customer: order.users?.name || 'N/A',
                email: order.users?.email || '',
                phone: order.users?.phone || 'N/A',
                items: order.order_items?.length || 0,
                amount: parseFloat(order.total_amount),
                payment: order.payment_status,
                status: order.status,
                shippingAddress: order.shipping_address,
                paymentMethod: order.payment_method
            }));

            // Filter by status if not 'all'
            if (status !== 'all') {
                ordersData = ordersData.filter(order => order.status === status);
            }

            renderOrdersTable();
            showToast('success', `Loaded ${ordersData.length} orders`);
        } else {
            ordersData = [];
            renderOrdersTable();
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading orders:', error);
        showAPIError(error);
        ordersData = [];
        renderOrdersTable();
        showSpinner(false);
    }
}

// ============================================
// RENDER ORDERS TABLE
// ============================================

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (ordersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No orders found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ordersData.map(order => `
        <tr data-order-id="${order.id}">
            <td><strong>${order.orderNumber}</strong></td>
            <td>${formatDate(order.date)}</td>
            <td>
                ${order.customer}<br>
                <small class="text-muted">${order.phone}</small>
            </td>
            <td>${order.items}</td>
            <td><strong>${formatCurrency(order.amount)}</strong></td>
            <td>
                <span class="status-badge ${order.payment}">
                    ${order.payment === 'paid' ? '✓ Paid' : order.payment === 'pending' ? 'Pending' : order.payment}
                </span>
            </td>
            <td>
                <select class="form-select form-select-sm status-badge ${order.status}" 
                        onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="action-btn view" onclick="viewOrderDetails('${order.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="printInvoice('${order.id}')" title="Print Invoice">
                    <i class="fas fa-print"></i>
                </button>
                <button class="action-btn" onclick="sendOrderWhatsApp('${order.id}')" title="Send via WhatsApp">
                    <i class="fab fa-whatsapp text-success"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// VIEW ORDER DETAILS
// ============================================

async function viewOrderDetails(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;

    try {
        // Fetch full order details including items
        const data = await apiRequest(`/orders/${orderId}`);

        if (data.success && data.order) {
            const fullOrder = data.order;
            const items = fullOrder.order_items || [];

            const itemsHTML = items.map(item => `
                <tr>
                    <td>${item.product_name || item.products?.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>
            `).join('');

            Swal.fire({
                title: `Order ${order.orderNumber}`,
                html: `
                    <div class="text-start">
                        <h6>Customer Information</h6>
                        <p><strong>Name:</strong> ${order.customer}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p><strong>Phone:</strong> ${order.phone}</p>
                        
                        <hr>
                        
                        <h6>Order Details</h6>
                        <p><strong>Date:</strong> ${formatDateTime(order.date)}</p>
                        <p><strong>Payment:</strong> <span class="status-badge ${order.payment}">${order.payment}</span></p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
                        
                        <hr>
                        
                        <h6>Order Items</h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>
                        
                        <div class="text-end">
                            <strong>Total Amount: ${formatCurrency(order.amount)}</strong>
                        </div>
                        
                        ${order.shippingAddress ? `
                            <hr>
                            <h6>Shipping Address</h6>
                            <p>
                                ${order.shippingAddress.full_name || ''}<br>
                                ${order.shippingAddress.address_line1 || ''}<br>
                                ${order.shippingAddress.city || ''}, ${order.shippingAddress.postal_code || ''}<br>
                                ${order.shippingAddress.country || 'Kenya'}
                            </p>
                        ` : ''}
                    </div>
                `,
                width: 700,
                showCloseButton: true,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showAPIError(error);
    }
}

// ============================================
// UPDATE ORDER STATUS
// ============================================

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.success) {
            // Update local data
            const order = ordersData.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                showToast('success', `Order ${order.orderNumber} updated to ${newStatus}`);

                // Optionally send WhatsApp notification
                if (newStatus === 'shipped' || newStatus === 'delivered') {
                    Swal.fire({
                        title: 'Send Notification',
                        text: 'Do you want to notify the customer via WhatsApp?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, notify',
                        confirmButtonColor: '#25D366'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            sendOrderWhatsApp(orderId);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showAPIError(error);
        // Reload orders to revert UI
        await loadOrders();
    }
}

// ============================================
// SEND ORDER VIA WHATSAPP
// ============================================

function sendOrderWhatsApp(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;

    const statusMessage = {
        'pending': 'Your order has been received and is being processed.',
        'processing': 'Your order is currently being prepared.',
        'shipped': '📦 Your order has been shipped and will arrive soon!',
        'delivered': '✅ Your order has been delivered. Thank you for shopping with us!',
        'cancelled': 'Your order has been cancelled.'
    }[order.status] || 'Order update';

    const message = `Hello ${order.customer}! 👋\n\n` +
        `*Order Update - ${order.orderNumber}*\n\n` +
        `Status: *${order.status.toUpperCase()}*\n` +
        `${statusMessage}\n\n` +
        `Total: ${formatCurrency(order.amount)}\n` +
        `Items: ${order.items} product(s)\n\n` +
        `For any questions, please contact us.\n\n` +
        `Awesome Technologies 🛍️`;

    const phone = order.phone.replace(/[^0-9]/g, '');
    const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, '_blank');
    showToast('success', 'WhatsApp opened with order details');
}

// ============================================
// PRINT INVOICE
// ============================================

function printInvoice(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;

    // Create printable invoice
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${order.orderNumber}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border-bottom: 2px solid #2575fc;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #2575fc;
                    margin: 0;
                }
                .invoice-details { 
                    margin: 20px 0; 
                }
                .invoice-details p {
                    margin: 8px 0;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th, td { 
                    padding: 12px; 
                    border-bottom: 1px solid #ddd; 
                    text-align: left; 
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .total { 
                    font-size: 1.3em; 
                    font-weight: bold;
                    text-align: right;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 2px solid #2575fc;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    color: #666;
                }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Awesome Technologies</h1>
                <p>Electronics & Computing Solutions</p>
            </div>
            
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
                <p><strong>Date:</strong> ${formatDate(order.date)}</p>
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Email:</strong> ${order.email}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${order.items} Product(s)</td>
                        <td>${order.items}</td>
                        <td>${formatCurrency(order.amount / order.items)}</td>
                        <td>${formatCurrency(order.amount)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total">
                <p>TOTAL: ${formatCurrency(order.amount)}</p>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>Awesome Technologies | Phone: +254 704546916 | Email: info@awesometech.co.ke</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);

    invoiceWindow.document.close();
}

// ============================================
// FILTER ORDERS BY STATUS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const statusButtons = document.querySelectorAll('.btn-group[data-status]');
    statusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const status = button.getAttribute('data-status');
            loadOrders(status);

            // Update active button
            document.querySelectorAll('.btn-group button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });
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
