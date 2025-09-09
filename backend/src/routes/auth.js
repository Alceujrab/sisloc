const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Função para gerar token JWT
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'devsecret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { userId }, 
    secret, 
    { expiresIn }
  );
};

// Validações
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),

  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// POST /api/auth/register - Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Gerar token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se conta está ativa
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta inativa ou bloqueada'
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    const expose = process.env.EXPOSE_ERRORS === 'true' || process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      ...(expose && { error: String(error?.message || error) })
    });
  }
});

// POST /api/auth/forgot-password - Solicitar redefinição de senha
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Não revelar se existe ou não
      return res.json({ success: true, message: 'Se o email existir, enviaremos instruções.' });
    }

    // Gerar token e expiração
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await user.update({ reset_password_token: token, reset_password_expires: expires });

    // Em dev, retornar o token para facilitar
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Reset token para ${email}: ${token}`);
    }

    // TODO: Enviar email via nodemailer em produção
    return res.json({ success: true, message: 'Instruções enviadas para o email.', ...(process.env.NODE_ENV === 'development' && { data: { token } }) });
  } catch (err) {
    console.error('Erro forgot-password:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/auth/reset-password - Redefinir senha
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token é obrigatório'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }

    const { token, password } = req.body;
    const now = new Date();
    const user = await User.findOne({ where: { reset_password_token: token } });
    if (!user || !user.reset_password_expires || now > user.reset_password_expires) {
      return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }

    await user.update({ password, reset_password_token: null, reset_password_expires: null });
    return res.json({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('Erro reset-password:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/auth/verify-email - Verificar email por token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token é obrigatório' });
    const user = await User.findOne({ where: { verification_token: token } });
    if (!user) return res.status(400).json({ success: false, message: 'Token inválido' });
    await user.update({ is_verified: true, verification_token: null });
    return res.json({ success: true, message: 'Email verificado com sucesso' });
  } catch (err) {
    console.error('Erro verify-email:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/auth/resend-verification - Reenviar verificação
router.post('/resend-verification', [ body('email').isEmail() ], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ success: true, message: 'Se o email existir, enviaremos instruções.' });
    if (user.is_verified) return res.json({ success: true, message: 'Email já verificado.' });
    const token = require('crypto').randomBytes(32).toString('hex');
    await user.update({ verification_token: token });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Verification token para ${email}: ${token}`);
    }
    // TODO: Enviar email em produção
    return res.json({ success: true, message: 'Verificação reenviada.', ...(process.env.NODE_ENV === 'development' && { data: { token } }) });
  } catch (err) {
    console.error('Erro resend-verification:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Perfil do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/auth/profile - Atualizar perfil
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),

  body('cpf')
    .optional()
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const allowedFields = [
      'name', 'phone', 'cpf', 'birth_date', 'cnh_number', 
      'cnh_expiry', 'address', 'city', 'state', 'zip_code'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Verificar senha atual
    const isValidPassword = await req.user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/logout - Logout (invalidar token no frontend)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router;
