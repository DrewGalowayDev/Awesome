/**
 * Admin Customers Management Module
 * Handles customer viewing, search, and export with real-time data
 */

let customersData = [];

// ============================================
// LOAD CUSTOMERS FROM DATABASE
// ============================================

async function loadCustomers() {
    try {
        showSpinner(true);

        // Fetch from backend API (admin endpoint)
        const data = await apiRequest('/users/admin/all');

        if (data.success && data.users) {
            // Map backend data and calculate statistics
            customersData = data.users
                .filter(user => user.role === 'customer')
                .map(user => {
                    // Calculate total from orders if available
                    const orders = user.orders || [];
                    const totalOrders = orders.length;
                    const totalSpent = orders
                        .filter(o => o.payment_status === 'paid')
                        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || 'N/A',
                        orders: totalOrders,
                        totalSpent: totalSpent,
                        joined: user.created_at,
                        lastOrder: orders.length > 0 ? orders[orders.length - 1].created_at : null
                    };
                });

            renderCustomersTable();
            showToast('success', `Loaded ${customersData.length} customers`);
        } else {
            customersData = [];
            renderCustomersTable();
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading customers:', error);
        showAPIError(error);
        customersData = [];
        renderCustomersTable();
        showSpinner(false);
    }
}

// ============================================
// RENDER CUSTOMERS TABLE
// ============================================

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (customersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No customers found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = customersData.map((customer, index) => `
        <tr data-customer-id="${customer.id}">
            <td><strong>#${index + 1}</strong></td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.orders}</td>
            <td><strong>${formatCurrency(customer.totalSpent)}</strong></td>
            <td>
                <button class="action-btn view" onclick="viewCustomerDetails('${customer.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="contactCustomer('${customer.id}')" title="Contact via WhatsApp">
                    <i class="fab fa-whatsapp text-success"></i>
                </button>
                <button class="action-btn" onclick="customerOrderHistory('${customer.id}')" title="Order History">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// VIEW CUSTOMER DETAILS
// ============================================

async function viewCustomerDetails(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (!customer) return;

    try {
        // Fetch full customer details
        const data = await apiRequest(`/users/admin/${customerId}`);

        if (data.success && data.user) {
            const fullCustomer = data.user;

            // Determine customer tier
            let customerTier = 'New';
            let tierClass = 'bg-info';
            if (customer.orders > 5) {
                customerTier = 'VIP Customer';
                tierClass = 'bg-warning';
            } else if (customer.orders > 2) {
                customerTier = 'Active';
                tierClass = 'bg-success';
            }

            Swal.fire({
                title: customer.name,
                html: `
                    <div class="text-start">
                        <h6>Contact Information</h6>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Phone:</strong> ${customer.phone}</p>
                        <p><strong>Member Since:</strong> ${formatDate(customer.joined)}</p>
                        ${customer.lastOrder ? `<p><strong>Last Order:</strong> ${formatDate(customer.lastOrder)}</p>` : ''}
                        
                        <hr>
                        
                        <h6>Purchase History</h6>
                        <p><strong>Total Orders:</strong> ${customer.orders}</p>
                        <p><strong>Total Spent:</strong> ${formatCurrency(customer.totalSpent)}</p>
                        ${customer.orders > 0 ? `<p><strong>Average Order:</strong> ${formatCurrency(customer.totalSpent / customer.orders)}</p>` : ''}
                        
                        <hr>
                        
                        <p><strong>Customer Status:</strong> <span class="badge ${tierClass}">${customerTier}</span></p>
                    </div>
                `,
                width: 600,
                showCloseButton: true,
                showConfirmButton: false,
                footer: `
                    <button class="btn btn-success btn-sm" onclick="contactCustomer('${customer.id}'); Swal.close();">
                        <i class="fab fa-whatsapp me-2"></i>Contact Customer
                    </button>
                `
            });
        }
    } catch (error) {
        console.error('Error loading customer details:', error);
        showAPIError(error);
    }
}

// ============================================
// CONTACT CUSTOMER VIA WHATSAPP
// ============================================

function contactCustomer(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (!customer) return;

    Swal.fire({
        title: 'Contact Customer',
        html: `
            <div class="text-start">
                <p class="mb-3">Send a message to <strong>${customer.name}</strong></p>
                <label class="form-label">Message</label>
                <textarea class="form-control" id="customerMessage" rows="4" placeholder="Enter your message..."></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send via WhatsApp',
        confirmButtonColor: '#25D366',
        preConfirm: () => {
            const message = document.getElementById('customerMessage').value;
            if (!message) {
                Swal.showValidationMessage('Please enter a message');
                return false;
            }

            const fullMessage = `Hello ${customer.name}! 👋\n\n${message}\n\nAwesome Technologies Team`;
            const phone = customer.phone.replace(/[^0-9]/g, '');

            if (!phone || phone === 'NA') {
                Swal.showValidationMessage('Customer phone number not available');
                return false;
            }

            const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
            window.open(whatsappURL, '_blank');
            showToast('success', 'WhatsApp opened');
        }
    });
}

// ============================================
// CUSTOMER ORDER HISTORY
// ============================================

async function customerOrderHistory(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (!customer) return;

    try {
        // Fetch customer's orders
        const data = await apiRequest(`/users/admin/${customerId}`);

        if (data.success && data.user) {
            const orders = data.user.orders || [];

            if (orders.length === 0) {
                Swal.fire({
                    title: `${customer.name} - Order History`,
                    html: '<p class="text-muted">No orders yet</p>',
                    icon: 'info',
                    showCloseButton: true
                });
                return;
            }

            const ordersHTML = orders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(order => `
                    <div class="order-item p-3 border-bottom">
                        <strong>${order.order_number}</strong> - ${formatCurrency(order.total_amount)}
                        <br><small class="text-muted">${formatDate(order.created_at)}</small>
                        <br><span class="badge bg-${order.status === 'delivered' ? 'success' : 'primary'}">${order.status}</span>
                    </div>
                `).join('');

            Swal.fire({
                title: `${customer.name} - Order History`,
                html: `
                    <div class="text-start">
                        <p class="mb-3">Recent orders (showing ${Math.min(orders.length, 10)} of ${orders.length}):</p>
                        <div class="order-history" style="max-height: 400px; overflow-y: auto;">
                            ${ordersHTML}
                        </div>
                    </div>
                `,
                width: 600,
                showCloseButton: true,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        showAPIError(error);
    }
}

// ============================================
// EXPORT CUSTOMERS
// ============================================

function exportCustomers() {
    showToast('info', 'Exporting customers...');

    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined'];
    const rows = customersData.map(c => [
        c.id, c.name, c.email, c.phone, c.orders, c.totalSpent, formatDate(c.joined)
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
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showToast('success', 'Customers exported successfully!');
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('customerSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                const filtered = customersData.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query) ||
                    c.phone.includes(query)
                );

                const tempData = customersData;
                customersData = filtered;
                renderCustomersTable();
                customersData = tempData;
            }, 300);
        });
    }
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
