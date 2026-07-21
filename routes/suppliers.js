import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { 
  authenticateAdmin,
  authenticateSupplier
} from '../middleware/auth.js';


const router = express.Router();


// ======================================
// LISTAR FORNECEDORES (ADMIN)
// ======================================
router.get('/', authenticateAdmin, async (req,res)=>{

try{

const db = await getDatabase();

const suppliers = await db.all(
`
SELECT 
id,
name,
email,
phone,
city,
status,
created_at
FROM suppliers
ORDER BY name
`
);

res.json(suppliers);


}catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}

});





// ======================================
// PERFIL DO FORNECEDOR LOGADO
// ======================================
router.get('/me/profile', authenticateSupplier, async(req,res)=>{

try{

const db = await getDatabase();


const supplier = await db.get(
`
SELECT 
id,
name,
email,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status,
created_at
FROM suppliers
WHERE id = ?
`,
req.supplierId
);



if(!supplier){

return res.status(404).json({
error:'Fornecedor não encontrado'
});

}


res.json(supplier);


}catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}

});






// ======================================
// ATUALIZAR PERFIL FORNECEDOR
// ======================================
router.put('/me/profile', authenticateSupplier, async(req,res)=>{


try{


const db = await getDatabase();


const {
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person
}=req.body;



const result = await db.run(

`
UPDATE suppliers SET

phone=?,
address=?,
city=?,
state=?,
zip_code=?,
cnpj=?,
contact_person=?,
updated_at=CURRENT_TIMESTAMP

WHERE id=?

`,

[
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
req.supplierId
]

);



if(result.changes===0){

return res.status(404).json({
error:'Fornecedor não encontrado'
});

}


res.json({
message:'Perfil atualizado com sucesso'
});


}catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}


});







// ======================================
// CRIAR FORNECEDOR (ADMIN)
// ======================================
router.post('/', authenticateAdmin, async(req,res)=>{


try{


const db = await getDatabase();


const {
name,
email,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status,
password

}=req.body;



if(!name || !email){

return res.status(400).json({
error:'Nome e email são obrigatórios'
});

}



const existe = await db.get(
'SELECT id FROM suppliers WHERE email=?',
email
);



if(existe){

return res.status(400).json({
error:'Email já cadastrado'
});

}




const senha = password || Math.random()
.toString(36)
.slice(-8);



const hash = await bcrypt.hash(
senha,
10
);



const result = await db.run(

`
INSERT INTO suppliers

(
name,
email,
password_hash,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status
)

VALUES (?,?,?,?,?,?,?,?,?,?,?)

`,

[
name,
email,
hash,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status || 'ativo'
]

);



res.status(201).json({

id:result.lastID,

message:'Fornecedor criado com sucesso',

password:senha

});



}catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}


});







// ======================================
// BUSCAR FORNECEDOR POR ID (ADMIN)
// ======================================
router.get('/:id', authenticateAdmin, async(req,res)=>{


try{


const db = await getDatabase();


const supplier = await db.get(

`
SELECT *
FROM suppliers
WHERE id=?
`

,
req.params.id

);



if(!supplier){

return res.status(404).json({
error:'Fornecedor não encontrado'
});

}



res.json(supplier);



}catch(error){

res.status(500).json({
error:error.message
});

}


});







// ======================================
// ATUALIZAR FORNECEDOR (ADMIN)
// ======================================
router.put('/:id', authenticateAdmin, async(req,res)=>{


try{


const db = await getDatabase();


const {
name,
email,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status

}=req.body;



const result = await db.run(

`
UPDATE suppliers SET

name=?,
email=?,
phone=?,
address=?,
city=?,
state=?,
zip_code=?,
cnpj=?,
contact_person=?,
status=?,
updated_at=CURRENT_TIMESTAMP

WHERE id=?

`
,

[
name,
email,
phone,
address,
city,
state,
zip_code,
cnpj,
contact_person,
status,
req.params.id
]

);



if(result.changes===0){

return res.status(404).json({
error:'Fornecedor não encontrado'
});

}


res.json({
message:'Fornecedor atualizado'
});


}catch(error){

res.status(500).json({
error:error.message
});

}


});







// ======================================
// DELETAR FORNECEDOR (ADMIN)
// ======================================
router.delete('/:id', authenticateAdmin, async(req,res)=>{


try{


const db = await getDatabase();


const result = await db.run(

'DELETE FROM suppliers WHERE id=?',

req.params.id

);



if(result.changes===0){

return res.status(404).json({
error:'Fornecedor não encontrado'
});

}


res.json({
message:'Fornecedor deletado'
});


}catch(error){

res.status(500).json({
error:error.message
});

}


});



export default router;