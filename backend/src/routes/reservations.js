const express = require('express');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Reservation, Vehicle, User, Coupon, PriceRule } = require('../models');
const EventEmitter = require('events');
const notifier = new EventEmitter();
const { sendEmail } = require('../utils/email');

// Mock de e-mail (log)
notifier.on('reservation.created', async ({ reservation }) => {
  try {
    const r = reservation;
  const subject = `Reserva criada #${r.reservation_code}`;
  const to = r.customer?.email;
  const html = `<p>Olá ${r.customer?.name || ''},</p><p>Sua reserva <strong>#${r.reservation_code}</strong> foi criada para ${new Date(r.start_date).toLocaleString('pt-BR')} até ${new Date(r.end_date).toLocaleString('pt-BR')}.</p>`;
  if (to) await sendEmail({ to, subject, html, text: `Reserva ${r.reservation_code} criada.` });
  console.log(`[EMAIL] Reserva criada #${r.reservation_code} enviada para ${to || 'N/A'}`);
  } catch (e) { console.warn('Falha ao enviar e-mail de criação:', e.message); }
});
notifier.on('reservation.extended', async ({ reservation }) => {
  try {
    const r = reservation;
  const subject = `Reserva estendida #${r.reservation_code}`;
  const to = r.customer?.email;
  const html = `<p>Olá ${r.customer?.name || ''},</p><p>Sua reserva <strong>#${r.reservation_code}</strong> foi estendida. Nova devolução: ${new Date(r.end_date).toLocaleString('pt-BR')}.</p>`;
  if (to) await sendEmail({ to, subject, html, text: `Reserva ${r.reservation_code} estendida.` });
  console.log(`[EMAIL] Reserva estendida #${r.reservation_code} enviada para ${to || 'N/A'}`);
  } catch (e) { console.warn('Falha ao enviar e-mail de extensão:', e.message); }
});
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ---- Helpers para regras de preço e disponibilidade ----
function eachDay(start, end) {
  const dates = [];
  const d = new Date(start);
  const endDate = new Date(end);
  while (d < endDate) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

async function getActivePriceRules(vehicle) {
  const rules = await PriceRule.findAll({ where: { is_active: true }, order: [['priority', 'DESC']] });
  // Não filtramos por group/location aqui; deixamos para o momento da aplicação por dia
  return rules;
}

function applyRulesToDailyRate(baseRate, date, vehicle, rules) {
  let rate = Number(baseRate);
  const dow = date.getDay();
  rules.forEach(rule => {
    if (rule.location && vehicle.location && rule.location !== vehicle.location) return;
    if (rule.group_id && vehicle.group_id && rule.group_id !== vehicle.group_id) return;
    if (rule.start_date && date < new Date(rule.start_date)) return;
    if (rule.end_date && date > new Date(rule.end_date)) return;
    if (rule.days_of_week) {
      try {
        const arr = JSON.parse(rule.days_of_week);
        if (Array.isArray(arr) && arr.length && !arr.includes(dow)) return;
      } catch(_) {}
    }
    const val = Number(rule.adjustment_value);
    if (rule.adjustment_type === 'percent') rate = rate * (1 + val / 100);
    else rate = rate + val;
  });
  return Math.max(0, Number(rate.toFixed(2)));
}

function getTurnaroundHours() {
  const n = Number(process.env.TURNAROUND_HOURS || '2');
  return isNaN(n) ? 2 : n;
}

// ---- Helpers de pré-autorização (depósito) ----
function getPreauthPolicy() {
  const percent = Number(process.env.PREAUTH_PERCENT || '15'); // % do total
  const min = Number(process.env.PREAUTH_MIN || '300'); // valor mínimo
  const max = Number(process.env.PREAUTH_MAX || '2000'); // valor máximo
  const requiredDefault = (process.env.PREAUTH_REQUIRED_DEFAULT || 'true').toLowerCase() === 'true';
  const holdDays = Number(process.env.PREAUTH_HOLD_DAYS || '7');
  return { percent, min, max, requiredDefault, holdDays };
}

function calculatePreauth(totalAmount) {
  const { percent, min, max, requiredDefault } = getPreauthPolicy();
  const required = requiredDefault && Number(totalAmount) > 0;
  let amount = 0;
  if (required) {
    const byPercent = (Number(totalAmount) * percent) / 100;
    amount = Math.max(min, Math.min(max, Number(byPercent.toFixed(2))));
  }
  return { required, amount: Number(amount.toFixed(2)) };
}

// POST /api/reservations - Criar nova reserva
router.post('/', authenticateToken, [
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('ID do veículo é obrigatório'),
  
  body('start_date')
    .isISO8601()
    .withMessage('Data de início inválida'),
  
  body('end_date')
    .isISO8601()
    .withMessage('Data de fim inválida'),
  
  body('pickup_location')
    .trim()
    .notEmpty()
    .withMessage('Local de retirada é obrigatório'),
  
  body('return_location')
    .trim()
    .notEmpty()
    .withMessage('Local de devolução é obrigatório'),
  body('coupon_code')
    .optional()
    .isString()
    .trim()
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

    const {
      vehicle_id,
      start_date,
      end_date,
      pickup_location,
      return_location,
      pickup_time,
      return_time,
      include_insurance = false,
  extras = [],
  coupon_code
    } = req.body;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Validar datas
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de fim deve ser posterior à data de início'
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Data de início não pode ser no passado'
      });
    }

    // Verificar se veículo existe e está disponível
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Veículo não está disponível'
      });
    }

    // Verificar disponibilidade nas datas, aplicando buffer de virada (turnaround)
    const turnaroundHrs = getTurnaroundHours();
    const bufferMs = turnaroundHrs * 60 * 60 * 1000;
    const startWithBuffer = new Date(startDate.getTime() - bufferMs);
    const endWithBuffer = new Date(endDate.getTime() + bufferMs);

    const conflictingReservations = await Reservation.findAll({
      where: {
        vehicle_id,
        status: { [Op.in]: ['confirmed', 'active'] },
        [Op.and]: [
          {
            [Op.or]: [
              {
                start_date: { [Op.between]: [startWithBuffer, endWithBuffer] }
              },
              {
                end_date: { [Op.between]: [startWithBuffer, endWithBuffer] }
              },
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: endWithBuffer } },
                  { end_date: { [Op.gte]: startWithBuffer } }
                ]
              }
            ]
          }
        ]
      }
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Veículo não está disponível nas datas selecionadas'
      });
    }

  // Calcular preços com regras dinâmicas
  const dates = eachDay(startDate, endDate);
  const rules = await getActivePriceRules(vehicle);
  const perDayRates = dates.map(d => applyRulesToDailyRate(vehicle.daily_rate, d, vehicle, rules));
  const daysCount = Math.max(1, perDayRates.length);
  const dailyRate = Number(vehicle.daily_rate); // armazenamos a base
  const insuranceDaily = include_insurance ? vehicle.insurance_daily : 0;
  const subtotal = perDayRates.reduce((sum, v) => sum + Number(v), 0);
  const insuranceTotal = Number(insuranceDaily) * daysCount;
    
    // Calcular extras
    let extrasTotal = 0;
    const validExtras = [];
    if (extras.length > 0) {
      // Aqui você pode definir os extras disponíveis
      const availableExtras = {
        'gps': { name: 'GPS', price: 15 },
        'child_seat': { name: 'Cadeira Infantil', price: 20 },
        'additional_driver': { name: 'Condutor Adicional', price: 25 }
      };

    extras.forEach(extraId => {
        if (availableExtras[extraId]) {
          validExtras.push({
            id: extraId,
            name: availableExtras[extraId].name,
            dailyPrice: availableExtras[extraId].price,
            totalPrice: availableExtras[extraId].price * daysCount
          });
      extrasTotal += availableExtras[extraId].price * daysCount;
        }
      });
    }

    let discountAmount = 0;

    // Validar e aplicar cupom (opcional)
    let appliedCoupon = null;
    if (coupon_code) {
      try {
        const now = new Date();
        const { Op } = require('sequelize');
        const coupon = await Coupon.findOne({
          where: {
            code: coupon_code,
            is_active: true,
            [Op.and]: [
              { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
              { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] }
            ]
          }
        });
        if (!coupon) {
          return res.status(400).json({ success: false, message: 'Cupom inválido ou expirado' });
        }
        // Restrições por dias
        if (coupon.min_days && daysCount < coupon.min_days) {
          return res.status(400).json({ success: false, message: `Cupom válido apenas para reservas a partir de ${coupon.min_days} dias` });
        }
        if (coupon.max_days && daysCount > coupon.max_days) {
          return res.status(400).json({ success: false, message: `Cupom válido apenas para reservas de até ${coupon.max_days} dias` });
        }

        // Base de cálculo do desconto: subtotal + insurance + extras
        const baseAmount = Number(subtotal) + Number(insuranceTotal) + Number(extrasTotal);
        if (coupon.discount_type === 'percent') {
          discountAmount = (Number(coupon.discount_value) / 100) * baseAmount;
        } else {
          discountAmount = Number(coupon.discount_value);
        }
        // Não permitir desconto negativo sobre total
        if (discountAmount < 0) discountAmount = 0;
        // Limitar desconto ao valor do baseAmount
        if (discountAmount > baseAmount) discountAmount = baseAmount;
        appliedCoupon = coupon;
      } catch (err) {
        console.error('Erro ao aplicar cupom:', err);
        return res.status(400).json({ success: false, message: 'Não foi possível aplicar o cupom' });
      }
    }

  const totalAmount = Number(subtotal) + Number(insuranceTotal) + Number(extrasTotal) - Number(discountAmount);

  // Calcular política de pré-autorização
  const preauth = calculatePreauth(totalAmount);

    // Criar reserva
    const reservation = await Reservation.create({
      user_id: req.user.id,
      vehicle_id,
      start_date: startDate,
      end_date: endDate,
      pickup_location,
      return_location,
      pickup_time,
      return_time,
  days_count: daysCount,
  daily_rate: dailyRate,
  insurance_daily: insuranceDaily,
  extras: validExtras,
  extras_total: extrasTotal,
  subtotal,
  insurance_total: insuranceTotal,
  coupon_code: appliedCoupon ? appliedCoupon.code : null,
  discount_amount: discountAmount,
  total_amount: totalAmount,
      // Pré-autorização (inicialmente sem hold; hold feito no check-in)
      deposit_required: preauth.required,
      deposit_amount: preauth.amount,
      preauth_status: 'none',
      preauth_expires_at: null,
      preauth_reference: null,
      status: 'pending'
    });

    // Buscar reserva com informações completas
    const fullReservation = await Reservation.findByPk(reservation.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: User,
          as: 'customer'
        }
      ]
    });

    // Buscar completo para notificação
    const createdFull = await Reservation.findByPk(reservation.id, { include: [{ model: Vehicle, as: 'vehicle' }, { model: User, as: 'customer' }] });
    notifier.emit('reservation.created', { reservation: createdFull.toJSON() });

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: { reservation: fullReservation }
    });

  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      ...(process.env.NODE_ENV !== 'production' ? { debug: error.message, stack: error.stack } : {})
    });
    try {
      fs.appendFileSync(path.join(process.cwd(), 'reservation_error.log'), `[#${Date.now()}] ${error.stack}\n`);
    } catch (e) {}
  }
});

