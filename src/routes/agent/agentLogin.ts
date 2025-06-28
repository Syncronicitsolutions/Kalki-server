import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AgentModel from '../../db/models/agent/AgentModel';

dotenv.config();

const agentAuth = express.Router();

agentAuth.post('/agentLogin', async (req: any, res: any) => {
    const { agent_email, agent_password } = req.body;

    // Validate input
    if (!agent_email || !agent_password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check if the agent exists in the database
        const agent = await AgentModel.findOne({ where: { agent_email } });
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found with this email.' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(agent_password, agent.agent_password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables');
        }
        const token = jwt.sign(
            { id: agent.agent_id, email: agent.agent_email, role: 'agent' }, // Payload
            process.env.JWT_SECRET, // Secret key (from .env)
            { expiresIn: '1h' } // Token expiry time
        );

        // Return the token and agent details (optionally)
        res.status(200).json({
            message: 'Login successful.',
            token,
            agent: {
                agent_id: agent.agent_id,
                agent_name: agent.agent_name,
                agent_email: agent.agent_email,
                status: agent.status,
            }
        });
    } catch (error: any) {
        console.error('Error during agent login:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

export default agentAuth;
