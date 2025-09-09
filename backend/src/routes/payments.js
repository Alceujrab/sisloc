const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { Payment, Reservation, Vehicle, User, LoyaltyAdjustment } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração simples de upload local de recibos
const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, receiptsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) }, // 10MB default
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp,application/pdf')
      .split(',')
      .map(s => s.trim());
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de arquivo não suportado'));
  }
});

const router = express.Router();
const groupMinCache = require('../utils/groupMinCache');

// POST /api/payments/create-payment-intent - Criar intenção de pagamento
router.post('/create-payment-intent', authenticateToken, [
  body('reservation_id')
    .isInt({ min: 1 })
    .withMessage('ID da reserva é obrigatório'),
  
  body('payment_method')
    .isIn(['credit_card', 'debit_card'])
    .withMessage('Método de pagamento inválido')
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

    const { reservation_id, payment_method } = req.body;

    // Buscar reserva
    const reservation = await Reservation.findOne({
      where: {
        id: reservation_id,
        user_id: req.user.id,
        status: 'pending'
      },
      include: [{
        model: Vehicle,
        as: 'vehicle'
      }]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada ou não pode ser paga'
      });
    }

    // Verificar se já existe um pagamento pendente
    const existingPayment = await Payment.findOne({
      where: {
        reservation_id,
        status: { [require('sequelize').Op.in]: ['pending', 'processing'] }
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um pagamento pendente para esta reserva'
      });
    }

    // Converter para centavos (Stripe trabalha em centavos)
    const amountInCents = Math.round(reservation.total_amount * 100);

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      payment_method_types: ['card'],
      metadata: {
        reservation_id: reservation_id.toString(),
        user_id: req.user.id.toString(),
        reservation_code: reservation.reservation_code
      }
    });

    // Criar registro de pagamento no banco
    const payment = await Payment.create({
      reservation_id,
      user_id: req.user.id,
      amount: reservation.total_amount,
      currency: 'BRL',
      payment_method,
      payment_gateway: 'stripe',
      gateway_payment_intent: paymentIntent.id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        payment,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Erro ao criar intenção de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/payments/confirm-payment - Confirmar pagamento
router.post('/confirm-payment', authenticateToken, [
  body('payment_intent_id')
    .notEmpty()
    .withMessage('ID da intenção de pagamento é obrigatório')
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

    const { payment_intent_id } = req.body;

    // Buscar pagamento no banco
    const payment = await Payment.findOne({
      where: {
        gateway_payment_intent: payment_intent_id,
        user_id: req.user.id
      },
      include: [{
        model: Reservation,
        as: 'reservation'
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }

    // Verificar status no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Atualizar pagamento
      await payment.update({
        status: 'succeeded',
        payment_date: new Date(),
        gateway_transaction_id: paymentIntent.charges.data[0]?.id,
        gateway_response: paymentIntent
      });

      // Atualizar reserva
      await payment.reservation.update({
        payment_status: 'paid',
        status: 'confirmed'
      });

      // Atualizar status do veículo para reservado
      const vehicle = await Vehicle.findByPk(payment.reservation.vehicle_id);
      if (vehicle) {
        await vehicle.update({ status: 'rented' });
        // Indisponibilizou um veículo: pode alterar mínimos por grupo
        groupMinCache.clear();
      }

      // Fidelidade: creditar pontos (1 ponto por R$1, arredondado)
      try {
        const pts = Math.max(0, Math.floor(Number(payment.amount || 0)));
        if (pts > 0) {
          await LoyaltyAdjustment.create({
            user_id: payment.user_id,
            type: 'earn',
            points: pts,
            description: `Pagamento confirmado reserva ${payment.reservation?.reservation_code || payment.reservation_id}`,
            reservation_id: payment.reservation_id,
            payment_id: payment.id
          });
        }
      } catch (e) { console.warn('Não foi possível creditar pontos:', e.message); }

      res.json({
        success: true,
        message: 'Pagamento confirmado com sucesso',
        data: { payment }
      });

    } else if (paymentIntent.status === 'requires_action') {
      res.json({
        success: false,
        message: 'Pagamento requer ação adicional',
        requires_action: true,
        client_secret: paymentIntent.client_secret
      });

    } else if (paymentIntent.status === 'payment_failed') {
      await payment.update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message
      });

      res.status(400).json({
        success: false,
        message: 'Pagamento falhou',
        error: paymentIntent.last_payment_error?.message
      });

    } else {
      res.json({
        success: false,
        message: 'Status de pagamento desconhecido',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/payments/webhook - Webhook do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar evento
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Atualizar pagamento no banco
        await Payment.update({
          status: 'succeeded',
          payment_date: new Date(),
          gateway_transaction_id: paymentIntent.charges.data[0]?.id,
          gateway_response: paymentIntent
        }, {
          where: {
            gateway_payment_intent: paymentIntent.id
          }
        });

        // Atualizar reserva
        const reservationId = paymentIntent.metadata.reservation_id;
        await Reservation.update({
          payment_status: 'paid',
          status: 'confirmed'
        }, {
          where: { id: reservationId }
        });

  // O webhook confirmou pagamento; dependendo do fluxo, o veículo pode ser marcado como 'rented' em outra etapa.
  // Para segurança, invalidamos o cache de mínimos.
  groupMinCache.clear();
  console.log('✅ Pagamento confirmado via webhook:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        await Payment.update({
          status: 'failed',
          failure_reason: failedPayment.last_payment_error?.message
        }, {
          where: {
            gateway_payment_intent: failedPayment.id
          }
        });

        console.log('❌ Pagamento falhou:', failedPayment.id);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/payments/manual - Registrar pagamento manual (pix, transferência, dinheiro, cartão manual)
router.post('/manual', authenticateToken, [
  body('reservation_id').isInt({ min: 1 }),
  body('payment_method').isIn(['pix','bank_transfer','cash','credit_card','debit_card']),
  body('amount').isFloat({ min: 0.01 }),
  body('payer_name').optional().isString(),
  body('payer_document').optional().isString(),
  body('payer_email').optional().isEmail().withMessage('E-mail inválido'),
  body('payer_phone').optional().isString(),
  body('status').optional().isIn(['pending','processing','succeeded','failed','cancelled','refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }

  const { reservation_id, payment_method, amount, payer_name, payer_document, payer_email, payer_phone, status, details } = req.body;

    // Verifica reserva do próprio usuário (ou admin via admin endpoint futuro)
    const reservation = await Reservation.findOne({ where: { id: reservation_id, user_id: req.user.id } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });

    const payment = await Payment.create({
      reservation_id,
      user_id: req.user.id,
      amount,
      currency: 'BRL',
      payment_method,
      payment_channel: 'manual',
      status: status || 'pending',
      payer_name,
      payer_document,
      payer_email,
      payer_phone,
      details: details || null
    });

    // Se marcado como succeeded, atualizar reserva e creditar pontos
    if ((status || 'pending') === 'succeeded') {
      try {
        const reservation = await Reservation.findByPk(reservation_id);
        if (reservation) {
          await reservation.update({ payment_status: 'paid', status: 'confirmed' });
          const vehicle = await Vehicle.findByPk(reservation.vehicle_id);
          if (vehicle) { await vehicle.update({ status: 'rented' }); groupMinCache.clear(); }
        }
        const pts = Math.max(0, Math.floor(Number(amount || 0)));
        if (pts > 0) {
          await LoyaltyAdjustment.create({ user_id: req.user.id, type: 'earn', points: pts, description: `Pagamento manual reserva ${reservation?.reservation_code || reservation_id}`, reservation_id, payment_id: payment.id });
        }
      } catch (e) { console.warn('Falha pós-pagamento manual:', e.message); }
    }

    res.status(201).json({ success: true, data: { payment } });
  } catch (error) {
    console.error('Erro ao registrar pagamento manual:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/payments/:id/receipt - Anexar recibo (imagem/pdf)
router.post('/:id/receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });

    if (!req.file) return res.status(400).json({ success: false, message: 'Arquivo de recibo é obrigatório' });
    const url = `/uploads/receipts/${req.file.filename}`;
    await payment.update({ receipt_url: url });
    res.json({ success: true, message: 'Recibo anexado', data: { receipt_url: url } });
  } catch (error) {
    console.error('Erro ao anexar recibo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/payments/history - Histórico de pagamentos do usuário
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{
        model: Reservation,
        as: 'reservation',
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['brand', 'model', 'license_plate']
        }]
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/payments/:id - Detalhes do pagamento
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [{
        model: Reservation,
        as: 'reservation',
        include: [{
          model: Vehicle,
          as: 'vehicle'
        }]
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
