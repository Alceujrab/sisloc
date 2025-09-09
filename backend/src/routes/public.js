const express = require('express');
const { Banner, ContactInfo, Location, Coupon, CarGroup, BusinessLead, Vehicle } = require('../models');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Cache simples em memória para mínimos por grupo (compartilhado)
const groupMinCache = require('../utils/groupMinCache');
const GROUP_MIN_TTL_MS = Number(process.env.GROUP_MIN_TTL_MS || 60000);

// GET /api/public/banners - Listar banners ativos (público)
router.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { is_active: true },
      order: [['position', 'ASC']]
    });

    res.json({ success: true, data: { banners } });
  } catch (error) {
    console.error('Erro ao buscar banners públicos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/public/contact - Obter informações de contato (público)
router.get('/contact', async (req, res) => {
  try {
    const contact = await ContactInfo.findOne({ order: [['id', 'ASC']] });
    res.json({ success: true, data: { contact } });
  } catch (error) {
    console.error('Erro ao buscar contato público:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/public/locations - Listar locais/filiais ativos
router.get('/locations', async (req, res) => {
  try {
    const locations = await Location.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('Erro ao buscar locations:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/public/offers - Listar ofertas/cupons públicos ativos
router.get('/offers', async (req, res) => {
  try {
    const now = new Date();
    const { Op } = require('sequelize');
    const coupons = await Coupon.findAll({
      where: {
        is_public: true,
        is_active: true,
        [Op.and]: [
          { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
          { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] }
        ]
      },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: { coupons } });
  } catch (error) {
    console.error('Erro ao buscar ofertas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/public/groups - Listar grupos de carros ativos
router.get('/groups', async (req, res) => {
  try {
    const groups = await CarGroup.findAll({ where: { is_active: true }, order: [['name','ASC']] });
    res.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/public/validate-coupon - Validar cupom por código
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: 'Código é obrigatório' });
    const now = new Date();
    const { Op } = require('sequelize');
    const coupon = await Coupon.findOne({
      where: {
        code,
        is_active: true,
        [Op.and]: [
          { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
          { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] }
        ]
      }
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom inválido' });
    return res.json({ success: true, data: { coupon } });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// POST /api/public/business-lead - Capturar lead corporativo
router.post('/business-lead', [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
    }
    const { company, name, email, phone, message } = req.body || {};
    const lead = await BusinessLead.create({ company, name, email, phone, message });
    return res.json({ success: true, data: { lead } });
  } catch (error) {
    console.error('Erro ao criar lead corporativo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET /api/public/group-minimums - Menor preço por grupo (para precificação dinâmica)
router.get('/group-minimums', async (req, res) => {
  try {
    // Cache hit
    const now = Date.now();
    const cached = groupMinCache.get();
    if (cached.data && now - cached.at < GROUP_MIN_TTL_MS) {
      return res.json({ success: true, data: { minimums: cached.data } });
    }
    // Busca menor daily_rate por group_id
    const rows = await Vehicle.findAll({
      where: { status: 'available' },
      attributes: [
        'group_id',
        [require('sequelize').fn('MIN', require('sequelize').col('daily_rate')), 'min_rate']
      ],
      group: ['group_id'],
      raw: true
    });
    // Enriquecer com informações do grupo (code, name)
    const groupIds = rows
      .map(r => r.group_id)
      .filter(id => id !== null && id !== undefined);
    let groupsById = {};
    if (groupIds.length > 0) {
      const groups = await CarGroup.findAll({
        where: { id: groupIds },
        attributes: ['id', 'code', 'name'],
        raw: true
      });
      groupsById = groups.reduce((acc, g) => { acc[g.id] = g; return acc; }, {});
    }
    const enriched = rows.map(r => {
      const g = groupsById[r.group_id] || null;
      return {
        group_id: r.group_id,
        group_code: g ? g.code : null,
        group_name: g ? g.name : null,
        // garantir número
        min_rate: r.min_rate != null ? Number(r.min_rate) : null
      };
    });
  // Armazenar no cache
  groupMinCache.set(enriched);
  return res.json({ success: true, data: { minimums: enriched } });
  } catch (error) {
    console.error('Erro ao buscar mínimos por grupo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;
