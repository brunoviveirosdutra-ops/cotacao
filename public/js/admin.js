// Admin Dashboard JS

let currentView = 'dashboard';
let suppliers = [];
let products = [];
let quotes = [];
let currentModal = null;

// Load View
function loadView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(view).classList.add('active');
  
  document.querySelectorAll('[data-view]').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  
  document.getElementById('page-title').textContent = 
    view.charAt(0).toUpperCase() + view.slice(1);

  if (view === 'dashboard') loadDashboard();
  else if (view === 'suppliers') loadSuppliers();
  else if (view === 'products') loadProducts();
  else if (view === 'quotes') loadQuotes();
}

// Dashboard
async function loadDashboard() {
  try {
    const [suppliersRes, productsRes, quotesRes] = await Promise.all([
      fetch('/api/suppliers'),
      fetch('/api/products'),
      fetch('/api/quotes')
    ]);

    const suppliersData = await suppliersRes.json();
    const productsData = await productsRes.json();
    const quotesData = await quotesRes.json();

    document.getElementById('stat-suppliers').textContent = suppliersData.length;
    document.getElementById('stat-products').textContent = productsData.length;
    document.getElementById('stat-active-quotes').textContent = 
      quotesData.filter(q => q.status === 'ativa').length;
    document.getElementById('stat-accepted-quotes').textContent = 
      quotesData.filter(q => q.status === 'aceita').length;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// Suppliers
async function loadSuppliers() {
  try {
    const res = await fetch('/api/suppliers');
    suppliers = await res.json();
    renderSuppliers();
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error);
  }
}

function renderSuppliers() {
  const tbody = document.getElementById('suppliers-list');
  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.phone || '-'}</td>
      <td>${s.city || '-'}</td>
      <td><span class="status-badge status-${s.status}">${s.status}</span></td>
      <td>
        <button class="btn-edit" onclick="editSupplier(${s.id})">Editar</button>
        <button class="btn-delete" onclick="deleteSupplier(${s.id})">Deletar</button>
      </td>
    </tr>
  `).join('');
}

function openSupplierModal(id = null) {
  currentModal = { type: 'supplier', id };
  document.getElementById('modal-title').textContent = id ? 'Editar Fornecedor' : 'Novo Fornecedor';
  
  const supplier = id ? suppliers.find(s => s.id === id) : null;
  
  document.getElementById('modal-form').innerHTML = `
    <input type="text" id="name" placeholder="Nome" value="${supplier?.name || ''}" required>
    <input type="email" id="email" placeholder="Email" value="${supplier?.email || ''}" required>
    <input type="tel" id="phone" placeholder="Telefone" value="${supplier?.phone || ''}">
    <input type="text" id="city" placeholder="Cidade" value="${supplier?.city || ''}">
    <input type="text" id="address" placeholder="Endereço" value="${supplier?.address || ''}">
    <input type="text" id="state" placeholder="Estado" value="${supplier?.state || ''}">
    <input type="text" id="zip_code" placeholder="CEP" value="${supplier?.zip_code || ''}">
    <input type="text" id="cnpj" placeholder="CNPJ" value="${supplier?.cnpj || ''}">
    <input type="text" id="contact_person" placeholder="Pessoa de Contato" value="${supplier?.contact_person || ''}">
    <select id="status" value="${supplier?.status || 'ativo'}">
      <option value="ativo">Ativo</option>
      <option value="inativo">Inativo</option>
    </select>
    ${!id ? '<input type="password" id="password" placeholder="Senha" required>' : ''}
    <button type="submit" class="btn-primary">Salvar</button>
  `;
  
  document.getElementById('modal').classList.add('active');
}

function editSupplier(id) {
  openSupplierModal(id);
}

async function deleteSupplier(id) {
  if (!confirm('Tem certeza que deseja deletar este fornecedor?')) return;
  
  try {
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSuppliers();
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
  }
}

// Products
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

function renderProducts() {
  const tbody = document.getElementById('products-list');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.unit}</td>
      <td><span class="status-badge status-${p.status}">${p.status}</span></td>
      <td>
        <button class="btn-edit" onclick="editProduct(${p.id})">Editar</button>
        <button class="btn-delete" onclick="deleteProduct(${p.id})">Deletar</button>
      </td>
    </tr>
  `).join('');
}

function openProductModal(id = null) {
  currentModal = { type: 'product', id };
  document.getElementById('modal-title').textContent = id ? 'Editar Produto' : 'Novo Produto';
  
  const product = id ? products.find(p => p.id === id) : null;
  
  document.getElementById('modal-form').innerHTML = `
    <input type="text" id="name" placeholder="Nome" value="${product?.name || ''}" required>
    <select id="category" value="${product?.category || 'carne'}" required>
      <option value="carne">Carne</option>
      <option value="frango">Frango</option>
    </select>
    <select id="unit" value="${product?.unit || 'kg'}">
      <option value="kg">Kg</option>
      <option value="un">Unidade</option>
      <option value="caixa">Caixa</option>
    </select>
    <input type="number" id="min_order_quantity" placeholder="Quantidade Mínima" value="${product?.min_order_quantity || ''}" step="0.01">
    <select id="status" value="${product?.status || 'ativo'}">
      <option value="ativo">Ativo</option>
      <option value="inativo">Inativo</option>
    </select>
    <textarea id="description" placeholder="Descrição" style="grid-column: 1 / -1;">${product?.description || ''}</textarea>
    <button type="submit" class="btn-primary">Salvar</button>
  `;
  
  document.getElementById('modal').classList.add('active');
}

