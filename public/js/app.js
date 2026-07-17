// Global state
let currentView = 'dashboard';
let currentProductFilter = 'all';
let currentQuoteFilter = 'ativa';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadView('dashboard');
    setupEventListeners();
});

function setupEventListeners() {
    // Form submissions
    document.getElementById('supplier-form').addEventListener('submit', handleSupplierSubmit);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    document.getElementById('quote-form').addEventListener('submit', handleQuoteSubmit);
}

// View Management
function loadView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Show selected view
    document.getElementById(viewName).classList.add('active');
    currentView = viewName;

    // Load data for view
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'quotes':
            loadQuotes();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const stats = await DashboardAPI.getStats();
        document.getElementById('stat-suppliers').textContent = stats.total_suppliers;
        document.getElementById('stat-active-suppliers').textContent = stats.active_suppliers;
        document.getElementById('stat-products').textContent = stats.total_products;
        document.getElementById('stat-active-quotes').textContent = stats.active_quotes;

        const categories = await DashboardAPI.getByCategory();
        renderCategoryStats(categories);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        alert('Erro ao carregar dashboard');
    }
}

function renderCategoryStats(categories) {
    const container = document.getElementById('category-stats');
    container.innerHTML = '';

    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'stat-row';
        div.innerHTML = `
            <div><strong>${cat.category.toUpperCase()}</strong></div>
            <div>Produtos: ${cat.total_products}</div>
            <div>Fornecedores: ${cat.suppliers_count}</div>
            <div>Min: ${formatCurrency(cat.min_price || 0)}</div>
            <div>Máx: ${formatCurrency(cat.max_price || 0)}</div>
            <div>Média: ${formatCurrency(cat.avg_price || 0)}</div>
        `;
        container.appendChild(div);
    });
}

// Suppliers
async function loadSuppliers() {
    try {
        const suppliers = await SuppliersAPI.getAll();
        renderSuppliersList(suppliers);
        
        // Load suppliers in quote form
        const supplierSelect = document.getElementById('quote-supplier');
        supplierSelect.innerHTML = '<option value="">Selecione um Fornecedor</option>';
        suppliers.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.name;
            supplierSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        alert('Erro ao carregar fornecedores');
    }
}

function renderSuppliersList(suppliers) {
    const tbody = document.getElementById('suppliers-list');
    tbody.innerHTML = '';

    suppliers.forEach(supplier => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.email || '-'}</td>
            <td>${supplier.phone || '-'}</td>
            <td>${supplier.city || '-'}</td>
            <td><span class="status ${supplier.status}">${supplier.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editSupplier(${supplier.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteSupplier(${supplier.id})">Deletar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('supplier-name').value,
        email: document.getElementById('supplier-email').value,
        phone: document.getElementById('supplier-phone').value,
        address: document.getElementById('supplier-address').value,
        city: document.getElementById('supplier-city').value,
        state: document.getElementById('supplier-state').value,
        zip_code: document.getElementById('supplier-zip').value,
        cnpj: document.getElementById('supplier-cnpj').value,
        contact_person: document.getElementById('supplier-contact').value,
        status: document.getElementById('supplier-status').value
    };

    try {
        const result = await SuppliersAPI.create(data);
        alert('Fornecedor criado com sucesso!');
        e.target.reset();
        loadSuppliers();
    } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        alert('Erro ao criar fornecedor');
    }
}

async function deleteSupplier(id) {
    if (!confirm('Tem certeza que deseja deletar este fornecedor?')) return;
    
    try {
        await SuppliersAPI.delete(id);
        alert('Fornecedor deletado com sucesso!');
        loadSuppliers();
    } catch (error) {
        console.error('Erro ao deletar fornecedor:', error);
        alert('Erro ao deletar fornecedor');
    }
}

// Products
async function loadProducts() {
    try {
        const category = currentProductFilter === 'all' ? null : currentProductFilter;
        const products = await ProductsAPI.getAll(category);
        renderProductsList(products);
        
        // Load products in quote form
        const productSelect = document.getElementById('quote-product');
        productSelect.innerHTML = '<option value="">Selecione um Produto</option>';
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos');
    }
}

function renderProductsList(products) {
    const tbody = document.getElementById('products-list');
    tbody.innerHTML = '';

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unit}</td>
            <td>${product.min_order_quantity || '-'}</td>
            <td><span class="status ${product.status}">${product.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">Deletar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        unit: document.getElementById('product-unit').value,
        min_order_quantity: parseFloat(document.getElementById('product-min-qty').value) || null,
        status: document.getElementById('product-status').value
    };

    try {
        const result = await ProductsAPI.create(data);
        alert('Produto criado com sucesso!');
        e.target.reset();
        loadProducts();
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        alert('Erro ao criar produto');
    }
}

async function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    
    try {
        await ProductsAPI.delete(id);
        alert('Produto deletado com sucesso!');
        loadProducts();
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        alert('Erro ao deletar produto');
    }
}

function filterProducts(category) {
    currentProductFilter = category;
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadProducts();
}

// Quotes
async function loadQuotes() {
    try {
        let filters = {};
        if (currentQuoteFilter !== 'all') {
            filters.status = currentQuoteFilter;
        }
        const quotes = await QuotesAPI.getAll(filters);
        renderQuotesList(quotes);
    } catch (error) {
        console.error('Erro ao carregar cotações:', error);
        alert('Erro ao carregar cotações');
    }
}

function renderQuotesList(quotes) {
    const tbody = document.getElementById('quotes-list');
    tbody.innerHTML = '';

    quotes.forEach(quote => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${quote.supplier_name}</td>
            <td>${quote.product_name}</td>
            <td>${quote.quantity} ${quote.unit}</td>
            <td>${formatCurrency(quote.unit_price)}</td>
            <td>${formatCurrency(quote.total_price)}</td>
            <td><span class="status ${quote.status}">${quote.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editQuote(${quote.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteQuote(${quote.id})">Deletar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleQuoteSubmit(e) {
    e.preventDefault();
    
    const data = {
        supplier_id: parseInt(document.getElementById('quote-supplier').value),
        product_id: parseInt(document.getElementById('quote-product').value),
        quantity: parseFloat(document.getElementById('quote-quantity').value),
        unit_price: parseFloat(document.getElementById('quote-unit-price').value),
        delivery_date: document.getElementById('quote-delivery').value || null,
        payment_terms: document.getElementById('quote-payment').value || null,
        validity_date: document.getElementById('quote-validity').value || null,
        notes: document.getElementById('quote-notes').value || null
    };

    try {
        const result = await QuotesAPI.create(data);
        alert('Cotação criada com sucesso!');
        e.target.reset();
        loadQuotes();
    } catch (error) {
        console.error('Erro ao criar cotação:', error);
        alert('Erro ao criar cotação');
    }
}

async function deleteQuote(id) {
    if (!confirm('Tem certeza que deseja deletar esta cotação?')) return;
    
    try {
        await QuotesAPI.delete(id);
        alert('Cotação deletada com sucesso!');
        loadQuotes();
    } catch (error) {
        console.error('Erro ao deletar cotação:', error);
        alert('Erro ao deletar cotação');
    }
}

function filterQuotes(status) {
    currentQuoteFilter = status;
    document.querySelectorAll('.filter-buttons .btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadQuotes();
}

// Modal
function openModal(title, formHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-form').innerHTML = formHTML;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Placeholder functions for edit
function editSupplier(id) {
    alert('Função de edição em desenvolvimento');
}

function editProduct(id) {
    alert('Função de edição em desenvolvimento');
}

function editQuote(id) {
    alert('Função de edição em desenvolvimento');
}