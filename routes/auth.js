// routes/auth.js

import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import {
  redirectIfSupplierAuthenticated,
  redirectIfAdminAuthenticated
} from '../middleware/auth.js';

const router = express.Router();


// ===============================
// CADASTRO DE FORNECEDOR
// ===============================
router.post('/supplier/register', async (req, res) => {

  try {

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
      password
    } = req.body;


    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }


    const db = await getDatabase();


    const passwordHash = await bcrypt.hash(password, 10);


    await db.run(
      `
      INSERT INTO suppliers
      (
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        cnpj,
        contact_person,
        password_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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
        passwordHash
      ]
    );


    res.json({
      success: true,
      message: 'Fornecedor cadastrado com sucesso'
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Erro ao cadastrar fornecedor'
    });

  }

});




// ===============================
// LOGIN DO FORNECEDOR
// ===============================
router.post('/supplier/login', async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    const db = await getDatabase();


    const supplier = await db.get(
      `
      SELECT *
      FROM suppliers
      WHERE email = ?
      `,
      [email]
    );


    if (!supplier) {

      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });

    }



    const passwordOk = await bcrypt.compare(
      password,
      supplier.password_hash
    );


    if (!passwordOk) {

      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });

    }



    // cria sessão do fornecedor
    req.session.supplierId = supplier.id;


    res.json({

      success: true,

      message: 'Login realizado',

      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email
      }

    });



  } catch(error){

    console.error(error);

    res.status(500).json({
      error:'Erro no login do fornecedor'
    });

  }

});






// ===============================
// LOGIN DO ADMIN
// ===============================
router.post('/admin/login', async (req,res)=>{


  try {


    const {
      email,
      password
    } = req.body;



    const db = await getDatabase();



    const admin = await db.get(
      `
      SELECT *
      FROM admins
      WHERE email = ?
      `,
      [email]
    );



    if(!admin){

      return res.status(401).json({
        error:'Administrador não encontrado'
      });

    }



    const passwordOk = await bcrypt.compare(
      password,
      admin.password_hash
    );



    if(!passwordOk){

      return res.status(401).json({
        error:'Senha inválida'
      });

    }




    // cria sessão exclusiva do admin
    req.session.admin = {

      id: admin.id,

      name: admin.name,

      email: admin.email

    };



    res.json({

      success:true,

      message:'Login administrativo realizado'

    });



  }catch(error){


    console.error(error);


    res.status(500).json({

      error:'Erro no login administrativo'

    });


  }


});






// ===============================
// LOGOUT FORNECEDOR
// ===============================
router.post('/supplier/logout',(req,res)=>{


  delete req.session.supplierId;


  res.json({

    success:true,

    message:'Fornecedor saiu do sistema'

  });


});






// ===============================
// LOGOUT ADMIN
// ===============================
router.post('/admin/logout',(req,res)=>{


  delete req.session.admin;


  res.json({

    success:true,

    message:'Administrador saiu do sistema'

  });


});



export default router;