function editProduct(id) {
  openProductModal(id);
}

async function deleteProduct(id) {
  if (!confirm('Tem certeza que deseja deletar este produto?')) return;
  
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadProducts();
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
  }
}

// Quotes
async function loadQuotes() {
  try {
    const res = await fetch('/api/quotes');
    quotes = await res.json();
    renderQuotes();
  } catch (error) {
    console.error('Erro ao carregar cotações:', error);
  }
}

function renderQuotes() {
  const tbody = document.getElementById('quotes-list');
  tbody.innerHTML = quotes.map(q => `
    <tr>
      <td>${q.id}</td>
      <td>${q.supplier_name}</td>
      <td>${q.product_name}</td>
      <td>${q.quantity}</td>
      <td>R$ ${q.unit_price.toFixed(2)}</td>
      <td>R$ ${q.total_price.toFixed(2)}</td>
      <td><span class="status-badge status-${q.status}">${q.status}</span></td>
      <td>
        <button class="btn-edit" onclick="editQuote(${q.id})">Editar</button>
        <button class="btn-delete" onclick="deleteQuote(${q.id})">Deletar</button>
      </td>
    </tr>
  `).join('');
}

function openQuoteModal(id = null) {
  currentModal = { type: 'quote', id };
  document.getElementById('modal-title').textContent = id ? 'Editar Cotação' : 'Nova Cotação';
  
  const quote = id ? quotes.find(q => q.id === id) : null;
  
  const supplierOptions = suppliers.map(s => `<option value="${s.id}" ${quote?.supplier_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  const productOptions = products.map(p => `<option value="${p.id}" ${quote?.product_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
  
  document.getElementById('modal-form').innerHTML = `
    <select id="supplier_id" required>${supplierOptions}</select>
    <select id="product_id" required>${productOptions}</select>
    <input type="number" id="quantity" placeholder="Quantidade" value="${quote?.quantity || ''}" step="0.01" required>
    <input type="number" id="unit_price" placeholder="Preço Unitário" value="${quote?.unit_price || ''}" step="0.01" required>
    <input type="date" id="delivery_date" value="${quote?.delivery_date || ''}">
    <input type="text" id="payment_terms" placeholder="Condições de Pagamento" value="${quote?.payment_terms || ''}">
    <input type="date" id="validity_date" value="${quote?.validity_date || ''}">
    <select id="status" value="${quote?.status || 'ativa'}">
      <option value="ativa">Ativa</option>
      <option value="aceita">Aceita</option>
      <option value="rejeitada">Rejeitada</option>
      <option value="expirada">Expirada</option>
    </select>
    <textarea id="notes" placeholder="Observações" style="grid-column: 1 / -1;">${quote?.notes || ''}</textarea>
    <button type="submit" class="btn-primary">Salvar</button>
  `;
  
  document.getElementById('modal').classList.add('active');
}

function editQuote(id) {
  openQuoteModal(id);
}

async function deleteQuote(id) {
  if (!confirm('Tem certeza que deseja deletar esta cotação?')) return;
  
  try {
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadQuotes();
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
  }
}

// Modal Functions
function closeModal() {
  document.getElementById('modal').classList.remove('active');
  currentModal = null;
}

async function submitModalForm(e) {
  e.preventDefault();
  
  const form = document.getElementById('modal-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  if (!currentModal) return;
  
  try {
    let url, method;
    
    if (currentModal.type === 'supplier') {
      url = `/api/suppliers${currentModal.id ? '/' + currentModal.id : ''}`;
      method = currentModal.id ? 'PUT' : 'POST';
    } else if (currentModal.type === 'product') {
      url = `/api/products${currentModal.id ? '/' + currentModal.id : ''}`;
      method = currentModal.id ? 'PUT' : 'POST';
    } else if (currentModal.type === 'quote') {
      url = `/api/quotes${currentModal.id ? '/' + currentModal.id : ''}`;
      method = currentModal.id ? 'PUT' : 'POST';
    }
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      closeModal();
      loadView(currentView);
    } else {
      const error = await res.json();
      alert('Erro: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao salvar');
  }
}

// Logout
// Logout
async function handleLogout() {
  try {

    await fetch('/api/admin/logout', {
      method: 'POST'
    });

    window.location.href = '/admin-login.html';

  } catch (error) {

    console.error('Erro ao fazer logout:', error);

  }
}


// Initialize
window.addEventListener('load', async () => {

  try {

    const resposta = await fetch('/api/admin/me');

    if (!resposta.ok) {

      window.location.href = "/admin-login.html";
      return;

    }


    const admin = await resposta.json();


    const userInfo = document.getElementById('user-info');

    if(userInfo){

      userInfo.textContent = admin.name;

    }


    loadView('dashboard');


  } catch (erro) {

    console.error('Erro ao verificar administrador:', erro);

    window.location.href = "/admin-login.html";

  }

});