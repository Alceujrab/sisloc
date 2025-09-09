const express = require('express');
const { User, Reservation, Vehicle, Payment, UserDocument, RefundRequest, LoyaltyAdjustment, RefundAuditLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Diretório de uploads para documentos
const docsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, docsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// Diretório e upload para avatares (clientes)
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, avatarsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp')
      .split(',').map(s => s.trim());
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de arquivo não suportado'));
  }
});

// GET /api/customers/profile - Perfil público do cliente (para admin)
router.get('/profile/:id', async (req, res) => {
  try {
    const customer = await User.findOne({
      where: {
        id: req.params.id,
        role: 'customer'
      },
      attributes: { exclude: ['password'] },
      include: [{
        model: Reservation,
        as: 'reservations',
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['brand', 'model', 'category']
        }],
        order: [['created_at', 'DESC']],
        limit: 10
      }]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    res.json({
      success: true,
      data: { customer }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

// GET /api/customers/documents - Listar documentos do usuário logado
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await UserDocument.findAll({ where: { user_id: req.user.id }, order: [['created_at','DESC']] });
    res.json({ success: true, data: { documents: docs } });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/avatar - Cliente atualiza seu avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Arquivo é obrigatório' });
    }
    const file_url = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    // remove avatar anterior se existir
    if (user.avatar) {
      try {
        const prevPath = path.join(process.cwd(), user.avatar.replace(/^\/+/, ''));
        if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
      } catch (_) {}
    }
    user.avatar = file_url;
    await user.save();
    res.json({ success: true, data: { avatar: file_url } });
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/reservations/:id/accept-contract - Registrar aceite do contrato
router.post('/reservations/:id/accept-contract', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    reservation.contract_accepted_at = new Date();
    reservation.contract_accepted_ip = ip;
    await reservation.save();
    res.json({ success: true, data: { accepted_at: reservation.contract_accepted_at, ip } });
  } catch (error) {
    console.error('Erro ao registrar aceite do contrato:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/reservations/:id/signature - Upload da assinatura (imagem)
router.post('/reservations/:id/signature', authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Arquivo é obrigatório' });
    const reservation = await Reservation.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    // Se já existir uma assinatura, remover arquivo antigo
    if (reservation.contract_signature_url) {
      try {
        const oldPath = path.join(process.cwd(), reservation.contract_signature_url.replace(/^\/+/, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (_) {}
    }
    const file_url = `/uploads/documents/${req.file.filename}`;
    reservation.contract_signature_url = file_url;
    await reservation.save();
    res.json({ success: true, data: { signature_url: file_url } });
  } catch (error) {
    console.error('Erro ao enviar assinatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/customers/reservations/:id/signature - Remover assinatura atual
router.delete('/reservations/:id/signature', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });

    if (!reservation.contract_signature_url) {
      return res.status(400).json({ success: false, message: 'Nenhuma assinatura para remover' });
    }

    try {
      const filePath = path.join(process.cwd(), reservation.contract_signature_url.replace(/^\/+/, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Falha ao remover arquivo de assinatura:', e?.message);
    }

    reservation.contract_signature_url = null;
    await reservation.save();
    res.json({ success: true, message: 'Assinatura removida' });
  } catch (error) {
    console.error('Erro ao remover assinatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/documents - Enviar documento
router.post('/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { type } = req.body;
    if (!['cnh','address_proof'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo de documento inválido' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Arquivo é obrigatório' });
    }
    const file_url = `/uploads/documents/${req.file.filename}`;
    const doc = await UserDocument.create({ user_id: req.user.id, type, file_url, status: 'pending' });
    res.status(201).json({ success: true, data: { document: doc } });
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/customers/reservations/:id/contract - Gerar contrato PDF para reserva
router.get('/reservations/:id/contract', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'customer' }
      ]
    });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contrato_${reservation.reservation_code}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18).text('Contrato de Locação de Veículo', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Código da Reserva: ${reservation.reservation_code}`);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown();

    // Dados do cliente
    const c = reservation.customer;
    doc.fontSize(14).text('Dados do Cliente', { underline: true });
    doc.fontSize(12).text(`Nome: ${c.name}`);
    doc.text(`Email: ${c.email}`);
    if (c.cpf) doc.text(`CPF: ${c.cpf}`);
    if (c.phone) doc.text(`Telefone: ${c.phone}`);
    doc.moveDown(0.5);

    // Dados do veículo
    const v = reservation.vehicle;
    doc.fontSize(14).text('Dados do Veículo', { underline: true });
    doc.fontSize(12).text(`Modelo: ${v.brand} ${v.model}`);
    if (v.license_plate) doc.text(`Placa: ${v.license_plate}`);
    doc.text(`Categoria: ${v.category}`);
    doc.moveDown(0.5);

    // Período e locais
    doc.fontSize(14).text('Período da Locação', { underline: true });
    doc.fontSize(12).text(`Retirada: ${new Date(reservation.start_date).toLocaleString('pt-BR')}`);
    doc.text(`Devolução: ${new Date(reservation.end_date).toLocaleString('pt-BR')}`);
    doc.text(`Retirada em: ${reservation.pickup_location}`);
    doc.text(`Devolução em: ${reservation.return_location}`);
    doc.moveDown(0.5);

    // Valores
    doc.fontSize(14).text('Valores', { underline: true });
    doc.fontSize(12).text(`Diária: R$ ${reservation.daily_rate}`);
    doc.text(`Seguro diário: R$ ${reservation.insurance_daily}`);
    doc.text(`Extras: R$ ${reservation.extras_total}`);
    doc.text(`Subtotal: R$ ${reservation.subtotal}`);
    doc.text(`Seguro total: R$ ${reservation.insurance_total}`);
    doc.text(`Descontos: R$ ${reservation.discount_amount}`);
    doc.font('Helvetica-Bold').text(`Total: R$ ${reservation.total_amount}`);
    doc.font('Helvetica');
    doc.moveDown(0.5);

    // Depósito / Pré-autorização
    doc.fontSize(14).text('Depósito / Pré-autorização', { underline: true });
    doc.fontSize(12).text(`Depósito exigido: ${reservation.deposit_required ? 'Sim' : 'Não'}`);
    if (reservation.deposit_required) {
      doc.text(`Valor do depósito: R$ ${reservation.deposit_amount || 0}`);
      doc.text(`Status da pré-autorização: ${reservation.preauth_status}`);
      if (reservation.preauth_expires_at) doc.text(`Expira em: ${new Date(reservation.preauth_expires_at).toLocaleString('pt-BR')}`);
      if (reservation.preauth_reference) doc.text(`Referência: ${reservation.preauth_reference}`);
    }
    doc.moveDown(0.5);

    // Cláusulas básicas
    doc.fontSize(14).text('Condições Gerais', { underline: true });
    doc.fontSize(10).text('1) O locatário se compromete a zelar pelo veículo e devolvê-lo nas mesmas condições em que foi retirado, salvo desgaste natural.', { align: 'justify' });
    doc.moveDown(0.2);
    doc.text('2) São de responsabilidade do locatário as multas, taxas e danos causados por mau uso durante o período da locação.', { align: 'justify' });
    doc.moveDown(0.2);
    doc.text('3) O não cumprimento das datas de devolução implicará em cobrança adicional proporcional e penalidades previstas em contrato.', { align: 'justify' });
    doc.moveDown(0.2);
    doc.text('4) A cobertura de seguro segue as regras e franquias descritas na apólice vigente, quando contratada.', { align: 'justify' });
    doc.moveDown(0.2);
    doc.text('5) Este contrato é válido somente com a apresentação de documento de identidade e CNH válidos do condutor.', { align: 'justify' });
    doc.moveDown(2);

    // Assinaturas (espaços)
    const y = doc.y;
    const signY = y + 20;
    // Locatário
    if (reservation.contract_signature_url) {
      try {
        const imgPath = path.join(process.cwd(), reservation.contract_signature_url.replace(/^\/+/, ''));
        if (fs.existsSync(imgPath)) {
          doc.image(imgPath, 50, signY - 10, { width: 200, height: 60, fit: [200,60] });
        }
      } catch (_) {}
    } else {
      doc.text('______________________________', 50, signY);
    }
    doc.text('Assinatura do Locatário', 60, signY + 15);
    // Locadora (manual)
    doc.text('______________________________', 330, signY);
    doc.text('Assinatura da Locadora', 350, signY + 15);

    // Aceite
    doc.moveDown(2);
    if (reservation.contract_accepted_at) {
      doc.fontSize(10).text(`Aceito digitalmente em ${new Date(reservation.contract_accepted_at).toLocaleString('pt-BR')} ${reservation.contract_accepted_ip ? `(IP: ${reservation.contract_accepted_ip})` : ''}`);
    } else {
      doc.fontSize(10).text('Contrato ainda não aceito digitalmente.');
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/customers/dashboard - Resumo do portal do cliente
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.id;

    const [
      upcomingReservations,
      pendingPayments,
      totalReservations,
      paidReservations
    ] = await Promise.all([
      Reservation.findAll({
        where: {
          user_id: userId,
          status: ['pending','confirmed','active'],
          start_date: { [require('sequelize').Op.gte]: now }
        },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['brand','model','thumbnail'] }],
        order: [['start_date','ASC']],
        limit: 5
      }),
      Payment.count({ where: { user_id: userId, status: ['pending','processing'] } }),
      Reservation.count({ where: { user_id: userId } }),
      Reservation.count({ where: { user_id: userId, payment_status: 'paid' } })
    ]);

    const documents = { cnh_uploaded: false, address_proof_uploaded: false, status: 'unavailable' };

    res.json({
      success: true,
      data: {
        metrics: { totalReservations, paidReservations, pendingPayments },
        upcomingReservations,
        documents
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard do cliente:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/customers/loyalty - Resumo de fidelidade do usuário
router.get('/loyalty', authenticateToken, async (req, res) => {
  try {
    // Pontuação baseada em ajustes (earn na confirmação do pagamento; redeem via endpoint; expiração futura)
    const adjustments = await LoyaltyAdjustment.findAll({ where: { user_id: req.user.id }, order: [['created_at','DESC']] });
    const points = adjustments.reduce((acc, a) => acc + Number(a.points || 0), 0);
    const tier = points >= 5000 ? 'Platina' : points >= 2500 ? 'Ouro' : points >= 1200 ? 'Prata' : 'Azul';

    const extract = adjustments.slice(0, 30).map(a => ({
      date: a.created_at,
      desc: a.description || (a.type === 'earn' ? 'Pontos acumulados' : a.type === 'redeem' ? 'Resgate de pontos' : a.type === 'expire' ? 'Expiração de pontos' : 'Ajuste manual'),
      delta: Number(a.points)
    }));

    res.json({ success: true, data: { points, tier, extract } });
  } catch (error) {
    console.error('Erro ao carregar fidelidade:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/loyalty/redeem - Resgatar pontos por crédito (ex: desconto)
router.post('/loyalty/redeem', authenticateToken, [
  body('points').isInt({ min: 100 }).withMessage('Mínimo de 100 pontos para resgatar'),
  body('reason').optional().isString().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const pts = parseInt(req.body.points, 10);
    // calcular saldo atual
    const adjustments = await LoyaltyAdjustment.findAll({ where: { user_id: req.user.id } });
    const balance = adjustments.reduce((acc, a) => acc + Number(a.points || 0), 0);
    if (pts > balance) {
      return res.status(400).json({ success: false, message: 'Pontos insuficientes' });
    }
    // criar ajuste negativo de resgate
    const adj = await LoyaltyAdjustment.create({
      user_id: req.user.id,
      type: 'redeem',
      points: -Math.abs(pts),
      description: req.body.reason || `Resgate de ${pts} pontos`
    });
    return res.status(201).json({ success: true, data: { redemption: adj } });
  } catch (error) {
    console.error('Erro ao resgatar pontos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/customers/refunds - Abrir solicitação de reembolso
router.post('/refunds', authenticateToken, [
  body('reservation_code').optional().isString(),
  body('reservation_id').optional().isInt(),
  body('payment_id').optional().isInt(),
  body('reason').notEmpty().withMessage('Motivo é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const { reservation_id, payment_id, reservation_code, reason } = req.body;

    // Opcionalmente validar que reservation/payment pertencem ao usuário
    if (reservation_id) {
      const r = await Reservation.findOne({ where: { id: reservation_id, user_id: req.user.id } });
      if (!r) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }
    if (payment_id) {
      const p = await Payment.findOne({ where: { id: payment_id, user_id: req.user.id } });
      if (!p) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    }

    const rr = await RefundRequest.create({
      user_id: req.user.id,
      reservation_id: reservation_id || null,
      payment_id: payment_id || null,
      reservation_code: reservation_code || null,
      reason
    });

    try {
      await RefundAuditLog.create({ refund_request_id: rr.id, actor_user_id: req.user.id, action: 'created', message: reason?.slice(0, 200) || 'Solicitação criada' });
    } catch (_) {}

    res.status(201).json({ success: true, data: { refund: rr } });
  } catch (error) {
    console.error('Erro ao criar solicitação de reembolso:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/customers/refunds - Listar solicitações do usuário
router.get('/refunds', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await RefundRequest.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        { model: Reservation, as: 'reservation', attributes: ['id','reservation_code','start_date','end_date','status'] },
        { model: Payment, as: 'payment', attributes: ['id','amount','status'] }
      ],
      order: [['created_at','DESC']],
      limit,
      offset
    });

    res.json({ success: true, data: { refunds: rows, pagination: { currentPage: page, totalPages: Math.ceil(count/limit), totalItems: count, itemsPerPage: limit } } });
  } catch (error) {
    console.error('Erro ao listar reembolsos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});
