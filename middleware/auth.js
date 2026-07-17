// Middleware para verificar autenticação de fornecedor
export const authenticateSupplier = (req, res, next) => {
  const supplierId = req.session?.supplierId;
  
  if (!supplierId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  req.supplierId = supplierId;
  next();
};

// Middleware para redirecionar se já está autenticado
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session?.supplierId) {
    return res.redirect('/dashboard.html');
  }
  next();
};