// GET /api/reservations - Listar reservas do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };

    // Filtros
    if (req.query.status) {
      where.status = req.query.status;
    }

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/reservations/:id - Detalhes da reserva
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: User,
          as: 'customer'
        },
        {
          model: require('../models').Payment,
          as: 'payments'
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Timeline simples derivada de datas/status
    const timeline = [];
    timeline.push({ key: 'created', label: 'Criada', at: reservation.created_at });
    if (reservation.status === 'confirmed' || reservation.status === 'active' || reservation.status === 'completed') {
      timeline.push({ key: 'confirmed', label: 'Confirmada', at: reservation.updated_at });
    }
    if (reservation.status === 'active') {
      timeline.push({ key: 'checkin', label: 'Retirada', at: reservation.checkin_date || reservation.start_date });
    }
    if (reservation.status === 'completed') {
      timeline.push({ key: 'checkout', label: 'Devolução', at: reservation.checkout_date || reservation.end_date });
    }

    res.json({
      success: true,
      data: { reservation: { ...reservation.toJSON(), timeline } }
    });

  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/reservations/:id/cancel - Cancelar reserva
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se pode cancelar
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva não pode ser cancelada'
      });
    }

    // Verificar prazo de cancelamento (ex: 24h antes)
    const now = new Date();
    const startDate = new Date(reservation.start_date);
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cancelamento deve ser feito com pelo menos 24 horas de antecedência'
      });
    }

    await reservation.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso',
      data: { reservation }
    });

  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/reservations/:id/review - Avaliar reserva
