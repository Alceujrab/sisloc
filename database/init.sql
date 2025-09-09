-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS locadora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE locadora_db;

-- Tabela de usuários
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14),
  birth_date DATE,
  cnh_number VARCHAR(20),
  cnh_expiry DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  role ENUM('customer', 'employee', 'admin') DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  avatar VARCHAR(255),
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Tabela de veículos
CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  color VARCHAR(30) NOT NULL,
  license_plate VARCHAR(10) UNIQUE NOT NULL,
  category ENUM('compact', 'sedan', 'suv', 'luxury', 'van', 'truck') NOT NULL,
  transmission ENUM('manual', 'automatic') DEFAULT 'manual',
  fuel_type ENUM('gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid') DEFAULT 'flex',
  doors INT,
  seats INT,
  mileage INT DEFAULT 0,
  daily_rate DECIMAL(10, 2) NOT NULL,
  insurance_daily DECIMAL(10, 2) DEFAULT 0,
  features JSON,
  description TEXT,
  images JSON,
  thumbnail VARCHAR(255),
  status ENUM('available', 'rented', 'maintenance', 'inactive') DEFAULT 'available',
  location VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_brand (brand),
  INDEX idx_daily_rate (daily_rate),
  INDEX idx_is_featured (is_featured)
);

-- Tabela de reservas
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_code VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  return_location VARCHAR(255) NOT NULL,
  pickup_time TIME,
  return_time TIME,
  days_count INT NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  insurance_daily DECIMAL(10, 2) DEFAULT 0,
  extras JSON,
  extras_total DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  insurance_total DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'partial', 'refunded', 'failed') DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  checkin_date DATETIME,
  checkout_date DATETIME,
  checkin_mileage INT,
  checkout_mileage INT,
  fuel_level_checkin ENUM('empty', 'quarter', 'half', 'three_quarters', 'full'),
  fuel_level_checkout ENUM('empty', 'quarter', 'half', 'three_quarters', 'full'),
  damage_report_checkin TEXT,
  damage_report_checkout TEXT,
  additional_charges DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  UNIQUE INDEX idx_reservation_code (reservation_code)
);

-- Tabela de pagamentos
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  payment_method ENUM('credit_card', 'debit_card', 'pix', 'bank_transfer') NOT NULL,
  payment_gateway VARCHAR(50) DEFAULT 'stripe',
  gateway_transaction_id VARCHAR(255),
  gateway_payment_intent VARCHAR(255),
  status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_date DATETIME,
  refund_date DATETIME,
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  gateway_response JSON,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_method (payment_method),
  INDEX idx_gateway_transaction_id (gateway_transaction_id),
  INDEX idx_payment_date (payment_date)
);

-- Inserir usuário administrador padrão
INSERT INTO users (name, email, password, role, is_verified, status) VALUES 
('Administrador', 'admin@locadora.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7b4jH/l8b6', 'admin', TRUE, 'active');

-- Inserir dados de exemplo para veículos
INSERT INTO vehicles (brand, model, year, color, license_plate, category, transmission, fuel_type, doors, seats, daily_rate, insurance_daily, features, description, is_featured) VALUES 
('Chevrolet', 'Onix', 2023, 'Branco', 'ABC1234', 'compact', 'manual', 'flex', 4, 5, 89.90, 25.00, '["Ar condicionado", "Direção hidráulica", "Vidros elétricos"]', 'Carro econômico e confortável para uso urbano', TRUE),
('Toyota', 'Corolla', 2023, 'Prata', 'XYZ5678', 'sedan', 'automatic', 'flex', 4, 5, 159.90, 35.00, '["Ar condicionado", "Direção elétrica", "Central multimídia", "Câmera de ré"]', 'Sedan premium com excelente conforto e economia', TRUE),
('Honda', 'HR-V', 2023, 'Azul', 'HRV9876', 'suv', 'automatic', 'flex', 4, 5, 199.90, 45.00, '["Ar condicionado", "Direção elétrica", "Teto solar", "Sensor de estacionamento"]', 'SUV compacto ideal para viagens em família', TRUE),
('BMW', 'X1', 2023, 'Preto', 'BMW1111', 'luxury', 'automatic', 'gasoline', 4, 5, 399.90, 75.00, '["Ar condicionado", "Direção elétrica", "Bancos de couro", "GPS", "Teto solar"]', 'SUV de luxo com todo o conforto premium', FALSE),
('Volkswagen', 'Amarok', 2023, 'Branco', 'AMR2222', 'truck', 'manual', 'diesel', 4, 5, 249.90, 55.00, '["Ar condicionado", "Direção hidráulica", "Tração 4x4"]', 'Pick-up robusta para trabalho e aventura', FALSE),
('Fiat', 'Argo', 2022, 'Vermelho', 'ARG3333', 'compact', 'manual', 'flex', 4, 5, 79.90, 20.00, '["Ar condicionado", "Direção hidráulica"]', 'Compacto econômico para o dia a dia', FALSE),
('Hyundai', 'HB20', 2023, 'Cinza', 'HB20444', 'compact', 'automatic', 'flex', 4, 5, 99.90, 30.00, '["Ar condicionado", "Direção elétrica", "Central multimídia"]', 'Hatch moderno e econômico', FALSE),
('Renault', 'Duster', 2023, 'Verde', 'DST5555', 'suv', 'manual', 'flex', 4, 5, 179.90, 40.00, '["Ar condicionado", "Direção hidráulica", "Rodas de liga"]', 'SUV robusta para cidade e estrada', FALSE);

-- Inserir dados de exemplo para reservas (opcional)
INSERT INTO reservations (reservation_code, user_id, vehicle_id, start_date, end_date, pickup_location, return_location, days_count, daily_rate, subtotal, total_amount, status, payment_status) VALUES 
('RES123456ABCD', 1, 1, '2024-01-15', '2024-01-20', 'Aeroporto Internacional', 'Centro da Cidade', 5, 89.90, 449.50, 449.50, 'completed', 'paid'),
('RES789012EFGH', 1, 2, '2024-02-10', '2024-02-15', 'Hotel Central', 'Aeroporto Internacional', 5, 159.90, 799.50, 799.50, 'completed', 'paid');
