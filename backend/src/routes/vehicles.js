const express = require('express');
const { Op } = require('sequelize');
const { body, query, validationResult } = require('express-validator');
const { Vehicle, Reservation } = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/vehicles - Listar veículos com filtros
router.get('/', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite deve ser entre 1 e 50'),
  
  query('category')
    .optional()
    .isIn(['compact', 'sedan', 'suv', 'luxury', 'van', 'truck'])
    .withMessage('Categoria inválida'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço mínimo inválido'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço máximo inválido'),

  query('group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('group_id inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = {
      status: 'available'
    };

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.group_id) {
      where.group_id = parseInt(req.query.group_id);
    }

    if (req.query.brand) {
      where.brand = { [Op.iLike]: `%${req.query.brand}%` };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      where.daily_rate = {};
      if (req.query.minPrice) {
        where.daily_rate[Op.gte] = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        where.daily_rate[Op.lte] = parseFloat(req.query.maxPrice);
      }
    }

    if (req.query.transmission) {
      where.transmission = req.query.transmission;
    }

    if (req.query.fuel_type) {
      where.fuel_type = req.query.fuel_type;
    }

    if (req.query.seats) {
      where.seats = { [Op.gte]: parseInt(req.query.seats) };
    }

    // Verificar disponibilidade por data
    if (req.query.start_date && req.query.end_date) {
      const startDate = new Date(req.query.start_date);
      const endDate = new Date(req.query.end_date);

      // Subquery para veículos não disponíveis nas datas
      const unavailableVehicles = await Reservation.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                {
                  start_date: {
                    [Op.between]: [startDate, endDate]
                  }
                },
                {
                  end_date: {
                    [Op.between]: [startDate, endDate]
                  }
                },
                {
                  [Op.and]: [
                    { start_date: { [Op.lte]: startDate } },
                    { end_date: { [Op.gte]: endDate } }
                  ]
                }
              ]
            },
            {
              status: { [Op.in]: ['confirmed', 'active'] }
            }
          ]
        },
        attributes: ['vehicle_id']
      });

      const unavailableIds = unavailableVehicles.map(r => r.vehicle_id);
      if (unavailableIds.length > 0) {
        where.id = { [Op.notIn]: unavailableIds };
      }
    }

    // Ordenação
    let order = [['created_at', 'DESC']];
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          order = [['daily_rate', 'ASC']];
          break;
        case 'price_desc':
          order = [['daily_rate', 'DESC']];
          break;
        case 'year_desc':
          order = [['year', 'DESC']];
          break;
        case 'featured':
          order = [['is_featured', 'DESC'], ['created_at', 'DESC']];
          break;
      }
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
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

// GET /api/vehicles/featured - Veículos em destaque
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const vehicles = await Vehicle.findAll({
      where: {
        status: 'available',
        is_featured: true
      },
      limit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { vehicles }
    });

  } catch (error) {
    console.error('Erro ao buscar veículos em destaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/vehicles/categories - Listar categorias com contagem
router.get('/categories', async (req, res) => {
  try {
    const categories = await Vehicle.findAll({
      where: { status: 'available' },
      attributes: ['category', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['category'],
      raw: true
    });

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/vehicles/brands - Listar marcas
router.get('/brands', async (req, res) => {
  try {
    const brands = await Vehicle.findAll({
      where: { status: 'available' },
      attributes: ['brand'],
      group: ['brand'],
      order: [['brand', 'ASC']]
    });

    res.json({
      success: true,
      data: { 
        brands: brands.map(v => v.brand) 
      }
    });

  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/vehicles/:id - Detalhes do veículo
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id, {
      include: [{
        model: Reservation,
        as: 'reservations',
        where: { 
          status: { [Op.in]: ['confirmed', 'active'] },
          rating: { [Op.not]: null }
        },
        required: false,
        attributes: ['rating', 'review', 'created_at'],
        include: [{
          model: require('../models').User,
          as: 'customer',
          attributes: ['name']
        }]
      }]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Calcular média de avaliações
    const reviews = vehicle.reservations.filter(r => r.rating);
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    res.json({
      success: true,
      data: {
        vehicle: {
          ...vehicle.toJSON(),
          averageRating: Math.round(averageRating * 10) / 10,
          reviewsCount: reviews.length
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/vehicles/:id/availability - Verificar disponibilidade
router.get('/:id/availability', [
  query('start_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Data de início é obrigatória e deve ser válida'),
  
  query('end_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Data de fim é obrigatória e deve ser válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Verificar se veículo existe
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Verificar reservas conflitantes
    const conflictingReservations = await Reservation.findAll({
      where: {
        vehicle_id: id,
        status: { [Op.in]: ['confirmed', 'active'] },
        [Op.and]: [
          {
            [Op.or]: [
              {
                start_date: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                end_date: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: startDate } },
                  { end_date: { [Op.gte]: endDate } }
                ]
              }
            ]
          }
        ]
      }
    });

    const isAvailable = conflictingReservations.length === 0 && vehicle.status === 'available';

    // Calcular dias e preço total
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = vehicle.calculateTotalPrice(daysDiff, false);
    const totalWithInsurance = vehicle.calculateTotalPrice(daysDiff, true);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        days: daysDiff,
        pricing: {
          dailyRate: vehicle.daily_rate,
          insuranceDaily: vehicle.insurance_daily,
          subtotal: totalPrice,
          insuranceTotal: vehicle.insurance_daily * daysDiff,
          totalWithInsurance
        },
        conflictingDates: conflictingReservations.map(r => ({
          start: r.start_date,
          end: r.end_date
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
