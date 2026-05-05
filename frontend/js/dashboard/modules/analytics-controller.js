import api from '../../services/api.js';

class AnalyticsController {
    constructor() {
        this.summary = null;
        this.salesData = [];
    }

    async init() {
        await this.loadData();
        this.render();
    }

    async loadData() {
        try {
            const [summaryRes, salesRes] = await Promise.all([
                api.client.get('/dashboard'),
                api.client.get('/dashboard/sales-report?days=30')
            ]);
            
            this.summary = summaryRes.data?.data || {};
            this.salesData = salesRes.data?.data || [];
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }

    render() {
        if (!this.summary) return;

        // Metrics
        const revenueEl = document.querySelector('.metric-card:nth-child(1) .metric-value');
        if (revenueEl) revenueEl.innerText = api.formatCurrency(this.summary.revenue);

        const revenueBadge = document.querySelector('.metric-card:nth-child(1) .badge');
        if (revenueBadge) revenueBadge.textContent = 'Live';

        const avgOrderEl = document.querySelector('.metric-card:nth-child(2) .metric-value');
        if (avgOrderEl) {
            const avg = this.summary.average_order_value || (this.summary.paid_orders > 0 ? this.summary.revenue / this.summary.paid_orders : 0);
            avgOrderEl.innerText = api.formatCurrency(avg);
        }

        const avgOrderBadge = document.querySelector('.metric-card:nth-child(2) .badge');
        if (avgOrderBadge) avgOrderBadge.textContent = 'Live';

        const convEl = document.querySelector('.metric-card:nth-child(3) .metric-value');
        if (convEl) {
            convEl.innerText = `${this.summary.conversion_rate || 0}%`;
        }

        const convBadge = document.querySelector('.metric-card:nth-child(3) .badge');
        if (convBadge) convBadge.textContent = 'Live';

        const tbody = document.querySelector('.table tbody');
        const categories = this.summary.top_categories || [];
        const products = this.summary.top_products || [];
        const rows = categories.length ? categories : products;

        if (tbody && rows.length) {
            tbody.innerHTML = rows.map(p => `
                <tr>
                    <td><strong>${p.category_name || p.product_name}</strong></td>
                    <td>${p.units_sold} units</td>
                    <td>${api.formatCurrency(p.revenue)}</td>
                    <td><span class="badge badge-active">Live</span></td>
                </tr>
            `).join('');
        }

        this.renderChart();
    }

    renderChart() {
        // Since we are in Vanilla JS without heavy chart libs, 
        // we can either use a simple SVG bar chart or just log for now.
        // For a premium feel, let's create a simple CSS/SVG bar chart.
        const container = document.querySelector('.admin-panel');
        if (!container) return;

        const chartHtml = `
            <div class="mt-4 p-3 border-top">
                <h4 class="mb-3">Last 30 Days Revenue Trend</h4>
                <div class="flex items-end gap-1" style="height: 150px; overflow-x: auto;">
                    ${this.salesData.map(d => {
                        const height = (d.revenue / 1000000) * 100; // Scaled to 1M
                        return `<div class="bg-primary" style="flex: 1; height: ${Math.min(100, height)}%; min-width: 15px;" title="${d.date}: ${api.formatCurrency(d.revenue)}"></div>`;
                    }).join('')}
                </div>
                <div class="flex justify-between text-muted mt-2" style="font-size: 0.75rem;">
                    <span>${this.salesData[0]?.date || ''}</span>
                    <span>${this.salesData[this.salesData.length-1]?.date || ''}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', chartHtml);
    }
}

const ctrl = new AnalyticsController();
ctrl.init();
