import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AdminUsersModel from '../../db/models/admin/AdminUserModel';

const adminauthrouter = express.Router();

adminauthrouter.post('/admin-register', async (req: any, res: any) => {
    const { admin_email, admin_password, admin_user_name, role } = req.body;

    try {
        // Check if the email already exists
        const existingAdmin = await AdminUsersModel.findOne({ where: { admin_email } });

        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        // Create the new admin user in the database
        const newAdminUser = await AdminUsersModel.create({
            admin_user_name,
            admin_email,
            admin_password: hashedPassword,
            role: role || 'admin',
            admin_phone: ''
        });

        // Return success message
        res.status(201).json({ message: 'Admin user created successfully', admin_user_id: newAdminUser.admin_user_id });
    } catch (err: any) {
        console.error('Error creating admin user:', err);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
});

adminauthrouter.post('/admin-login', async (req: any, res: any) => {
    const { admin_email, admin_password } = req.body;

    try {
        // Find the admin user by email
        const adminUser = await AdminUsersModel.findOne({ where: { admin_email } });

        // If the user doesn't exist, return an error
        if (!adminUser) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(admin_password, adminUser.admin_password);

        if (isPasswordValid) {
            // Password is valid, generate a JWT token
            const payload = {
                email: adminUser.admin_email,
                role: adminUser.role, // admin or superadmin
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET ?? 'default_secret', { expiresIn: '24h' });

            res.status(200).json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err: any) {
        console.error('Error logging in admin:', err);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
});

adminauthrouter.get('/profile', async (req: any, res: any) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get the token from the Authorization header
  
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'default_secret') as { email: string };
      const adminUser = await AdminUsersModel.findOne({ where: { admin_email: decoded.email } });
  
      if (!adminUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        admin_user_name: adminUser.admin_user_name,
        role: adminUser.role,
      });
    } catch (err) {
      console.error('Error verifying token:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

export default adminauthrouter;