router.post('/:id/review', authenticateToken, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser entre 1 e 5'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Avaliação deve ter no máximo 500 caracteres')
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

    const { rating, review } = req.body;

    const reservation = await Reservation.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se reserva foi completada
    if (reservation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Só é possível avaliar reservas completadas'
      });
    }

    // Verificar se já foi avaliada
    if (reservation.rating) {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva já foi avaliada'
      });
    }

    await reservation.update({ rating, review });

    res.json({
      success: true,
      message: 'Avaliação registrada com sucesso',
      data: { reservation }
    });

  } catch (error) {
    console.error('Erro ao avaliar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

// PATCH /api/reservations/:id/extend - Estender a data de devolução da reserva
router.patch('/:id/extend', authenticateToken, [
  body('new_end_date').isISO8601().withMessage('Nova data de fim inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Vehicle, as: 'vehicle' }]
    });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });

    if (!['confirmed', 'active', 'pending'].includes(reservation.status)) {
      return res.status(400).json({ success: false, message: 'Reserva não pode ser estendida' });
    }

    const currentEnd = new Date(reservation.end_date);
    const newEnd = new Date(req.body.new_end_date);
    if (newEnd <= currentEnd) {
      return res.status(400).json({ success: false, message: 'Nova data deve ser posterior à atual data de fim' });
    }

    // Checar conflitos no período adicional com buffer
    const turnaroundHrs = getTurnaroundHours();
    const bufferMs = turnaroundHrs * 60 * 60 * 1000;
    const startWindow = new Date(currentEnd.getTime());
    const endWithBuffer = new Date(newEnd.getTime() + bufferMs);
    const conflicts = await Reservation.findAll({
      where: {
        id: { [Op.ne]: reservation.id },
        vehicle_id: reservation.vehicle_id,
        status: { [Op.in]: ['confirmed', 'active'] },
        [Op.and]: [{
          [Op.or]: [
            { start_date: { [Op.between]: [startWindow, endWithBuffer] } },
            { end_date: { [Op.between]: [startWindow, endWithBuffer] } },
            { [Op.and]: [ { start_date: { [Op.lte]: endWithBuffer } }, { end_date: { [Op.gte]: startWindow } } ] }
          ]
        }]
      }
    });
    if (conflicts.length) {
      return res.status(400).json({ success: false, message: 'Conflito de disponibilidade para extensão solicitada' });
    }

    // Recalcular preço para os dias adicionais
    const vehicle = reservation.vehicle || await Vehicle.findByPk(reservation.vehicle_id);
    const extraDates = eachDay(currentEnd, newEnd);
    const rules = await getActivePriceRules(vehicle);
    const extraRates = extraDates.map(d => applyRulesToDailyRate(vehicle.daily_rate, d, vehicle, rules));
    const extraDays = Math.max(0, extraRates.length);
    const extraSubtotal = extraRates.reduce((a,b) => a + Number(b), 0);
    const insuranceDaily = Number(reservation.insurance_daily || 0);
    const extraInsurance = insuranceDaily * extraDays;

    // Atualizar totais
    const newDays = Number(reservation.days_count) + extraDays;
    const newSubtotal = Number(reservation.subtotal) + extraSubtotal;
    const newInsuranceTotal = Number(reservation.insurance_total) + extraInsurance;
    const newTotal = Number(reservation.total_amount) + extraSubtotal + extraInsurance;

    await reservation.update({
      end_date: newEnd,
      days_count: newDays,
      subtotal: Number(newSubtotal.toFixed(2)),
      insurance_total: Number(newInsuranceTotal.toFixed(2)),
      total_amount: Number(newTotal.toFixed(2))
    });

  const fullReservation = await Reservation.findByPk(reservation.id, {
      include: [{ model: Vehicle, as: 'vehicle' }, { model: User, as: 'customer' }]
    });
  notifier.emit('reservation.extended', { reservation: fullReservation.toJSON() });
    res.json({ success: true, message: 'Reserva estendida com sucesso', data: { reservation: fullReservation } });
  } catch (error) {
    console.error('Erro ao estender reserva:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});
