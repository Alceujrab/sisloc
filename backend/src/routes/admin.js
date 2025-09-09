const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { User, Vehicle, Reservation, Payment, Banner, ContactInfo, Location, Coupon, UserDocument, CarGroup, BusinessLead, RefundRequest, RefundAuditLog, PriceRule } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');

const router = express.Router();
const groupMinCache = require('../utils/groupMinCache');

// Middleware para rotas administrativas
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'employee'));

// Upload de avatar (clientes)
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

// Upload de imagem de grupo de carros
const groupsDir = path.join(process.cwd(), 'uploads', 'groups');
if (!fs.existsSync(groupsDir)) fs.mkdirSync(groupsDir, { recursive: true });
const groupImageStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, groupsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const groupImageUpload = multer({
  storage: groupImageStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp')
      .split(',').map(s => s.trim());
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de arquivo não suportado'));
  }
});

// GET /api/admin/dashboard - Estatísticas do dashboard
// Suporta filtros opcionais via query:
// startDate, endDate (ISO) e branch (filial). Também retorna datasets para gráficos.
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filtros
    const hasCustomRange = !!(req.query.startDate || req.query.endDate);
    const start = req.query.startDate ? new Date(req.query.startDate) : startOfMonth;
    const end = req.query.endDate ? new Date(req.query.endDate) : now;
    const branch = req.query.branch || null; // pickup_location

    // Período anterior para cálculo de crescimento
    const msInDay = 24 * 60 * 60 * 1000;
    const durationMs = Math.max(1, Math.ceil((end - start) / msInDay)) * msInDay; // pelo menos 1 dia
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime() - 1);

    // Estatísticas gerais
    const [
      totalVehicles,
      availableVehicles,
      totalCustomers,
      totalReservations,
      monthlyReservations,
      lastMonthReservations,
      monthlyRevenue,
      lastMonthRevenue,
      activeReservations,
      pendingPayments
    ] = await Promise.all([
      Vehicle.count(),
      Vehicle.count({ where: { status: 'available' } }),
      User.count({ where: { role: 'customer' } }),
      Reservation.count(),
      // Contagem no período atual
      Reservation.count({ 
        where: { 
          created_at: { [Op.between]: [start, end] },
          ...(branch ? { pickup_location: branch } : {})
        } 
      }),
      // Contagem no período anterior
      Reservation.count({ 
        where: { 
          created_at: { [Op.between]: [prevStart, prevEnd] },
          ...(branch ? { pickup_location: branch } : {})
        } 
      }),
      // Receita no período atual
      Payment.sum('amount', { 
        where: { 
          status: 'succeeded',
          payment_date: { [Op.between]: [start, end] } 
        },
        include: branch ? [{ model: Reservation, as: 'reservation', where: { pickup_location: branch }, attributes: [] }] : []
      }),
      // Receita no período anterior
      Payment.sum('amount', { 
        where: { 
          status: 'succeeded',
          payment_date: { [Op.between]: [prevStart, prevEnd] } 
        },
        include: branch ? [{ model: Reservation, as: 'reservation', where: { pickup_location: branch }, attributes: [] }] : []
      }),
      Reservation.count({ where: { status: 'active' } }),
      Payment.count({ where: { status: 'pending' } })
    ]);

    // Cálculos de crescimento
    const reservationGrowth = lastMonthReservations > 0 
      ? ((monthlyReservations - lastMonthReservations) / lastMonthReservations * 100).toFixed(1)
      : 0;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Reservas recentes
    const recentReservations = await Reservation.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email'] },
        { model: Vehicle, as: 'vehicle', attributes: ['brand', 'model', 'license_plate'] }
      ]
    });

    // Veículos mais populares
    const popularVehicles = await Reservation.findAll({
      attributes: [
        'vehicle_id',
        [require('sequelize').fn('COUNT', 'id'), 'reservation_count']
      ],
      where: {
        created_at: { [Op.between]: [start, end] },
        status: { [Op.in]: ['confirmed', 'active', 'completed'] },
        ...(branch ? { pickup_location: branch } : {})
      },
      group: ['vehicle_id'],
      order: [[require('sequelize').fn('COUNT', 'id'), 'DESC']],
      limit: 5,
      include: [{
        model: Vehicle,
        as: 'vehicle',
        attributes: ['brand', 'model', 'category', 'daily_rate']
      }]
    });

    // Datasets para gráficos
    const { fn, col } = require('sequelize');

    // Reservas por dia (com base em created_at)
    const reservationsDailyRaw = await Reservation.findAll({
      attributes: [
        [fn('date', col('created_at')), 'day'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: { [Op.between]: [start, end] },
        ...(branch ? { pickup_location: branch } : {})
      },
      group: [fn('date', col('created_at'))],
      order: [[fn('date', col('created_at')), 'ASC']],
      raw: true
    });

    const reservationsDaily = reservationsDailyRaw.map(r => ({
      date: r.day,
      count: Number(r.count)
    }));

    // Faturamento por grupo de carros
    const revenueByGroupRaw = await Payment.findAll({
      attributes: [
        [col('reservation->vehicle->group.name'), 'group_name'],
        [col('reservation->vehicle->group.code'), 'group_code'],
        [fn('SUM', col('amount')), 'amount']
      ],
      where: {
        status: 'succeeded',
        payment_date: { [Op.between]: [start, end] }
      },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          required: true,
          where: branch ? { pickup_location: branch } : undefined,
          include: [{
            model: Vehicle,
            as: 'vehicle',
            required: true,
            include: [{ model: CarGroup, as: 'group', required: false }]
          }]
        }
      ],
      group: [col('reservation->vehicle->group.id'), col('reservation->vehicle->group.name'), col('reservation->vehicle->group.code')],
      order: [[fn('SUM', col('amount')), 'DESC']],
      raw: true
    });

    const revenueByGroup = revenueByGroupRaw
      .filter(r => r.group_name) // descarta pagamentos sem grupo associado
      .map(r => ({
        group_name: r.group_name,
        group_code: r.group_code,
        amount: Number(r.amount)
      }));

    res.json({
      success: true,
      data: {
        stats: {
          totalVehicles,
          availableVehicles,
          totalCustomers,
          totalReservations,
          monthlyReservations,
          monthlyRevenue: monthlyRevenue || 0,
          activeReservations,
          pendingPayments,
          reservationGrowth: parseFloat(reservationGrowth),
          revenueGrowth: parseFloat(revenueGrowth)
        },
        recentReservations,
        popularVehicles,
        filters: {
          startDate: start,
          endDate: end,
          branch: branch || null,
          hasCustomRange
        },
        charts: {
          reservationsDaily,
          revenueByGroup
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/vehicles - Listar todos os veículos (admin)
router.get('/vehicles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    // Filtros
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.search) {
      where[Op.or] = [
        { brand: { [Op.like]: `%${req.query.search}%` } },
        { model: { [Op.like]: `%${req.query.search}%` } },
        { license_plate: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// --- Locations (filiais) ---
// GET /api/admin/locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await Location.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('Erro ao listar locations:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/locations
router.post('/locations', [
  body('name').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: { location } });
  } catch (error) {
    console.error('Erro ao criar location:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/locations/:id
router.put('/locations/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Local não encontrado' });
    await location.update(req.body);
    res.json({ success: true, data: { location } });
  } catch (error) {
    console.error('Erro ao atualizar location:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/locations/:id
router.delete('/locations/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Local não encontrado' });
    await location.destroy();
    res.json({ success: true, message: 'Local removido' });
  } catch (error) {
    console.error('Erro ao remover location:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Price Rules (Regras de Preço) ---
// GET /api/admin/price-rules
router.get('/price-rules', async (req, res) => {
  try {
    const where = {};
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
    if (req.query.group_id) where.group_id = req.query.group_id;
    if (req.query.location) where.location = req.query.location;
    const rules = await PriceRule.findAll({
      where,
      order: [ ['priority', 'DESC'], ['id', 'DESC'] ]
    });
    res.json({ success: true, data: { rules } });
  } catch (error) {
    console.error('Erro ao listar price rules:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/price-rules
router.post('/price-rules', [
  body('name').trim().notEmpty(),
  body('adjustment_type').isIn(['percent','amount']),
  body('adjustment_value').isNumeric(),
  body('priority').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const payload = { ...req.body };
    if (Array.isArray(payload.days_of_week)) {
      payload.days_of_week = JSON.stringify(payload.days_of_week.map(Number));
    }
    if (payload.start_date) payload.start_date = new Date(payload.start_date);
    if (payload.end_date) payload.end_date = new Date(payload.end_date);
    const rule = await PriceRule.create(payload);
    res.status(201).json({ success: true, data: { rule } });
  } catch (error) {
    console.error('Erro ao criar price rule:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/price-rules/:id
router.put('/price-rules/:id', async (req, res) => {
  try {
    const rule = await PriceRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Regra não encontrada' });
    const payload = { ...req.body };
    if (Array.isArray(payload.days_of_week)) {
      payload.days_of_week = JSON.stringify(payload.days_of_week.map(Number));
    }
    if (payload.start_date) payload.start_date = new Date(payload.start_date);
    if (payload.end_date) payload.end_date = new Date(payload.end_date);
    await rule.update(payload);
    res.json({ success: true, data: { rule } });
  } catch (error) {
    console.error('Erro ao atualizar price rule:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/price-rules/:id
router.delete('/price-rules/:id', async (req, res) => {
  try {
    const rule = await PriceRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Regra não encontrada' });
    await rule.destroy();
    res.json({ success: true, message: 'Regra removida' });
  } catch (error) {
    console.error('Erro ao remover price rule:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Utilization Report ---
// GET /api/admin/reports/utilization?start=YYYY-MM-DD&end=YYYY-MM-DD&group_id=&location=
router.get('/reports/utilization', async (req, res) => {
  try {
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;
    if (!start || !end || start >= end) {
      return res.status(400).json({ success: false, message: 'Período inválido' });
    }
    const whereRes = {
      status: { [Op.in]: ['confirmed','active','completed'] },
      [Op.or]: [
        { start_date: { [Op.between]: [start, end] } },
        { end_date: { [Op.between]: [start, end] } },
        { [Op.and]: [ { start_date: { [Op.lte]: start } }, { end_date: { [Op.gte]: end } } ] }
      ]
    };
    const include = [{ model: Vehicle, as: 'vehicle', attributes: ['id','group_id','location'] }];
    if (req.query.group_id) {
      include[0].where = { ...(include[0].where||{}), group_id: Number(req.query.group_id) };
    }
    if (req.query.location) {
      include[0].where = { ...(include[0].where||{}), location: req.query.location };
    }
    const reservations = await Reservation.findAll({ where: whereRes, include, order: [['start_date','ASC']] });

    // janela total em dias
    const msTotal = end - start;
    const daysTotal = Math.max(1, Math.ceil(msTotal / (1000*60*60*24)));

    // Agrupar por vehicle_id
    const byVehicle = new Map();
    for (const r of reservations) {
      const vid = r.vehicle_id;
      if (!byVehicle.has(vid)) byVehicle.set(vid, []);
      byVehicle.get(vid).push(r);
    }

    // Calcular dias ocupados dentro da janela para cada veículo
    const vehicleStats = [];
    for (const [vid, list] of byVehicle.entries()) {
      let occupiedDays = 0;
      for (const r of list) {
        const s = new Date(Math.max(new Date(r.start_date), start));
        const e = new Date(Math.min(new Date(r.end_date), end));
        const d = Math.max(0, Math.ceil((e - s) / (1000*60*60*24)));
        occupiedDays += d;
      }
      vehicleStats.push({ vehicle_id: vid, occupiedDays });
    }

    const totalVehicles = await Vehicle.count({ where: include[0].where || {} });
    const fleetDays = totalVehicles * daysTotal;
    const sumOccupied = vehicleStats.reduce((a,b)=>a + b.occupiedDays, 0);
    const utilization = fleetDays > 0 ? Number(((sumOccupied / fleetDays) * 100).toFixed(2)) : 0;

    // Por grupo
    const groupAgg = {};
    for (const r of reservations) {
      const gid = r.vehicle?.group_id || 'sem_grupo';
      const key = String(gid);
      if (!groupAgg[key]) groupAgg[key] = { group_id: gid, vehicles: new Set(), occupiedDays: 0 };
      groupAgg[key].vehicles.add(r.vehicle_id);
      const s = new Date(Math.max(new Date(r.start_date), start));
      const e = new Date(Math.min(new Date(r.end_date), end));
      const d = Math.max(0, Math.ceil((e - s) / (1000*60*60*24)));
      groupAgg[key].occupiedDays += d;
    }
    const groups = [];
    for (const key of Object.keys(groupAgg)) {
      const g = groupAgg[key];
      const countVehicles = g.vehicles.size;
      const gFleetDays = countVehicles * daysTotal;
      const gUtil = gFleetDays > 0 ? Number(((g.occupiedDays / gFleetDays) * 100).toFixed(2)) : 0;
      groups.push({ group_id: g.group_id, vehicles: countVehicles, utilization: gUtil });
    }

    // Série diária de utilização (média por dia)
    const series = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1);
      const dayWhere = {
        status: { [Op.in]: ['confirmed','active','completed'] },
        [Op.or]: [
          { start_date: { [Op.between]: [dayStart, dayEnd] } },
          { end_date: { [Op.between]: [dayStart, dayEnd] } },
          { [Op.and]: [ { start_date: { [Op.lte]: dayStart } }, { end_date: { [Op.gte]: dayEnd } } ] }
        ]
      };
      const dayReservations = await Reservation.findAll({ where: dayWhere, include, raw: true });
      const usedVehicles = new Set(dayReservations.map(r => r.vehicle_id));
      const used = usedVehicles.size;
      const totalV = totalVehicles || await Vehicle.count({ where: include[0].where || {} });
      const util = totalV > 0 ? Number(((used / totalV) * 100).toFixed(2)) : 0;
      series.push({ date: new Date(dayStart), utilization: util });
    }

    res.json({ success: true, data: { summary: { start, end, totalVehicles, daysTotal, utilization }, groups, series } });
  } catch (error) {
    console.error('Erro ao gerar relatório de utilização:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Coupons ---
// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: { coupons } });
  } catch (error) {
    console.error('Erro ao listar coupons:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', [
  body('code').trim().notEmpty(),
  body('discount_type').isIn(['percent', 'amount']),
  body('discount_value').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const exists = await Coupon.findOne({ where: { code: req.body.code } });
    if (exists) return res.status(400).json({ success: false, message: 'Código já existe' });
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: { coupon } });
  } catch (error) {
    console.error('Erro ao criar coupon:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom não encontrado' });
    if (req.body.code && req.body.code !== coupon.code) {
      const exists = await Coupon.findOne({ where: { code: req.body.code } });
      if (exists) return res.status(400).json({ success: false, message: 'Código já existe' });
    }
    await coupon.update(req.body);
    res.json({ success: true, data: { coupon } });
  } catch (error) {
    console.error('Erro ao atualizar coupon:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom não encontrado' });
    await coupon.destroy();
    res.json({ success: true, message: 'Cupom removido' });
  } catch (error) {
    console.error('Erro ao remover coupon:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Car Groups ---
// GET /api/admin/groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await CarGroup.findAll({ order: [['name','ASC']] });
    res.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/groups
router.post('/groups', [
  body('code').trim().notEmpty(),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const exists = await CarGroup.findOne({ where: { code: req.body.code } });
    if (exists) return res.status(400).json({ success: false, message: 'Código já existe' });
  const group = await CarGroup.create(req.body);
  // Invalidar cache de mínimos, pois grupos podem aparecer/vincular veículos
  groupMinCache.clear();
    res.status(201).json({ success: true, data: { group } });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/groups/:id
router.put('/groups/:id', async (req, res) => {
  try {
    const group = await CarGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
    if (req.body.code && req.body.code !== group.code) {
      const exists = await CarGroup.findOne({ where: { code: req.body.code } });
      if (exists) return res.status(400).json({ success: false, message: 'Código já existe' });
    }
  await group.update(req.body);
  groupMinCache.clear();
    res.json({ success: true, data: { group } });
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/groups/:id
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await CarGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
  await group.destroy();
  groupMinCache.clear();
    res.json({ success: true, message: 'Grupo removido' });
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/groups/:id/image - Upload/atualiza imagem do grupo
router.post('/groups/:id/image', groupImageUpload.single('image'), async (req, res) => {
  try {
    const group = await CarGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Arquivo de imagem é obrigatório' });
  // Monta URL absoluta para funcionar no frontend em outra porta/host
  const absoluteBase = `${req.protocol}://${req.get('host')}`;
  const url = `${absoluteBase}/uploads/groups/${req.file.filename}`;
    await group.update({ image_url: url });
    res.json({ success: true, message: 'Imagem atualizada', data: { group } });
  } catch (error) {
    console.error('Erro ao enviar imagem do grupo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/customers/:id/avatar - Enviar/atualizar foto do cliente
router.post('/customers/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Arquivo de imagem é obrigatório' });
    }
    const url = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatar: url });
    res.json({ success: true, message: 'Avatar atualizado', data: { user } });
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Documentos de clientes ---
// GET /api/admin/documents?user_id=
router.get('/documents', async (req, res) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.status) where.status = req.query.status;
    const docs = await UserDocument.findAll({ where, order: [['created_at','DESC']], include: [{ model: User, as: 'user', attributes: ['id','name','email'] }] });
    res.json({ success: true, data: { documents: docs } });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/documents/:id/status
router.put('/documents/:id/status', [
  body('status').isIn(['pending','approved','rejected'])
], async (req, res) => {
  try {
    const doc = await UserDocument.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Documento não encontrado' });
    await doc.update({ status: req.body.status, notes: req.body.notes || null });
    res.json({ success: true, data: { document: doc } });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/admin/vehicles - Criar novo veículo
router.post('/vehicles', [
  body('brand').trim().notEmpty().withMessage('Marca é obrigatória'),
  body('model').trim().notEmpty().withMessage('Modelo é obrigatório'),
  body('year').isInt({ min: 1990 }).withMessage('Ano inválido'),
  body('color').trim().notEmpty().withMessage('Cor é obrigatória'),
  body('license_plate').trim().notEmpty().withMessage('Placa é obrigatória'),
  body('category').isIn(['compact', 'sedan', 'suv', 'luxury', 'van', 'truck']).withMessage('Categoria inválida'),
  body('daily_rate').isFloat({ min: 0 }).withMessage('Diária deve ser um valor positivo')
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

    // Verificar se placa já existe
    const existingVehicle = await Vehicle.findOne({
      where: { license_plate: req.body.license_plate }
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Placa já está em uso'
      });
    }

  const vehicle = await Vehicle.create(req.body);
  // Veículos novos podem alterar mínimos por grupo
  groupMinCache.clear();

    res.status(201).json({
      success: true,
      message: 'Veículo criado com sucesso',
      data: { vehicle }
    });

  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/vehicles/:id - Atualizar veículo
router.put('/vehicles/:id', [
  body('brand').optional().trim().notEmpty().withMessage('Marca inválida'),
  body('model').optional().trim().notEmpty().withMessage('Modelo inválido'),
  body('year').optional().isInt({ min: 1990 }).withMessage('Ano inválido'),
  body('daily_rate').optional().isFloat({ min: 0 }).withMessage('Diária deve ser um valor positivo')
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

    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Verificar se placa já existe (se foi alterada)
    if (req.body.license_plate && req.body.license_plate !== vehicle.license_plate) {
      const existingVehicle = await Vehicle.findOne({
        where: { 
          license_plate: req.body.license_plate,
          id: { [Op.not]: req.params.id }
        }
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Placa já está em uso'
        });
      }
    }

    const before = { group_id: vehicle.group_id, status: vehicle.status, rate: vehicle.daily_rate };
    await vehicle.update(req.body);
    const after = { group_id: vehicle.group_id, status: vehicle.status, rate: vehicle.daily_rate };
    if (before.group_id !== after.group_id || before.status !== after.status || before.rate !== after.rate) {
      groupMinCache.clear();
    }

    res.json({
      success: true,
      message: 'Veículo atualizado com sucesso',
      data: { vehicle }
    });

  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/vehicles/:id - Excluir veículo
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Verificar se há reservas ativas
    const activeReservations = await Reservation.count({
      where: {
        vehicle_id: req.params.id,
        status: { [Op.in]: ['confirmed', 'active'] }
      }
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir veículo com reservas ativas'
      });
    }

  const groupId = vehicle.group_id;
  await vehicle.destroy();
  if (groupId) groupMinCache.clear();

    res.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/reservations - Listar todas as reservas
router.get('/reservations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    // Filtros
    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.payment_status) {
      where.payment_status = req.query.payment_status;
    }

    if (req.query.date_from && req.query.date_to) {
      where.start_date = {
        [Op.between]: [new Date(req.query.date_from), new Date(req.query.date_to)]
      };
    }

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'license_plate', 'category']
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

// PUT /api/admin/reservations/:id/status - Atualizar status da reserva
router.put('/reservations/:id/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled'])
    .withMessage('Status inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido',
        errors: errors.array()
      });
    }

    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer' },
        { model: Vehicle, as: 'vehicle' }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

  const { status } = req.body;
  const oldStatus = reservation.status;
  const prevStatus = reservation.status;
  await reservation.update({ status });

    // Lógica adicional baseada no status
    if (status === 'active' && oldStatus === 'confirmed') {
      const checkinAt = new Date();
      const updates = { checkin_date: checkinAt };
      if (reservation.deposit_required && Number(reservation.deposit_amount) > 0) {
        const holdDays = Number(process.env.PREAUTH_HOLD_DAYS || '7');
        const expires = new Date(checkinAt.getTime() + holdDays * 24 * 60 * 60 * 1000);
        updates.preauth_status = 'held';
        updates.preauth_expires_at = expires;
        updates.preauth_reference = `HOLD-${reservation.id}-${Date.now()}`;
      }
      await reservation.update(updates);
      // Email e WhatsApp de check-in / hold
      try {
        if (reservation.customer?.email) {
          const to = reservation.customer.email;
          const subject = `Check-in realizado - Reserva #${reservation.reservation_code}`;
          const html = `<p>Olá ${reservation.customer?.name || ''},</p>
                        <p>Seu check-in foi realizado em ${checkinAt.toLocaleString('pt-BR')}.</p>
                        ${reservation.preauth_status === 'held' ? `<p>Uma pré-autorização no valor de <strong>R$ ${Number(reservation.deposit_amount).toFixed(2)}</strong> foi efetuada. Validade até ${new Date(reservation.preauth_expires_at).toLocaleDateString('pt-BR')}.</p>` : ''}`;
          await sendEmail({ to, subject, html, text: 'Check-in realizado.' });
        }
        if (reservation.customer?.phone) {
          const msg = `Check-in realizado! Reserva #${reservation.reservation_code}. ${reservation.deposit_required ? `Pré-autorização de R$ ${Number(reservation.deposit_amount).toFixed(2)} efetuada.` : ''}`.trim();
          try { await sendWhatsApp({ to: reservation.customer.phone, body: msg }); } catch (e) { console.warn('WhatsApp check-in warn:', e.message); }
        }
      } catch (e) { console.warn('Falha ao enviar e-mail de check-in:', e.message); }
    }

    if (status === 'completed' && oldStatus === 'active') {
      await reservation.update({ checkout_date: new Date() });
      // Marcar veículo como disponível
      await reservation.vehicle.update({ status: 'available' });
      // Disponibilização pode afetar mínimos
      groupMinCache.clear();
    }

    // Se a confirmação/ativação reservou veículo, também pode afetar mínimos (menos disponíveis)
    if ((prevStatus !== 'confirmed' && status === 'confirmed') || status === 'active') {
      groupMinCache.clear();
    }

    res.json({
      success: true,
      message: 'Status da reserva atualizado com sucesso',
      data: { reservation }
    });

  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/reservations/:id/checkout - concluir reserva e capturar/liberar pré-autorização
router.post('/reservations/:id/checkout', [
  body('action').optional().isIn(['capture','release']).withMessage('Ação inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const reservation = await Reservation.findByPk(req.params.id, { include: [{ model: User, as: 'customer' }, { model: Vehicle, as: 'vehicle' }] });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    if (!['active','confirmed'].includes(reservation.status)) return res.status(400).json({ success: false, message: 'Reserva não está ativa' });

    const now = new Date();
    const action = req.body.action || 'capture';
    const updates = { checkout_date: now, status: 'completed' };
    if (reservation.deposit_required && reservation.preauth_status === 'held') {
      if (action === 'capture') {
        updates.preauth_status = 'captured';
        updates.preauth_reference = reservation.preauth_reference || `CAP-${reservation.id}-${Date.now()}`;
      } else {
        updates.preauth_status = 'released';
      }
    }
    await reservation.update(updates);
    // Disponibilizar veículo e limpar mínimos
    if (reservation.vehicle) {
      await reservation.vehicle.update({ status: 'available' });
      groupMinCache.clear();
    }
    // Email e WhatsApp de checkout / captura ou liberação
    try {
      if (reservation.customer?.email) {
        const to = reservation.customer.email;
        const subject = `Checkout concluído - Reserva #${reservation.reservation_code}`;
        const actionLabel = (reservation.preauth_status === 'captured') ? 'capturada' : (reservation.preauth_status === 'released' ? 'liberada' : 'processada');
        const html = `<p>Olá ${reservation.customer?.name || ''},</p>
                      <p>Seu checkout foi concluído em ${now.toLocaleString('pt-BR')}.</p>
                      ${reservation.deposit_required ? `<p>Pré-autorização ${actionLabel}.</p>` : ''}`;
        await sendEmail({ to, subject, html, text: 'Checkout concluído.' });
      }
      if (reservation.customer?.phone) {
        const actionShort = (reservation.preauth_status === 'captured') ? 'capturada' : (reservation.preauth_status === 'released' ? 'liberada' : 'processada');
        const msg = `Checkout concluído! Reserva #${reservation.reservation_code}. ${reservation.deposit_required ? `Pré-autorização ${actionShort}.` : ''}`.trim();
        try { await sendWhatsApp({ to: reservation.customer.phone, body: msg }); } catch (e) { console.warn('WhatsApp checkout warn:', e.message); }
      }
    } catch (e) { console.warn('Falha ao enviar e-mail de checkout:', e.message); }

    res.json({ success: true, message: 'Checkout concluído', data: { reservation } });
  } catch (error) {
    console.error('Erro no checkout:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/admin/customers - Listar clientes
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { role: 'customer' };

    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    const { count, rows: customers } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{
        model: Reservation,
        as: 'reservations',
        attributes: ['id', 'status', 'total_amount'],
        separate: true,
        limit: 5,
        order: [['created_at', 'DESC']]
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/customers/:id - Detalhe do cliente
router.get('/customers/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user || user.role !== 'customer') return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    res.json({ success: true, data: { customer: user } });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/customers/:id - Atualizar dados do cliente
router.put('/customers/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== 'customer') return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    const updatable = ['name','email','phone','cpf','birth_date','cnh_number','cnh_expiry','address','city','state','zip_code','status'];
    const payload = {};
    updatable.forEach(k => { if (k in req.body) payload[k] = req.body[k]; });
    await user.update(payload);
    res.json({ success: true, data: { customer: user } });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/customers/:id/avatar - Remover foto do cliente
router.delete('/customers/:id/avatar', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== 'customer') return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    await user.update({ avatar: null });
    res.json({ success: true, message: 'Avatar removido', data: { customer: user } });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;
// Rotas adicionais de admin abaixo

// --- Business Leads (corporativo) ---
// GET /api/admin/leads
router.get('/leads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } },
        { company: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows } = await BusinessLead.findAndCountAll({
      where,
      order: [['created_at','DESC']],
      limit,
      offset
    });

    res.json({ success: true, data: { leads: rows, pagination: { currentPage: page, totalPages: Math.ceil(count/limit), totalItems: count, itemsPerPage: limit } } });
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/leads/:id/status
router.patch('/leads/:id/status', [
  body('status').isIn(['new','in_progress','closed']).withMessage('Status inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const lead = await BusinessLead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead não encontrado' });
    await lead.update({ status: req.body.status });
    res.json({ success: true, message: 'Status do lead atualizado', data: { lead } });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// --- Refund Requests (reembolsos) ---
// GET /api/admin/refunds - listar solicitações de reembolso
router.get('/refunds', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.user_id) where.user_id = req.query.user_id;

    const { count, rows } = await RefundRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id','name','email'] },
        { model: Reservation, as: 'reservation', attributes: ['id','reservation_code','start_date','end_date','status'] },
        { model: Payment, as: 'payment', attributes: ['id','amount','status','payment_method','payment_channel'] }
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

// GET /api/admin/refunds/:id - detalhe
router.get('/refunds/:id', async (req, res) => {
  try {
    const rr = await RefundRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id','name','email'] },
        { model: Reservation, as: 'reservation' },
        { model: Payment, as: 'payment' },
        { model: RefundAuditLog, as: 'auditLogs', include: [{ model: User, as: 'actor', attributes: ['id','name','email'] }], separate: true, order: [['createdAt','DESC']] }
      ]
    });
    if (!rr) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    res.json({ success: true, data: { refund: rr } });
  } catch (error) {
    console.error('Erro ao buscar reembolso:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/refunds/:id/status - aprovar/rejeitar/processar
router.patch('/refunds/:id/status', [
  body('status').isIn(['approved','rejected','processed']).withMessage('Status inválido'),
  body('reply_message').optional().isString(),
  body('refund_amount').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }

    const rr = await RefundRequest.findByPk(req.params.id, { include: [{ model: Payment, as: 'payment' }] });
    if (!rr) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    if (rr.status === 'processed') return res.status(400).json({ success: false, message: 'Já processada' });

    const { status, reply_message, refund_amount } = req.body;

    // Transições válidas: pending -> approved|rejected; approved -> processed
    const current = rr.status;
    if (current === 'pending' && !['approved','rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Transição inválida a partir de pending' });
    }
    if (current === 'approved' && status !== 'processed') {
      return res.status(400).json({ success: false, message: 'Aprovado só pode ir para processed' });
    }
    if (current === 'rejected') {
      return res.status(400).json({ success: false, message: 'Solicitação rejeitada não pode ser alterada' });
    }

    // Atualiza RefundRequest
    await rr.update({ status, reply_message: reply_message || rr.reply_message });

    // Se processado, refletir no pagamento se existir
    if (status === 'processed' && rr.payment_id) {
      const amt = Number(refund_amount != null ? refund_amount : (rr.payment?.amount || 0));
      try {
        // Se pagamento foi via Stripe e está succeeded, criar refund no Stripe
        if (rr.payment.payment_gateway === 'stripe' && rr.payment.status === 'succeeded' && rr.payment.gateway_transaction_id) {
          try {
            await stripe.refunds.create({
              charge: rr.payment.gateway_transaction_id,
              amount: Math.round(amt * 100)
            });
          } catch (e) {
            console.warn('Falha ao criar refund no Stripe:', e.message);
          }
        }
        await rr.payment.update({ status: 'refunded', refund_amount: amt, refund_date: new Date() });

        // Reverter pontos de fidelidade ganhos com este pagamento (uma única vez)
        try {
          const { LoyaltyAdjustment } = require('../models');
          const earns = await LoyaltyAdjustment.findAll({ where: { payment_id: rr.payment.id, type: 'earn' } });
          const totalEarned = earns.reduce((acc, a) => acc + Number(a.points || 0), 0);
          if (totalEarned > 0) {
            await LoyaltyAdjustment.create({
              user_id: rr.payment.user_id,
              type: 'manual',
              points: -totalEarned,
              description: `Estorno de pontos por reembolso do pagamento ${rr.payment.id}`,
              reservation_id: rr.payment.reservation_id,
              payment_id: rr.payment.id
            });
          }
        } catch (e) { console.warn('Falha ao reverter pontos de fidelidade:', e.message); }
      } catch (e) {
        console.warn('Falha ao processar reembolso:', e.message);
      }
    }

    // Auditoria
    try {
      await RefundAuditLog.create({ refund_request_id: rr.id, actor_user_id: req.user.id, action: status, message: reply_message || null });
    } catch (_) {}

    const updated = await RefundRequest.findByPk(rr.id, {
      include: [
        { model: User, as: 'user', attributes: ['id','name','email'] },
        { model: Reservation, as: 'reservation' },
        { model: Payment, as: 'payment' }
      ]
    });

    res.json({ success: true, message: 'Status de reembolso atualizado', data: { refund: updated } });
  } catch (error) {
    console.error('Erro ao atualizar reembolso:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Pagamentos (admin) - listar e atualizar status, anexar recibo manualmente
router.get('/payments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.method) where.payment_method = req.query.method;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id','name','email'] },
        { model: Reservation, as: 'reservation' }
      ],
      order: [['created_at','DESC']],
      limit, offset
    });

    res.json({ success: true, data: { payments: rows, pagination: { currentPage: page, totalPages: Math.ceil(count/limit), totalItems: count, itemsPerPage: limit } } });
  } catch (e) {
    console.error('Erro ao listar pagamentos:', e);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.put('/payments/:id/status', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    const allowed = ['pending','processing','succeeded','failed','cancelled','refunded'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Status inválido' });
    await payment.update({ status: req.body.status, payment_channel: payment.payment_channel || 'manual', payment_date: req.body.status === 'succeeded' ? new Date() : payment.payment_date });
    res.json({ success: true, message: 'Status atualizado', data: { payment } });
  } catch (e) {
    console.error('Erro ao atualizar pagamento:', e);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Banners CRUD
router.get('/banners', async (req, res) => {
  const banners = await Banner.findAll({ order: [['position','ASC']] });
  res.json({ success: true, data: { banners } });
});

router.post('/banners', [
  body('title').notEmpty(),
  body('image_url').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, data: { banner } });
});

router.put('/banners/:id', async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado' });
  await banner.update(req.body);
  res.json({ success: true, data: { banner } });
});

router.delete('/banners/:id', async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado' });
  await banner.destroy();
  res.json({ success: true, message: 'Banner excluído' });
});

// Contact Info (single record) CRUD simples
router.get('/contact', async (req, res) => {
  const item = await ContactInfo.findOne({ order: [['id','ASC']] });
  res.json({ success: true, data: { contact: item } });
});

router.post('/contact', async (req, res) => {
  // se existir, atualiza; senão cria
  const existing = await ContactInfo.findOne({ order: [['id','ASC']] });
  if (existing) {
    await existing.update(req.body);
    return res.json({ success: true, data: { contact: existing } });
  }
  const created = await ContactInfo.create(req.body);
  res.status(201).json({ success: true, data: { contact: created } });
});

