import { Router } from 'express';
import { fileStorage } from '../config/storage';
import { csvStorage } from '../config/csvStorage';
import { createError } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

// Register builder
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, company_name, phone_number, user_type } = req.body;

    if (!phone_number || !password || !name) {
      throw createError('Phone number, password, and name are required', 400);
    }

    // Check if user already exists by phone
    const existingUser = fileStorage.getUsers().find((u: any) => u.phone === phone_number);
    if (existingUser) {
      throw createError('User with this phone number already exists', 400);
    }

    // Create user
    const user = await fileStorage.createUser({
      email: email || phone_number + '@homemates.com',
      password,
      name,
      company_name,
      phone: phone_number,
      user_type: user_type || 'tenant'
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: phone_number,
        builderId: user.id,
        user_type: user_type || 'tenant'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: phone_number,
        name: user.name,
        company_name: user.company_name,
        user_type: user_type || 'tenant'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login with mobile number
authRouter.post('/login', async (req, res, next) => {
  try {
    const { phone_number, password, user_type } = req.body;

    if (!phone_number) {
      throw createError('Phone number is required', 400);
    }

    // Default password is 1234
    const loginPassword = password || '1234';
    const loginUserType = user_type || 'tenant';

    // Normalize phone number (remove spaces, +, etc.)
    const normalizedPhone = phone_number.replace(/[\s\+\-\(\)]/g, '');

    // Try to find user by phone number
    let user = fileStorage.getUsers().find((u: any) => {
      const userPhone = (u.phone || u.email || '').replace(/[\s\+\-\(\)]/g, '');
      return userPhone === normalizedPhone || userPhone === phone_number;
    });

    // If user doesn't exist, create one with default password
    if (!user) {
      // Check if it's a tenant or owner
      if (loginUserType === 'tenant') {
        // Check if tenant exists in CSV
        const tenant = await csvStorage.getTenantByPhone(phone_number);
        if (tenant) {
          // Create user from tenant
          user = await fileStorage.createUser({
            email: phone_number + '@homemates.com',
            password: loginPassword,
            name: tenant.name || 'Tenant',
            phone: phone_number,
            user_type: 'tenant'
          });
        } else {
          // Create new tenant user
          user = await fileStorage.createUser({
            email: phone_number + '@homemates.com',
            password: loginPassword,
            name: 'Tenant',
            phone: phone_number,
            user_type: 'tenant'
          });
        }
      } else {
        // Create owner user
        user = await fileStorage.createUser({
          email: phone_number + '@homemates.com',
          password: loginPassword,
          name: 'Owner',
          phone: phone_number,
          user_type: 'owner'
        });
      }
    }

    // Verify password (default is 1234)
    const defaultPassword = '1234';
    let isValid = false;

    if (user.password) {
      // User has a password, verify it
      try {
        isValid = await fileStorage.verifyPassword(loginPassword, user.password);
      } catch (e) {
        // If password verification fails, check if it's the default password
        isValid = loginPassword === defaultPassword;
      }
    } else {
      // No password set, check if it's the default password
      isValid = loginPassword === defaultPassword;
    }

    // Also allow default password 1234 for any user
    if (!isValid && loginPassword === defaultPassword) {
      isValid = true;
    }

    if (!isValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone || phone_number,
        builderId: user.id,
        user_type: user.user_type || loginUserType
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || phone_number,
        name: user.name,
        company_name: user.company_name,
        user_type: user.user_type || loginUserType
      }
    });
  } catch (error) {
    next(error);
  }
});
