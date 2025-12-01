-- Migration for Live Tracking and Weather Features
-- Created: 2025-12-01

-- Table: driver_locations
-- Stores real-time GPS locations of drivers
CREATE TABLE IF NOT EXISTS driver_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  travel_id INT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Speed in km/h',
  heading DECIMAL(5, 2) COMMENT 'Direction in degrees (0-360)',
  accuracy DECIMAL(6, 2) COMMENT 'GPS accuracy in meters',
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (travel_id) REFERENCES travels(id) ON DELETE SET NULL,
  
  INDEX idx_driver_active (driver_id, is_active),
  INDEX idx_travel (travel_id),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: travel_tracking
-- Tracks the status and progress of ongoing travels
CREATE TABLE IF NOT EXISTS travel_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  travel_id INT NOT NULL,
  driver_id INT NOT NULL,
  booking_id INT,
  tracking_status ENUM('waiting', 'picking_up', 'on_route', 'arrived', 'completed', 'cancelled') DEFAULT 'waiting',
  
  -- Pickup tracking
  pickup_started_at TIMESTAMP NULL,
  pickup_eta_minutes INT COMMENT 'Estimated time to pickup in minutes',
  pickup_completed_at TIMESTAMP NULL,
  
  -- Journey tracking
  journey_started_at TIMESTAMP NULL,
  journey_eta_minutes INT COMMENT 'Estimated time to destination in minutes',
  journey_completed_at TIMESTAMP NULL,
  
  -- Distance tracking
  total_distance_km DECIMAL(8, 2) COMMENT 'Total distance covered in km',
  remaining_distance_km DECIMAL(8, 2) COMMENT 'Remaining distance to destination in km',
  
  -- Additional info
  current_location_name VARCHAR(255),
  notes TEXT,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (travel_id) REFERENCES travels(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  
  INDEX idx_travel_status (travel_id, tracking_status),
  INDEX idx_driver (driver_id),
  INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: weather_conditions
-- Stores weather data for travel routes
CREATE TABLE IF NOT EXISTS weather_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Weather data
  weather_main VARCHAR(50) COMMENT 'Main weather condition (e.g., Rain, Clear, Clouds)',
  weather_description VARCHAR(255) COMMENT 'Detailed description',
  weather_icon VARCHAR(10) COMMENT 'Weather icon code',
  
  temperature DECIMAL(5, 2) COMMENT 'Temperature in Celsius',
  feels_like DECIMAL(5, 2) COMMENT 'Feels like temperature',
  temp_min DECIMAL(5, 2),
  temp_max DECIMAL(5, 2),
  
  humidity INT COMMENT 'Humidity percentage',
  pressure INT COMMENT 'Atmospheric pressure in hPa',
  visibility INT COMMENT 'Visibility in meters',
  wind_speed DECIMAL(5, 2) COMMENT 'Wind speed in m/s',
  wind_deg INT COMMENT 'Wind direction in degrees',
  clouds INT COMMENT 'Cloudiness percentage',
  
  rain_1h DECIMAL(5, 2) COMMENT 'Rain volume for last 1 hour in mm',
  rain_3h DECIMAL(5, 2) COMMENT 'Rain volume for last 3 hours in mm',
  
  sunrise_time TIMESTAMP NULL,
  sunset_time TIMESTAMP NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'Cache expiry time',
  
  INDEX idx_location (latitude, longitude),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: pickup_queue
-- Manages the pickup order for drivers (closest customers first)
CREATE TABLE IF NOT EXISTS pickup_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  travel_id INT NOT NULL,
  driver_id INT NOT NULL,
  booking_id INT NOT NULL,
  
  customer_latitude DECIMAL(10, 8) NOT NULL,
  customer_longitude DECIMAL(11, 8) NOT NULL,
  customer_address TEXT,
  
  distance_km DECIMAL(8, 2) COMMENT 'Distance from driver to customer',
  pickup_order INT COMMENT 'Order in pickup sequence',
  pickup_status ENUM('pending', 'in_progress', 'picked_up', 'skipped') DEFAULT 'pending',
  
  estimated_arrival_time TIMESTAMP NULL,
  actual_pickup_time TIMESTAMP NULL,
  
  notes TEXT,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (travel_id) REFERENCES travels(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  
  INDEX idx_driver_status (driver_id, pickup_status),
  INDEX idx_travel (travel_id),
  INDEX idx_pickup_order (travel_id, pickup_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS is_tracking_enabled BOOLEAN DEFAULT TRUE;

-- Add columns to drivers table if not exists
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP NULL;

-- Add columns to travels table if not exists
ALTER TABLE travels 
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS weather_alert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(50);
