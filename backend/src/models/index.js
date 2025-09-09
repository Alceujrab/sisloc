const User = require('./User');
const Vehicle = require('./Vehicle');
const Reservation = require('./Reservation');
const Payment = require('./Payment');
const Banner = require('./Banner');
const ContactInfo = require('./ContactInfo');
const Location = require('./Location');
const Coupon = require('./Coupon');
const UserDocument = require('./UserDocument');
const CarGroup = require('./CarGroup');
const BusinessLead = require('./BusinessLead');
const RefundRequest = require('./RefundRequest');
const LoyaltyAdjustment = require('./LoyaltyAdjustment');
const RefundAuditLog = require('./RefundAuditLog');
const PriceRule = require('./PriceRule');

// Definir associações
User.hasMany(Reservation, { 
  foreignKey: 'user_id', 
  as: 'reservations' 
});

User.hasMany(Payment, { 
  foreignKey: 'user_id', 
  as: 'payments' 
});

User.hasMany(UserDocument, {
  foreignKey: 'user_id',
  as: 'documents'
});

UserDocument.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Vehicle.hasMany(Reservation, { 
  foreignKey: 'vehicle_id', 
  as: 'reservations' 
});

// Associação opcional de Vehicle a CarGroup
try {
  const VehicleModel = Vehicle;
  VehicleModel.belongsTo(CarGroup, { foreignKey: 'group_id', as: 'group' });
  CarGroup.hasMany(VehicleModel, { foreignKey: 'group_id', as: 'vehicles' });
} catch (e) {
  // associações defensivas
}

Reservation.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'customer' 
});

Reservation.belongsTo(Vehicle, { 
  foreignKey: 'vehicle_id', 
  as: 'vehicle' 
});

Reservation.hasMany(Payment, { 
  foreignKey: 'reservation_id', 
  as: 'payments' 
});

Payment.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'customer' 
});

Payment.belongsTo(Reservation, { 
  foreignKey: 'reservation_id', 
  as: 'reservation' 
});

// RefundRequest associations (optional links to reservation/payment)
RefundRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
RefundRequest.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
RefundRequest.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
User.hasMany(RefundRequest, { foreignKey: 'user_id', as: 'refundRequests' });

// Loyalty adjustments associations
LoyaltyAdjustment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LoyaltyAdjustment.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
LoyaltyAdjustment.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
User.hasMany(LoyaltyAdjustment, { foreignKey: 'user_id', as: 'loyaltyAdjustments' });

// Refund audit logs associations
RefundAuditLog.belongsTo(RefundRequest, { foreignKey: 'refund_request_id', as: 'refund' });
RefundAuditLog.belongsTo(User, { foreignKey: 'actor_user_id', as: 'actor' });
RefundRequest.hasMany(RefundAuditLog, { foreignKey: 'refund_request_id', as: 'auditLogs' });

module.exports = {
  User,
  Vehicle,
  Reservation,
  Payment,
  Banner,
  ContactInfo,
  Location,
  Coupon,
  UserDocument,
  CarGroup,
  BusinessLead
  , RefundRequest
  , LoyaltyAdjustment
  , RefundAuditLog
  , PriceRule
};
