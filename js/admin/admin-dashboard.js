/**
 * Admin Dashboard Main Module
 * Handles navigation, UI interactions, and dashboard stats with real-time data
 */

// Global variables
let currentSection = 'dashboard';
let salesChart, categoryChart;

// ============================================
// NAVIGATION
// ============================================

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    sidebar.classList.toggle('show');
}

// Section Navigation
function initNavigation() {
    const menuLinks = document.querySelectorAll('.sidebar-menu a[data-section]');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`a[data-section="${sectionName}"]`)?.parentElement.classList.add('active');

        // Load section data
        loadSectionData(sectionName);
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 992) {
        document.getElementById('adminSidebar').classList.remove('show');
    }
}

// ============================================
// LOAD SECTION DATA
// ============================================

function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'products':
            if (typeof loadProducts === 'function') loadProducts();
            break;
        case 'orders':
            if (typeof loadOrders === 'function') loadOrders();
            break;
        case 'customers':
            if (typeof loadCustomers === 'function') loadCustomers();
            break;
        case 'analytics':
            if (typeof loadAnalytics === 'function') loadAnalytics();
            break;
        case 'categories':
            if (typeof loadCategories === 'function') loadCategories();
            break;
    }
}

// ============================================
// DASHBOARD STATS (REAL-TIME DATA)
// ============================================

async function loadDashboardStats() {
    try {
        showSpinner(true);

        // Fetch data from multiple endpoints in parallel
        const [productsData, ordersData, usersData] = await Promise.all([
            apiRequest('/products').catch(() => ({ success: false, products: [] })),
            apiRequest('/orders/admin/all').catch(() => ({ success: false, orders: [] })),
            apiRequest('/users/admin/all').catch(() => ({ success: false, users: [] }))
        ]);

        // Calculate stats
        const stats = {
            totalProducts: productsData.success ? productsData.products.length : 0,
            totalOrders: ordersData.success ? ordersData.orders.length : 0,
            totalCustomers: usersData.success ? usersData.users.filter(u => u.role === 'customer').length : 0,
            totalSales: 0
        };

        // Calculate total sales from paid orders
        if (ordersData.success && ordersData.orders) {
            stats.totalSales = ordersData.orders
                .filter(order => order.payment_status === 'paid')
                .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        }

        // Update stats cards
        const salesEl = document.getElementById('totalSales');
        const ordersEl = document.getElementById('totalOrders');
        const productsEl = document.getElementById('totalProducts');
        const customersEl = document.getElementById('totalCustomers');

        if (salesEl) salesEl.textContent = formatCurrency(stats.totalSales);
        if (ordersEl) ordersEl.textContent = stats.totalOrders.toLocaleString();
        if (productsEl) productsEl.textContent = stats.totalProducts.toLocaleString();
        if (customersEl) customersEl.textContent = stats.totalCustomers.toLocaleString();

        // Load charts with real data
        await loadSalesChartData(ordersData.orders || []);
        await loadCategoryChartData(productsData.products || []);
        await loadRecentOrders(ordersData.orders || []);
        await loadTopProducts(productsData.products || [], ordersData.orders || []);

        showSpinner(false);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showAPIError(error);
        showSpinner(false);
    }
}

// ============================================
// SALES CHART (REAL-TIME DATA)
// ============================================

async function loadSalesChartData(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) {
        salesChart.destroy();
    }

    // Calculate sales for last 4 weeks
    const today = new Date();
    const weeklyData = [];
    const labels = [];

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i + 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekSales = orders
            .filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= weekStart && orderDate < weekEnd && order.payment_status === 'paid';
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        weeklyData.push(weekSales);
        labels.push(`Week ${4 - i}`);
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (KSh)',
                data: weeklyData,
                borderColor: '#2575fc',
                backgroundColor: 'rgba(37, 117, 252, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'KSh ' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// CATEGORY CHART (REAL-TIME DATA)
// ============================================

