// middleware/auth.js

// Verifica se o fornecedor está autenticado
export const authenticateSupplier = (req, res, next) => {
  const supplierId = req.session?.supplierId;

  if (!supplierId) {
    return res.status(401).json({
      error: 'Fornecedor não autenticado'
    });
  }

  req.supplierId = supplierId;
  next();
};


// Verifica se o administrador está autenticado
export const authenticateAdmin = (req, res, next) => {
  const admin = req.session?.admin;

  if (!admin) {
    return res.status(401).json({
      error: 'Administrador não autenticado'
    });
  }

  req.admin = admin;
  next();
};


// Impede fornecedor logado de voltar para login
export const redirectIfSupplierAuthenticated = (req, res, next) => {

  if (req.session?.supplierId) {
    return res.redirect('/dashboard.html');
  }

  next();
};


// Impede administrador logado de voltar para login
export const redirectIfAdminAuthenticated = (req, res, next) => {

  if (req.session?.admin) {
    return res.redirect('/admin.html');
  }

  next();
};
