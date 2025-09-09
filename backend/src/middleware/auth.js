const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso não fornecido' 
      });
    }

  const secret = process.env.JWT_SECRET || 'devsecret';
  const decoded = jwt.verify(token, secret);
    
    // Verificar se usuário ainda existe
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: 'Conta inativa ou bloqueada' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Você não tem permissão para acessar este recurso' 
      });
    }

    next();
  };
};

// Middleware opcional de autenticação (não obrigatório)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  const decoded = jwt.verify(token, secret);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignorar erros de token em auth opcional
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};
