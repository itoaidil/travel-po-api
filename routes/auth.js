const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'po_partner_secret_key_2025';

// POST /api/auth/login - PO Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email dan password harus diisi' 
      });
    }
    
    // Simple password check first (temporary static password)
    if (password !== 'admin123') {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    // Query PO data with all fields Flutter expects
    const [rows] = await db.query(
      `SELECT id, po_name as name, email, phone, address, company_code, 
              logo_url, npwp, business_license, account_number, bank_name, 
              account_holder, commission_rate, status, verified_at, 
              rejected_reason, created_at 
       FROM pos WHERE email = ? AND is_active = 1`,
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    const po = rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        poId: po.id, 
        email: po.email,
        companyCode: po.company_code 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return response matching Flutter PO model exactly
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      po: {
        id: po.id,
        name: po.name, // Changed from po_name to name
        logo_url: po.logo_url,
        npwp: po.npwp,
        business_license: po.business_license,
        account_number: po.account_number,
        bank_name: po.bank_name,
        account_holder: po.account_holder,
        commission_rate: po.commission_rate || 10.0,
        status: po.status || 'pending',
        verified_at: po.verified_at,
        rejected_reason: po.rejected_reason,
        created_at: po.created_at
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
});

// POST /api/auth/register - PO Registration
router.post('/register', async (req, res) => {
  try {
    const { po_name, email, password, phone, address } = req.body;
    
    // Validate required fields
    if (!po_name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field wajib diisi' 
      });
    }
    
    // Check if email already exists
    const [existing] = await db.query(
      'SELECT id FROM pos WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar' 
      });
    }
    
    // Generate company code
    const companyCode = 'PO' + Date.now().toString().slice(-8);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new PO
    const [result] = await db.query(
      `INSERT INTO pos (po_name, email, phone, address, company_code, password_hash, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [po_name, email, phone, address || '', companyCode, hashedPassword]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Registrasi berhasil! Silakan login.',
      po_id: result.insertId
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak ditemukan' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token tidak valid' 
      });
    }
    req.poId = decoded.poId;
    req.email = decoded.email;
    next();
  });
};

module.exports = { router, verifyToken };