async function loadCategoryChartData(products) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (categoryChart) {
        categoryChart.destroy();
    }

    // Get categories data
    let categoriesData = [];
    try {
        const data = await apiRequest('/categories');
        if (data.success) {
            categoriesData = data.categories;
        }
    } catch (error) {
        console.error('Error loading categories for chart:', error);
    }

    // Count products per category
    const categoryCounts = {};
    const categoryColors = {};
    const categoryNames = {};

    categoriesData.forEach(cat => {
        categoryCounts[cat.id] = 0;
        categoryColors[cat.id] = cat.color || '#2575fc';
        categoryNames[cat.id] = cat.name;
    });

    products.forEach(product => {
        if (product.category_id && categoryCounts.hasOwnProperty(product.category_id)) {
            categoryCounts[product.category_id]++;
        }
    });

    const labels = Object.keys(categoryCounts).map(id => categoryNames[id]);
    const data = Object.values(categoryCounts);
    const colors = Object.keys(categoryCounts).map(id => categoryColors[id]);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: colors.length > 0 ? colors : ['#cccccc']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ============================================
// RECENT ORDERS (REAL-TIME DATA)
// ============================================

async function loadRecentOrders(orders) {
    const tbody = document.getElementById('recentOrders');
    if (!tbody) return;

    // Get 5 most recent orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent orders</td></tr>';
        return;
    }

    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td><strong>${order.order_number}</strong></td>
            <td>${order.users?.name || 'N/A'}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td><span class="status-badge ${order.status}">${order.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewOrderFromDashboard('${order.id}')" title="View Order">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// View order from dashboard
function viewOrderFromDashboard(orderId) {
    showSection('orders');
    // Give it a moment to load, then view the order
    setTimeout(() => {
        if (typeof viewOrderDetails === 'function') {
            viewOrderDetails(orderId);
        }
    }, 500);
}

// ============================================
// TOP PRODUCTS (REAL-TIME DATA)
// ============================================

async function loadTopProducts(products, orders) {
    const container = document.getElementById('topProducts');
    if (!container) return;

    // Calculate sales per product from order items
    const productSales = {};

    orders.forEach(order => {
        if (order.order_items) {
            order.order_items.forEach(item => {
                const productId = item.product_id;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.product_name || item.products?.name || 'Unknown Product',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[productId].quantity += parseInt(item.quantity || 0);
                productSales[productId].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 0);
            });
        }
    });

    // Sort by quantity sold
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    if (topProducts.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No sales data available</p>';
        return;
    }

    container.innerHTML = topProducts.map((product, index) => `
        <div class="top-product-item">
            <div class="top-product-rank">${index + 1}</div>
            <div class="top-product-info">
                <div class="top-product-name">${product.name}</div>
                <div class="top-product-sales">${product.quantity} sales • ${formatCurrency(product.revenue)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Refresh Data
function refreshData() {
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    if (icon) icon.classList.add('fa-spin');

    // Reload current section
    loadSectionData(currentSection);

    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        showToast('success', 'Data refreshed successfully!');
    }, 1000);
}

// Show Notifications
async function showNotifications() {
    // In production, fetch real notifications from API
    Swal.fire({
        title: 'Notifications',
        html: `
            <div class="text-start">
                <p><i class="fas fa-info-circle text-info"></i> Welcome to the admin dashboard</p>
                <p><i class="fas fa-box text-warning"></i> Check products with low stock</p>
                <p><i class="fas fa-sync text-primary"></i> Click refresh to load latest data</p>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Toast Notification
function showToast(type, message) {
    if (typeof Swal === 'undefined') return;

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

// Show/hide spinner
function showSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (!spinner) {
        // Create spinner if it doesn't exist
        if (show) {
            const spinnerDiv = document.createElement('div');
            spinnerDiv.id = 'spinner';
            spinnerDiv.className = 'global-spinner';
            spinnerDiv.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
            document.body.appendChild(spinnerDiv);
        }
    } else {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    showSection('dashboard');

    // Global search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                if (query.length > 2) {
                    // Implement global search across all sections
                    console.log('Searching:', query);
                    showToast('info', 'Search functionality coming soon');
                }
            }, 500);
        });
    }

    // Log initialization
    console.log('Admin Dashboard initialized with real-time data integration');
});
