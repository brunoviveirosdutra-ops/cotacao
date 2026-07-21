// ======================================================
// COTA-ÇÃO - PAINEL ADMINISTRATIVO
// admin.js
// ======================================================

const App = {

    currentView: "dashboard",

    suppliers: [],

    products: [],

    quotes: [],

    currentModal: null

};

// ======================================================
// API
// ======================================================

const API = {

    async request(url, options = {}) {

        const response = await fetch(url, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        if (!response.ok) {

            let message = "Erro interno";

            try {

                const erro = await response.json();

                message = erro.error || erro.message || message;

            } catch {}

            throw new Error(message);

        }

        if (response.status === 204) {

            return null;

        }

        return response.json();

    },

    get(url) {

        return this.request(url);

    },

    post(url, data) {

        return this.request(url, {

            method: "POST",

            body: JSON.stringify(data)

        });

    },

    put(url, data) {

        return this.request(url, {

            method: "PUT",

            body: JSON.stringify(data)

        });

    },

    delete(url) {

        return this.request(url, {

            method: "DELETE"

        });

    }

};

// ======================================================
// INICIALIZAÇÃO
// ======================================================

window.addEventListener("DOMContentLoaded", init);

async function init() {

    try {

        const admin = await API.get("/api/admin/me");

        const info = document.getElementById("user-info");

        if (info) {

            info.textContent = admin.name;

        }

        configurarMenu();

        await loadDashboard();

        showView("dashboard");

    }

    catch (erro) {

        console.error(erro);

        window.location.href = "/admin-login.html";

    }

}

// ======================================================
// MENU
// ======================================================

function configurarMenu() {

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.addEventListener("click", e => {

                e.preventDefault();

                const view = item.dataset.view;

                if (!view) return;

                if (view === "logout") {

                    logout();

                    return;

                }

                loadView(view);

            });

        });

}

// ======================================================
// TROCAR TELA
// ======================================================

async function loadView(view) {

    App.currentView = view;

    showView(view);

    switch(view){

        case "dashboard":

            await loadDashboard();

            break;

        case "suppliers":

            await loadSuppliers();

            break;

        case "products":

            await loadProducts();

            break;

        case "quotes":

            await loadQuotes();

            break;

    }

}

// ======================================================
// MOSTRAR TELA
// ======================================================

function showView(view){

    document
        .querySelectorAll(".view")
        .forEach(section=>{

            section.classList.remove("active");

        });

    const section = document.getElementById(view);

    if(section){

        section.classList.add("active");

    }

    document
        .querySelectorAll(".menu-item")
        .forEach(item=>{

            item.classList.remove("active");

        });

    const active = document.querySelector(`[data-view="${view}"]`);

    if(active){

        active.classList.add("active");

    }

    const titulo = document.getElementById("page-title");

    if(titulo){

        titulo.textContent =
            view.charAt(0).toUpperCase()+view.slice(1);

    }

}
// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        const [
            suppliers,
            products,
            quotes
        ] = await Promise.all([

            API.get("/api/suppliers"),

            API.get("/api/products"),

            API.get("/api/quotes")

        ]);

        document.getElementById("stat-suppliers").textContent =
            suppliers.length;

        document.getElementById("stat-products").textContent =
            products.length;

        document.getElementById("stat-active-quotes").textContent =
            quotes.filter(q => q.status === "ativa").length;

        document.getElementById("stat-accepted-quotes").textContent =
            quotes.filter(q => q.status === "aceita").length;

    }

    catch (erro) {

        console.error(erro);

        alert("Erro ao carregar dashboard.");

    }

}

// ======================================================
// FORNECEDORES
// ======================================================

async function loadSuppliers() {

    alert("loadSuppliers foi chamada")

    try {

        App.suppliers =
            await API.get("/api/suppliers");

        renderSuppliers();

    }

    catch (erro) {

        console.error(erro);

        alert("Erro ao carregar fornecedores.");

    }

}

// ======================================================
// TABELA
// ======================================================

