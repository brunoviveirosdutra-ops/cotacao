const API_BASE_URL = '/api';

// Helpers
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Suppliers API
const SuppliersAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/suppliers`);
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`);
        return response.json();
    },

    async create(data) {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async update(id, data) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Products API
const ProductsAPI = {
    async getAll(category = null) {
        let url = `${API_BASE_URL}/products`;
        if (category) url += `?category=${category}`;
        const response = await fetch(url);
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        return response.json();
    },

    async create(data) {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async update(id, data) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Quotes API
const QuotesAPI = {
    async getAll(filters = {}) {
        let url = `${API_BASE_URL}/quotes`;
        const params = new URLSearchParams(filters);
        if (Object.keys(filters).length > 0) {
            url += `?${params}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}`);
        return response.json();
    },

    async create(data) {
        const response = await fetch(`${API_BASE_URL}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async update(id, data) {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Dashboard API
const DashboardAPI = {
    async getStats() {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        return response.json();
    },

    async getBestPrices() {
        const response = await fetch(`${API_BASE_URL}/dashboard/best-prices`);
        return response.json();
    },

    async getSupplierPrices(supplierId) {
        const response = await fetch(`${API_BASE_URL}/dashboard/supplier-prices/${supplierId}`);
        return response.json();
    },

    async comparePrices(productId) {
        const response = await fetch(`${API_BASE_URL}/dashboard/compare/${productId}`);
        return response.json();
    },

    async getPriceHistory(filters = {}) {
        let url = `${API_BASE_URL}/dashboard/price-history`;
        const params = new URLSearchParams(filters);
        if (Object.keys(filters).length > 0) {
            url += `?${params}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    async getByCategory() {
        const response = await fetch(`${API_BASE_URL}/dashboard/by-category`);
        return response.json();
    }
};