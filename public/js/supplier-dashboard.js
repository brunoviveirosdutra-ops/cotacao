// Supplier Dashboard JS

let currentSupplier = null;
let myQuotes = [];

// Initialize
window.addEventListener('load', async () => {
  const supplierData = localStorage.getItem('supplier');
  if (supplierData) {
    currentSupplier = JSON.parse(supplierData);
    document.getElementById('supplier-name').textContent = currentSupplier.name;
  }
  
  await loadMyQuotes();
  await loadProfile();
});

// Load my quotes
async function loadMyQuotes() {
  try {
    const res = await fetch('/api/quotes/supplier/my-quotes');
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
    }
    myQuotes = await res.json();
    renderQuotes();
  } catch (error) {
    console.error('Erro ao carregar cotações:', error);
  }
}

function renderQuotes() {
  const grid = document.getElementById('quotes-grid');
  
  if (myQuotes.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;">
        <div class="empty-state">
          <p>📭 Você não tem cotações no momento</p>
          <p style="font-size: 14px;">Voltaremos em breve com novas cotações!</p>
        </div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = myQuotes.map(q => `
    <div class="quote-card">
      <div class="quote-card-header">
        <div>
          <div class="quote-product">${q.product_name}</div>
          <div class="quote-category">${q.category.toUpperCase()} • ${q.unit}</div>
        </div>
        <span class="quote-status status-${q.status}">${q.status}</span>
      </div>
      
      <div class="quote-details">
        <div class="detail-row">
          <span class="detail-label">Quantidade:</span>
          <span class="detail-value">${q.quantity} ${q.unit}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Preço Unit:</span>
          <span class="detail-value">R$ ${q.unit_price.toFixed(2)}</span>
        </div>
        ${q.delivery_date ? `
          <div class="detail-row">
            <span class="detail-label">Entrega:</span>
            <span class="detail-value">${new Date(q.delivery_date).toLocaleDateString('pt-BR')}</span>
          </div>
        ` : ''}
        ${q.payment_terms ? `
          <div class="detail-row">
            <span class="detail-label">Pagamento:</span>
            <span class="detail-value">${q.payment_terms}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="quote-price">Total: R$ ${q.total_price.toFixed(2)}</div>
      
      ${q.status === 'ativa' ? `
        <div class="quote-actions">
          <button class="btn-accept" onclick="acceptQuote(${q.id})">✓ Aceitar</button>
          <button class="btn-reject" onclick="rejectQuote(${q.id})">✗ Rejeitar</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Accept/Reject Quote
async function acceptQuote(id) {
  try {
    const res = await fetch(`/api/quotes/${id}/supplier/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'aceita' })
    });
    
    if (res.ok) {
      await loadMyQuotes();
    } else {
      const error = await res.json();
      alert('Erro: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

async function rejectQuote(id) {
  if (!confirm('Tem certeza que deseja rejeitar esta cotação?')) return;
  
  try {
    const res = await fetch(`/api/quotes/${id}/supplier/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejeitada' })
    });
    
    if (res.ok) {
      await loadMyQuotes();
    } else {
      const error = await res.json();
      alert('Erro: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Profile Modal
async function loadProfile() {
  try {
    const res = await fetch('/api/suppliers/me/profile');
    if (!res.ok) return;
    
    const profile = await res.json();
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileEmail').value = profile.email;
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileCity').value = profile.city || '';
    document.getElementById('profileState').value = profile.state || '';
    document.getElementById('profileAddress').value = profile.address || '';
    document.getElementById('profileZipCode').value = profile.zip_code || '';
    document.getElementById('profileCNPJ').value = profile.cnpj || '';
    document.getElementById('profileContact').value = profile.contact_person || '';
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
  }
}

function openProfileModal() {
  document.getElementById('profileModal').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('active');
}

async function submitProfileForm(e) {
  e.preventDefault();
  
  const data = {
    phone: document.getElementById('profilePhone').value,
    city: document.getElementById('profileCity').value,
    state: document.getElementById('profileState').value,
    address: document.getElementById('profileAddress').value,
    zip_code: document.getElementById('profileZipCode').value,
    cnpj: document.getElementById('profileCNPJ').value,
    contact_person: document.getElementById('profileContact').value
  };
  
  try {
    const res = await fetch('/api/suppliers/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      alert('Perfil atualizado com sucesso!');
      closeProfileModal();
    } else {
      const error = await res.json();
      alert('Erro: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao atualizar perfil');
  }
}

// Logout
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

// Close modal on click outside
window.addEventListener('click', (e) => {
  const profileModal = document.getElementById('profileModal');
  if (e.target === profileModal) {
    closeProfileModal();
  }
});