function renderSuppliers() {

    alert("renderSuppliers");
    console.log(App.suppliers);

    const tbody =
        document.getElementById("suppliers-list");

        alert(tbody? "tbody encontrado" : "tbody NÃO encontrado");

    tbody.innerHTML = "";

    if (!App.suppliers.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Nenhum fornecedor encontrado.
                </td>
            </tr>
        `;

        return;

    }

    App.suppliers.forEach(supplier => {

        tbody.insertAdjacentHTML("beforeend", `

            <tr>

                <td>${supplier.id}</td>

                <td>${supplier.name}</td>

                <td>${supplier.email}</td>

                <td>${supplier.phone || "-"}</td>

                <td>${supplier.city || "-"}</td>

                <td>

                    <span class="status-badge status-${supplier.status}">

                        ${supplier.status}

                    </span>

                </td>

                <td>

                    <button
                        class="btn-edit"
                        data-id="${supplier.id}">

                        Editar

                    </button>

                    <button
                        class="btn-delete"
                        data-id="${supplier.id}">

                        Excluir

                    </button>

                </td>

            </tr>

        `);

    });

    configurarEventosFornecedor();

}

// ======================================================
// EVENTOS
// ======================================================

function configurarEventosFornecedor() {

    document
        .querySelectorAll(".btn-edit")
        .forEach(botao => {

            botao.onclick = () => {

                const id =
                    Number(botao.dataset.id);

                openSupplierModal(id);

            };

        });

    document
        .querySelectorAll(".btn-delete")
        .forEach(botao => {

            botao.onclick = () => {

                const id =
                    Number(botao.dataset.id);

                deleteSupplier(id);

            };

        });

}

// ======================================================
// DELETAR
// ======================================================

async function deleteSupplier(id){

    const confirmar =
        confirm("Deseja realmente excluir este fornecedor?");

    if(!confirmar){

        return;

    }

    try{

        await API.delete(`/api/suppliers/${id}`);

        await loadSuppliers();

        alert("Fornecedor removido com sucesso.");

    }

    catch(erro){

        console.error(erro);

        alert(erro.message);

    }

}
// ======================================================
// PRODUTOS
// ======================================================

async function loadProducts() {

    try {

        App.products = await API.get("/api/products");

        renderProducts();

    } catch (erro) {

        console.error(erro);

        alert("Erro ao carregar produtos.");

    }

}

function renderProducts() {

    const tbody = document.getElementById("products-list");

    tbody.innerHTML = "";

    if (!App.products.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;

    }

    App.products.forEach(product => {

        tbody.insertAdjacentHTML("beforeend",`

            <tr>

                <td>${product.id}</td>

                <td>${product.name}</td>

                <td>${product.category}</td>

                <td>${product.unit}</td>

                <td>

                    <span class="status-badge status-${product.status}">
                        ${product.status}
                    </span>

                </td>

                <td>

                    <button
                        class="btn-edit-product"
                        data-id="${product.id}">
                        Editar
                    </button>

                    <button
                        class="btn-delete-product"
                        data-id="${product.id}">
                        Excluir
                    </button>

                </td>

            </tr>

        `);

    });

    configurarEventosProdutos();

}

function configurarEventosProdutos(){

    document
        .querySelectorAll(".btn-edit-product")
        .forEach(btn=>{

            btn.onclick=()=>{

                openProductModal(
                    Number(btn.dataset.id)
                );

            }

        });

    document
        .querySelectorAll(".btn-delete-product")
        .forEach(btn=>{

            btn.onclick=()=>{

                deleteProduct(
                    Number(btn.dataset.id)
                );

            }

        });

}

async function deleteProduct(id){

    if(!confirm("Deseja excluir este produto?")){

        return;

    }

    try{

        await API.delete(`/api/products/${id}`);

        await loadProducts();

        alert("Produto removido.");

    }

    catch(erro){

        console.error(erro);

        alert(erro.message);

    }

}

// ======================================================
// COTAÇÕES
// ======================================================

async function loadQuotes(){

    try{

        App.quotes = await API.get("/api/quotes");

        renderQuotes();

    }

    catch(erro){

        console.error(erro);

        alert("Erro ao carregar cotações.");

    }

}

function renderQuotes(){

    const tbody =
        document.getElementById("quotes-list");

    tbody.innerHTML="";

    if(!App.quotes.length){

        tbody.innerHTML=`

            <tr>

                <td colspan="8">

                    Nenhuma cotação encontrada.

                </td>

            </tr>

        `;

        return;

    }

    App.quotes.forEach(quote=>{

        tbody.insertAdjacentHTML("beforeend",`

            <tr>

                <td>${quote.id}</td>

                <td>${quote.supplier_name}</td>

                <td>${quote.product_name}</td>

                <td>${quote.quantity}</td>

                <td>

                    R$
                    ${Number(quote.unit_price).toFixed(2)}

                </td>

                <td>

                    R$
                    ${Number(quote.total_price).toFixed(2)}

                </td>

                <td>

                    <span class="status-badge status-${quote.status}">

                        ${quote.status}

                    </span>

                </td>

                <td>

                    <button
                        class="btn-edit-quote"
                        data-id="${quote.id}">

                        Editar

                    </button>

                    <button
                        class="btn-delete-quote"
                        data-id="${quote.id}">

                        Excluir

                    </button>

                </td>

            </tr>

        `);

    });

    configurarEventosQuotes();

}

function configurarEventosQuotes(){

    document
        .querySelectorAll(".btn-edit-quote")
        .forEach(btn=>{

            btn.onclick=()=>{

                openQuoteModal(

                    Number(btn.dataset.id)

                );

            }

        });

    document
        .querySelectorAll(".btn-delete-quote")
        .forEach(btn=>{

            btn.onclick=()=>{

                deleteQuote(

                    Number(btn.dataset.id)

                );

            }

        });

}

async function deleteQuote(id){

    if(!confirm("Deseja excluir esta cotação?")){

        return;

    }

    try{

        await API.delete(`/api/quotes/${id}`);

        await loadQuotes();

        alert("Cotação removida.");

    }

    catch(erro){

        console.error(erro);

        alert(erro.message);

    }

}
// ======================================================
// MODAL
// ======================================================

function closeModal() {

    document.getElementById("modal").style.display = "none";

    document.getElementById("modal-form").innerHTML = "";

    App.currentModal = null;

}

// Fecha ao clicar fora do modal
window.onclick = function (event) {

    const modal = document.getElementById("modal");

    if (event.target === modal) {

        closeModal();

    }

};

// ======================================================
// FORNECEDORES
// ======================================================

function openSupplierModal(id = null) {

    App.currentModal = {
        type: "supplier",
        id
    };

    document.getElementById("modal-title").textContent =
        id ? "Editar Fornecedor" : "Novo Fornecedor";

    document.getElementById("modal-form").innerHTML = `

        <input name="name" placeholder="Nome" required>

        <input name="email" type="email" placeholder="Email" required>

        <input name="phone" placeholder="Telefone">

        <button type="submit">

            Salvar

        </button>

    `;

    document.getElementById("modal").style.display = "block";

}

// ======================================================
// PRODUTOS
// ======================================================

function openProductModal(id = null) {

    App.currentModal = {
        type: "product",
        id
    };

    document.getElementById("modal-title").textContent =
        id ? "Editar Produto" : "Novo Produto";

    document.getElementById("modal-form").innerHTML = `

        <input name="name" placeholder="Nome" required>

        <input name="category" placeholder="Categoria">

        <input name="unit" placeholder="Unidade">

        <button type="submit">

            Salvar

        </button>

    `;

    document.getElementById("modal").style.display = "block";

}

// ======================================================
// COTAÇÕES
// ======================================================

function openQuoteModal(id = null) {

    App.currentModal = {
        type: "quote",
        id
    };

    document.getElementById("modal-title").textContent =
        id ? "Editar Cotação" : "Nova Cotação";

    document.getElementById("modal-form").innerHTML = `

        <input name="supplier_id" placeholder="Fornecedor">

        <input name="product_id" placeholder="Produto">

        <input
            name="quantity"
            type="number"
            placeholder="Quantidade">

        <input
            name="unit_price"
            type="number"
            step="0.01"
            placeholder="Preço">

        <button type="submit">

            Salvar

        </button>

    `;

    document.getElementById("modal").style.display = "block";

}

// ======================================================
// SUBMIT
// ======================================================

async function submitModalForm(event) {

    event.preventDefault();

    const form = event.target;

    const dados = Object.fromEntries(
        new FormData(form)
    );

    try {

        switch (App.currentModal.type) {

            case "supplier":

                if (App.currentModal.id) {

                    await API.put(
                        `/api/suppliers/${App.currentModal.id}`,
                        dados
                    );

                } else {

                    await API.post(
                        "/api/suppliers",
                        dados
                    );

                }

                await loadSuppliers();

                break;

            case "product":

                if (App.currentModal.id) {

                    await API.put(
                        `/api/products/${App.currentModal.id}`,
                        dados
                    );

                } else {

                    await API.post(
                        "/api/products",
                        dados
                    );

                }

                await loadProducts();

                break;

            case "quote":

                if (App.currentModal.id) {

                    await API.put(
                        `/api/quotes/${App.currentModal.id}`,
                        dados
                    );

                } else {

                    await API.post(
                        "/api/quotes",
                        dados
                    );

                }

                await loadQuotes();

                break;

        }

        closeModal();

        alert("Registro salvo com sucesso.");

    }

    catch (erro) {

        console.error(erro);

        alert(erro.message);

    }

}

// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    if (!confirm("Deseja sair do sistema?")) {

        return;

    }

    try {

        await API.post("/api/admin/logout", {});

        window.location.href = "/admin-login.html";

    }

    catch (erro) {

        alert("Erro ao sair.");

    }

}

// ======================================================
// FUNÇÕES GLOBAIS
// ======================================================

window.loadView = loadView;
window.openSupplierModal = openSupplierModal;
window.openProductModal = openProductModal;
window.openQuoteModal = openQuoteModal;
window.submitModalForm = submitModalForm;
window.closeModal = closeModal;
window.logout = logout;