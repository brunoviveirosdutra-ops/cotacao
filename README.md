# Cota-ção - Sistema de Cotação de Fornecedores

Sistema web completo para gerenciar cotações de carne e frango com múltiplos fornecedores.

## Recursos

✅ Cadastro de fornecedores  
✅ Cadastro de produtos (carne/frango)  
✅ Criação e gerenciamento de cotações  
✅ Comparação de preços  
✅ Dashboard com análise de preços  
✅ Historico de cotações  
✅ Interface web responsiva  

## Instalação

```bash
npm install
```

## Uso

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

Acesse `http://localhost:3000`

## Estrutura

```
├── server.js              # Servidor principal
├── db/
│   ├── database.js        # Configuração do banco
│   └── schema.sql         # Schema do banco de dados
├── routes/
│   ├── suppliers.js       # Rotas de fornecedores
│   ├── products.js        # Rotas de produtos
│   ├── quotes.js          # Rotas de cotações
│   └── dashboard.js       # Rotas de dashboard
├── public/
│   ├── index.html         # Página principal
│   ├── css/
│   │   └── style.css      # Estilos
│   ├── js/
│   │   ├── app.js         # App principal
│   │   └── api.js         # Cliente API
│   └── img/               # Imagens
└── package.json
```

## Licença

MIT