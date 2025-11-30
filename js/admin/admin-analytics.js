/**
 * Admin Analytics Module
 * Handles charts and analytics data visualization with real-time data
 */

let revenueChart, orderStatusChart;

// ============================================
// LOAD ANALYTICS
// ============================================

async function loadAnalytics(dateRange = 'month') {
    try {
        showSpinner(true);

        // Fetch orders data
        const data = await apiRequest('/orders/admin/all');

        if (data.success && data.orders) {
            initRevenueChart(data.orders, dateRange);
            initOrderStatusChart(data.orders);
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAPIError(error);
        showSpinner(false);
    }
}

// ============================================
// REVENUE CHART
// ============================================

function initRevenueChart(orders, period = 'month') {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) {
        revenueChart.destroy();
    }

    const data = getRevenueData(orders, period);

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Revenue (KSh)',
                data: data.values,
                backgroundColor: 'rgba(37, 117, 252, 0.7)',
                borderColor: '#2575fc',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
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
// ORDER STATUS CHART
// ============================================

function initOrderStatusChart(orders) {
    const ctx = document.getElementById('orderStatusChart');
    if (!ctx) return;

    if (orderStatusChart) {
        orderStatusChart.destroy();
    }

    // Count orders by status
    const statusCounts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    };

    orders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
            statusCounts[order.status]++;
        }
    });

    orderStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            datasets: [{
                data: [
                    statusCounts.pending,
                    statusCounts.processing,
                    statusCounts.shipped,
                    statusCounts.delivered,
                    statusCounts.cancelled
                ],
                backgroundColor: [
                    '#ffc107',
                    '#17a2b8',
                    '#28a745',
                    '#6a11cb',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ============================================
// GET REVENUE DATA BASED ON PERIOD
// ============================================

function getRevenueData(orders, period) {
    const today = new Date();
    let labels = [];
    let values = [];
    const paidOrders = orders.filter(o => o.payment_status === 'paid');

    if (period === 'today') {
        labels = ['Morning', 'Afternoon', 'Evening'];
        values = [0, 0, 0];

        paidOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate.toDateString() === today.toDateString()) {
                const hour = orderDate.getHours();
                const amount = parseFloat(order.total_amount || 0);

                if (hour < 12) values[0] += amount;
                else if (hour < 18) values[1] += amount;
                else values[2] += amount;
            }
        });
    } else if (period === 'week') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        values = [0, 0, 0, 0, 0, 0, 0];

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);

        paidOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate >= weekStart && orderDate <= today) {
                const dayIndex = (orderDate.getDay() + 6) % 7;
                values[dayIndex] += parseFloat(order.total_amount || 0);
            }
        });
    } else if (period === 'month') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        values = [0, 0, 0, 0];

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        paidOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()) {
                const dayOfMonth = orderDate.getDate();
                const weekIndex = Math.floor((dayOfMonth - 1) / 7);
                if (weekIndex < 4) {
                    values[weekIndex] += parseFloat(order.total_amount || 0);
                }
            }
        });
    } else if (period === 'year') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        values = Array(12).fill(0);

        paidOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate.getFullYear() === today.getFullYear()) {
                const monthIndex = orderDate.getMonth();
                values[monthIndex] += parseFloat(order.total_amount || 0);
            }
        });
    }

    return { labels, values };
}

// ============================================
// SET DATE RANGE
// ============================================

function setDateRange(range) {
    loadAnalytics(range);

    // Update active button
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    showToast('info', `Showing analytics for: ${range}`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}
