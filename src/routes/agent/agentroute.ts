import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'; // Add this import
import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import AgentModel from '../../db/models/agent/AgentModel';
import AssignedTasksModel from '../../db/models/agent/AssignedTasks'
import BookingHistoryModel from '../../db/models/bookings/BookingHistoryModel';
import authenticateUserToken from '../../middleWare/userAuthmiddleware';
import WalletModel from '../../db/models/agent/WalletModel';
import WithdrawalRequestModel from '../../db/models/agent/WithdrawalRequestModel';
import PujaModel from '../../db/models/pujas/PujaModel';
import PujaPackagesModel from '../../db/models/pujas/PujaPackagesModel';
import UserModel from '../../db/models/users/usersModel';
import { col, fn, literal, Op } from 'sequelize';
import CommissionHistoryModel from '../../db/models/agent/CommissionHistoryModel';
dotenv.config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION || !process.env.BUCKET_NAME) {
    throw new Error('Missing AWS configuration in .env file');
}

const s3 = new S3Client({
    region: process.env.BUCKET_REGION.trim(),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.BUCKET_NAME as string,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `agent_uploads/${Date.now()}_${file.originalname}`);
        },
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/jpeg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and JPEG are allowed.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, 
});

const agentRouter = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,     // e.g., 'support@yourdomain.com'
    pass: process.env.EMAIL_PASSWORD, // your email password or app password
  },
});


// ✅ Safe Email Function
export async function sendMail(to: string, subject: string, html: string) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('❌ Invalid or missing recipient email:', to);
    return;
  }

  const mailOptions = {
    from: `"Kalki Seva" <${process.env.EMAIL_USER}>`, // ✅ Friendly Name
    to,
    subject,
    html,
    replyTo: process.env.EMAIL_USER, // ✅ Optional
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
  } catch (error: any) {
    console.error('❌ Email send error:', error?.message || error);
    throw error;
  }
}





agentRouter.post('/create-agent', authenticateUserToken, async (req: any, res: any) => {
  const { agent_name, agent_email, phone_number } = req.body;
  const { role, id: created_by } = req.user;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can create agents' });
  }

  try {
    const existingAgent = await AgentModel.findOne({
      where: { agent_email },
      paranoid: false, // includes soft-deleted
    });

    // 🔁 Agent exists (active or soft-deleted)
    if (existingAgent) {
      if (existingAgent.deletedAt) {
        await existingAgent.restore();
        console.log(`♻️ Restored soft-deleted agent: ${agent_email}`);
      }

      // 🔁 Resend password if agent hasn't changed it yet
      if (!existingAgent.password_change_required) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await AgentModel.update(
          {
            agent_password: hashedPassword,
            password_change_required: false,
            verified: false,
            status: 'active',
          },
          { where: { agent_email } }
        );

        console.log(`📧 Resending temp credentials to: ${agent_email}`);
        await sendMail(agent_email, 'Agent Login Credentials (Resent)', `
          <p>Hello ${existingAgent.agent_name},</p>
          <p>Your agent account already exists. Here are your updated temporary credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${agent_email}</li>
            <li><strong>Password:</strong> ${tempPassword}</li>
          </ul>
          <p>Please login and reset your password.</p>
          <p>Regards,<br/>Kalki Seva Team</p>
        `);

        return res.status(200).json({ message: 'Agent exists. Credentials resent.' });
      }

      // ❌ Already verified
      return res.status(409).json({ message: 'Agent already exists and verified.' });
    }

    // ✅ New agent creation
    const lastAgent = await AgentModel.findOne({
      order: [['created', 'DESC']],
      attributes: ['agent_id'],
      paranoid: false,
    });

    const lastId = lastAgent?.agent_id ? parseInt(lastAgent.agent_id.replace('KSA', '')) : 1000;
    const newAgentId = `KSA${lastId + 1}`;

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newAgent = await AgentModel.create({
      agent_id: newAgentId,
      agent_name,
      agent_email,
      phone_number,
      agent_password: hashedPassword,
      created_by,
      status: 'active',
      verified: false,
      password_change_required: false,
    });

    console.log(`✅ Created agent: ${agent_email} | Temp password: ${tempPassword}`);

    await sendMail(agent_email, 'Agent Login Credentials', `
      <p>Hello ${agent_name},</p>
      <p>Your agent account has been created successfully. Here are your temporary credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${agent_email}</li>
        <li><strong>Password:</strong> ${tempPassword}</li>
      </ul>
      <p>Please login and update your password to activate your account.</p>
      <p>Best regards,<br/>Kalki Seva Team</p>
    `);

    return res.status(201).json({ message: 'Agent created and email sent', agent: newAgent });

  } catch (error: any) {
    console.error('❌ Error in create-agent:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});






  agentRouter.post('/resend-agent-password', authenticateUserToken, async (req: any, res: any) => {
    const { agent_email } = req.body;
    const { role } = req.user;
  
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can resend passwords' });
    }
  
    try {
      const agent = await AgentModel.findOne({ where: { agent_email } });
  
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
  
      if (agent.password_change_required) {
        return res.status(400).json({ message: 'Password already updated. Cannot resend temporary password.' });
      }
  
      // 🔐 Generate new temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
      // 🔁 Update password in DB
      await AgentModel.update(
        {
          agent_password: hashedPassword,
        },
        { where: { agent_email } }
      );
  
      // 📧 Send email again
      await sendMail(agent_email, 'Resent Agent Temporary Password', `
        <p>Hello ${agent.agent_name},</p>
        <p>Your new temporary login credentials are:</p>
        <ul>
          <li><strong>Email:</strong> ${agent_email}</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
        </ul>
        <p>Please login and change your password immediately.</p>
        <p>Best regards,<br/>Kalki Seva Team</p>
      `);
  
      res.status(200).json({ message: 'Temporary password resent successfully' });
  
    } catch (err) {
      console.error('Error resending password:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  });
  


  

agentRouter.post('/login', async (req: any, res: any) => {
  const { agent_email, agent_password } = req.body;

  try {
    const agent = await AgentModel.findOne({ where: { agent_email } });
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    const valid = await bcrypt.compare(agent_password, agent.agent_password);
    if (!valid) return res.status(401).json({ message: 'Invalid password' });

    // Issue token
    const token = jwt.sign(
      { id: agent.agent_id, role: 'agent' },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      message: agent.password_change_required
        ? 'Login successful'
        : 'Please reset your password',
      password_change_required: agent.password_change_required, // ✅ fixed
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error', error: err });
  }
});



  agentRouter.put('/reset-password', async (req: any, res: any) => {
    const { new_password } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
  
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
    let agentId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      agentId = (decoded as any)?.id;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid Token', error });
    }
  
    if (!new_password) {
      return res.status(400).json({ message: 'New password required' });
    }
  
    try {
      const hashed = await bcrypt.hash(new_password, 10);
      await AgentModel.update(
        {
          agent_password: hashed,
          password_change_required: true, // ✅ Mark first-time reset complete
        },
        { where: { agent_id: agentId } }
      );
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Reset error', error: err });
    }
  });
  

  agentRouter.post("/forgot-password", async (req: any, res: any) => {
    const { email } = req.body;
  
    if (!email)
      return res.status(400).json({ message: "Email is required" });
  
    try {
      const agent = await AgentModel.findOne({
        where: { agent_email: email },
        paranoid: false,
      });
  
      if (!agent)
        return res.status(404).json({ message: "No agent found with that email" });
  
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
      agent.agent_password = hashedPassword;
      agent.password_change_required = false;
      await agent.save();
  
      // ✅ Use the already defined sendMail in same file
      await sendMail(email, "Reset Password - Kalki Seva Agent", `
        <p>Hello ${agent.agent_name || "Agent"},</p>
        <p>You requested to reset your password. Here is your temporary login:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
        </ul>
        <p>Please login using this password and reset it immediately.</p>
        <p>Regards,<br/>Kalki Seva Team</p>
      `);
  
      return res.status(200).json({ message: "Temporary password sent to your email." });
  
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  



  agentRouter.put(
    '/upload-kyc/:agent_id',
    upload.fields([
      { name: 'aadhaar_image_upload', maxCount: 2 },
      { name: 'pan_image_upload', maxCount: 2 },
      { name: 'bank_image_upload', maxCount: 2 },
      { name: 'address_proof', maxCount: 2 },
    ]),
    async (req: any, res: any) => {
      const { agent_id } = req.params;
  
      try {
        const now = new Date();
        const kycData = {
          agent_name: req.body.agent_name,
          gender: req.body.gender,
          phone_number: req.body.phone_number,
          dateofbirth: new Date(req.body.dateofbirth),
          address: req.body.address,
          aadhaarnumber: req.body.aadhaarnumber,
          pannumber: req.body.pannumber,
          bankaccount_number: req.body.bankaccount_number,
          ifsccode: req.body.ifsccode,
          branch: req.body.branch,
          account_holder_name: req.body.account_holder_name,
          account_type: req.body.account_type,
  
          // ✅ Uploaded files
          aadhaar_image_upload: req.files?.['aadhaar_image_upload']?.map((f: any) => f.location) || null,
          pan_image_upload: req.files?.['pan_image_upload']?.map((f: any) => f.location) || null,
          bank_image_upload: req.files?.['bank_image_upload']?.map((f: any) => f.location) || null,
          address_proof: req.files?.['address_proof']?.map((f: any) => f.location) || null,
  
          // ✅ Uploaded timestamps only if files exist
          aadhaar_uploaded_at: req.files?.['aadhaar_image_upload']?.length ? now : null,
          pan_uploaded_at: req.files?.['pan_image_upload']?.length ? now : null,
          bank_uploaded_at: req.files?.['bank_image_upload']?.length ? now : null,
          address_uploaded_at: req.files?.['address_proof']?.length ? now : null,
  
          // Default verification values
          approval_status: false,
          verified: false,
          kyc_submitted: true,
          aadhaar_verified_status: false,
          pan_verified_status: false,
          bank_verified_status: false,
          address_verified_status: false,
          aadhaar_verified_at: null,
          pan_verified_at: null,
          bank_verified_at: null,
          address_verified_at: null,
        };
  
        await AgentModel.update(kycData, { where: { agent_id } });
  
        res.status(200).json({ message: 'KYC updated successfully' });
      } catch (err) {
        console.error('❌ KYC error:', err);
        res.status(500).json({ message: 'Server error', error: err });
      }
    }
  );


  agentRouter.put(
    '/upload-kyc-documents/:agent_id',
    upload.fields([
      { name: 'aadhaar_image_upload', maxCount: 2 },
      { name: 'pan_image_upload', maxCount: 2 },
      { name: 'bank_image_upload', maxCount: 2 },
      { name: 'address_proof', maxCount: 2 },
    ]),
    async (req: any, res: any) => {
      const { agent_id } = req.params;
  
      try {
        const now = new Date();
        const updatedData: any = {};
  
        // Check and update each document conditionally
        if (req.files?.['aadhaar_image_upload']?.length) {
          updatedData.aadhaar_image_upload = req.files['aadhaar_image_upload'].map((f: any) => f.location);
          updatedData.aadhaar_uploaded_at = now;
          updatedData.aadhaar_verified_status = false;
          updatedData.aadhaar_verified_at = null;
        }
  
        if (req.files?.['pan_image_upload']?.length) {
          updatedData.pan_image_upload = req.files['pan_image_upload'].map((f: any) => f.location);
          updatedData.pan_uploaded_at = now;
          updatedData.pan_verified_status = false;
          updatedData.pan_verified_at = null;
        }
  
        if (req.files?.['bank_image_upload']?.length) {
          updatedData.bank_image_upload = req.files['bank_image_upload'].map((f: any) => f.location);
          updatedData.bank_uploaded_at = now;
          updatedData.bank_verified_status = false;
          updatedData.bank_verified_at = null;
        }
  
        if (req.files?.['address_proof']?.length) {
          updatedData.address_proof = req.files['address_proof'].map((f: any) => f.location);
          updatedData.address_uploaded_at = now;
          updatedData.address_verified_status = false;
          updatedData.address_verified_at = null;
        }
  
        if (Object.keys(updatedData).length === 0) {
          return res.status(400).json({ message: 'No documents uploaded' });
        }
  
        updatedData.kyc_submitted = true;
  
        await AgentModel.update(updatedData, { where: { agent_id } });
  
        res.status(200).json({ message: 'Documents uploaded successfully' });
      } catch (err) {
        console.error('❌ Upload documents error:', err);
        res.status(500).json({ message: 'Server error', error: err });
      }
    }
  );
  
  

  agentRouter.get('/status/:agent_id', async (req: any, res: any) => {
    try {
      const { agent_id } = req.params;
      const agent = await AgentModel.findOne({ where: { agent_id } });
  
      if (!agent) return res.status(404).json({ message: 'Agent not found' });
  
      res.status(200).json({
        kyc_submitted: agent.kyc_submitted,
        approval_status: agent.approval_status,
        verified: agent.verified,
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  });
  
  
  agentRouter.put('/verify-document/:agent_id', async (req: any, res: any) => {
    const { agent_id } = req.params;
    const { documentType, status } = req.body;
  
    const now = new Date();
  
    // Accepted document types
    const validDocumentTypes: Record<string, { statusKey: string; dateKey: string }> = {
      aadhaar: { statusKey: 'aadhaar_verified_status', dateKey: 'aadhaar_verified_at' },
      pan: { statusKey: 'pan_verified_status', dateKey: 'pan_verified_at' },
      bank: { statusKey: 'bank_verified_status', dateKey: 'bank_verified_at' },
      address: { statusKey: 'address_verified_status', dateKey: 'address_verified_at' }
    };
  
    try {
      const agent = await AgentModel.findByPk(agent_id);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
  
      const docConfig = validDocumentTypes[documentType?.toLowerCase()];
      if (!docConfig) {
        return res.status(400).json({ message: 'Invalid document type' });
      }
  
     // Check if the document is actually uploaded
const hasUpload = (() => {
  switch (documentType.toLowerCase()) {
    case 'aadhaar':
      return Array.isArray(agent.aadhaar_image_upload) && agent.aadhaar_image_upload.length > 0;
    case 'pan':
      return Array.isArray(agent.pan_image_upload) && agent.pan_image_upload.length > 0;
    case 'bank':
      return Array.isArray(agent.bank_image_upload) && agent.bank_image_upload.length > 0;
    case 'address':
      return Array.isArray(agent.address_proof) && agent.address_proof.length > 0;
    default:
      return false;
  }
})();

if (!hasUpload) {
  return res.status(400).json({ message: `No ${documentType} document uploaded.` });
}

const updateData: any = {
  [docConfig.statusKey]: status,
  [docConfig.dateKey]: status ? now : null
};

  
      await agent.update({
        ...updateData,
        dateofbirth: updateData.dateofbirth || null, // Ensure compatibility
      });
  
      return res.status(200).json({ message: `${documentType} verification updated successfully.` });
    } catch (error) {
      console.error('Error verifying document:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  });
  
  // ✅ Get Agent by ID
  agentRouter.get('/get-agent/:agent_id', async (req: any, res: any) => {
    const { agent_id } = req.params;
    try {
      const agent = await AgentModel.findByPk(agent_id);
      if (!agent) return res.status(404).json({ message: 'Agent not found' });
      res.status(200).json({ agent });
    } catch (error) {
      console.error('Get by ID error:', error);
      res.status(500).json({ message: 'Error fetching agent', error });
    }
  });
  
  
  agentRouter.get('/all-agents', async (req: any, res: any) => {
    try {
      const agents = await AgentModel.findAll();
      res.status(200).json({ agents });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ message: 'Error fetching agents', error });
    }
  });



  agentRouter.get('/total-agents', async (req: any, res: any) => {
    try {
      const agents = await AgentModel.findAll({
        attributes: [
          'agent_id',
          'agent_name',
          'agent_email',
          'phone_number',
          'status',
          'verified',
          'created'
        ],
        order: [['created', 'DESC']],
      });
  
      const agentsWithTotalBookings = await Promise.all(
        agents.map(async (agent: any) => {
          const completedTaskCount = await AssignedTasksModel.count({
            where: {
              agent_id: agent.agent_id,
              task_status: 'completed',
            },
          });
  
          return {
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
            agent_email: agent.agent_email,
            phone: agent.phone_number,
            status: agent.status,
            verified: agent.verified,
            created: agent.created,
            totalBookings: completedTaskCount, // ✅ completed task count added
          };
        })
      );
  
      res.status(200).json({ agents: agentsWithTotalBookings });
  
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ message: 'Error fetching agents', error });
    }
  });

  


agentRouter.post("/assign-agent/:booking_id", async (req: any, res: any) => {
  const { booking_id } = req.params;
  const { agent_id } = req.body;

  try {
    if (!agent_id) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    const booking = await BookingHistoryModel.findOne({ where: { booking_id } });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const existing = await AssignedTasksModel.findOne({ where: { booking_id } });

    if (existing) {
      // ✅ If agent is already assigned, update to new one (reassign)
      const totalAmount = parseFloat(booking.total_amount.toString());
      const agentCommission = parseFloat((totalAmount * 0.1).toFixed(2));

      await existing.update({
        agent_id,
        task_status: "reassigned",
        agent_commission: agentCommission,
      });

      await booking.update({ agent_id });

      return res.status(200).json({ message: "Agent reassigned successfully" });
    }

    // ✅ If no agent assigned, assign a new one
    const totalAmount = parseFloat(booking.total_amount.toString());
    const agentCommission = parseFloat((totalAmount * 0.1).toFixed(2));

    const assignedTask = await AssignedTasksModel.create({
      booking_id,
      agent_id,
      task_status: "assigned",
      agent_commission: agentCommission,
    });

    await booking.update({ agent_id });

    return res.status(201).json({
      message: "Agent assigned successfully",
      assignedTask,
    });
  } catch (error) {
    console.error("Error assigning agent:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});



agentRouter.delete("/remove-agent/:booking_id", async (req: any, res: any) => {
  const { booking_id } = req.params;

  try {
    const assignedTask = await AssignedTasksModel.findOne({ where: { booking_id } });

    if (!assignedTask) {
      return res.status(404).json({ message: "No agent assigned to this booking" });
    }

    // ⛔ Block if task already started
    if (assignedTask.task_status === "started") {
      return res.status(400).json({ message: "Cannot remove agent. Task already started." });
    }

    // ✅ Remove from AssignedTasks
    await assignedTask.destroy();

    // ✅ Update BookingHistory: remove agent_id and set puja_status to 'pending'
    await BookingHistoryModel.update(
      {
        agent_id: undefined,
        puja_status: "pending"
      },
      {
        where: { booking_id }
      }
    );

    return res.status(200).json({ message: "Agent removed successfully" });
  } catch (error) {
    console.error("Error removing agent:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});


agentRouter.route('/agents/:booking_id')
  .post(async (req: any, res: any) => {
    const { booking_id } = req.params;
    const { agent_id } = req.body;

    try {
      if (!agent_id) {
        return res.status(400).json({ message: "Agent ID is required" });
      }

      const booking = await BookingHistoryModel.findOne({ where: { booking_id } });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // ✅ Check if any agent is already assigned
      const existingAssignment = await AssignedTasksModel.findOne({ where: { booking_id } });

      if (existingAssignment) {
        // ✅ Remove old agent assignment
        await existingAssignment.destroy();
      }

      const totalAmount = parseFloat(booking.total_amount.toString() || '0');
      const agentCommission = parseFloat((totalAmount * 0.10).toFixed(2)); // 10% commission

      // ✅ Create new assignment
      const assignedTask = await AssignedTasksModel.create({
        booking_id,
        agent_id,
        task_status: 'assigned',
        agent_commission: agentCommission,
      });

      return res.status(201).json({
        message: existingAssignment
          ? "Agent reassigned successfully"
          : "Agent assigned successfully",
        assignedTask,
      });

    } catch (error) {
      console.error("Error assigning/reassigning agent:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  });


agentRouter.route('/agents/:booking_id?')
  .get(async (req: any, res: any) => {
    try {
      // 1. Get all agents
      const agents = await AgentModel.findAll();

      // 2. For each agent, count completed tasks
      const agentsWithTaskCount = await Promise.all(
        agents.map(async (agent: any) => {
          const completedTasks = await AssignedTasksModel.count({
            where: {
              agent_id: agent.agent_id,
              task_status: 'completed',
            },
          });

          return {
            ...agent.toJSON(), // Keep agent fields
            completed_tasks: completedTasks, // Add completed task count
          };
        })
      );

      res.status(200).json({ agents: agentsWithTaskCount });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ message: 'Error fetching agents', error });
    }
  })

  .post(async (req: any, res: any) => {
    const { booking_id } = req.params;
    const { agent_id } = req.body;

    try {
      if (!agent_id) {
        return res.status(400).json({ message: "Agent ID is required" });
      }
      if (!booking_id) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await BookingHistoryModel.findOne({ where: { booking_id } });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const existing = await AssignedTasksModel.findOne({ where: { booking_id, agent_id } });
      if (existing) {
        return res.status(400).json({ message: "Agent already assigned to this booking" });
      }

      const totalAmount = parseFloat(booking.total_amount.toString());
      const agentCommission = parseFloat((totalAmount * 0.1).toFixed(2));

      const assignedTask = await AssignedTasksModel.create({
        booking_id,
        agent_id,
        task_status: "assigned",
        agent_commission: agentCommission,
      });

      await booking.update({ agent_id });

      return res.status(201).json({
        message: "Agent assigned successfully",
        assignedTask,
      });

    } catch (error) {
      console.error("Error assigning agent:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  });


agentRouter.put('/update-task-status/:booking_id', async (req: any, res: any) => {
  console.log('⏩ Request received:', req.params, req.body);

  const { booking_id } = req.params;
  const { task_status, agent_id } = req.body;

  try {
    if (!task_status || !agent_id) {
      return res.status(400).json({ message: 'task_status and agent_id are required' });
    }

    const assignedTask = await AssignedTasksModel.findOne({ where: { booking_id, agent_id } });
    if (!assignedTask) {
      return res.status(404).json({ message: 'Assigned task not found for this booking and agent' });
    }

    assignedTask.task_status = task_status;
    await assignedTask.save();

    const booking = await BookingHistoryModel.findOne({ where: { booking_id } });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.puja_status = task_status;
    await booking.save();

    if (task_status === 'completed') {
      const rawCommission = assignedTask.agent_commission;
      const commissionAmount = parseFloat(String(rawCommission));

      if (isNaN(commissionAmount) || commissionAmount <= 0) {
        return res.status(400).json({ message: 'Invalid or missing agent commission' });
      }

      let wallet = await WalletModel.findOne({ where: { agent_id } });

      if (!wallet) {
        console.log(`⚠️ Wallet not found for agent ${agent_id}. Creating new wallet.`);

        wallet = await WalletModel.create({
          wallet_id: `WLT${Date.now()}`,
          agent_id,
          total_earnings: commissionAmount,
          total_withdrawn: 0,
          current_balance: commissionAmount,
          last_updated: new Date(),
        });
      } else {
        wallet.total_earnings = Number(wallet.total_earnings) + commissionAmount;
        wallet.current_balance = Number(wallet.current_balance) + commissionAmount;
        wallet.last_updated = new Date();
        await wallet.save();
      }
    }

    return res.status(200).json({
      message: `Task status updated to "${task_status}"`,
      updatedTask: assignedTask,
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error?.message || 'Unknown error',
    });
  }
});




agentRouter.get('/agent/:agent_id/commission-history', async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    const history = await CommissionHistoryModel.findAll({
      where: { agent_id },
      order: [['created_at', 'DESC']],
    });

    if (!history.length) {
      return res.status(404).json({ message: 'No commission history found for this agent.' });
    }

    return res.status(200).json({ message: 'Commission history retrieved', data: history });
  } catch (err) {
    console.error('❌ Error fetching commission history:', err);
    return res.status(500).json({ message: 'Internal server error', error: err });
  }
});


 
agentRouter.put('/update-approval-status/:agent_id', async (req: any, res: any) => {
  const { agent_id } = req.params;
  try {
    const agent = await AgentModel.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const currentVerified = agent.verified || false;
    const currentApprovalStatus = agent.approval_status || false;

    // 🔥 Check if both are SAME
    if (currentVerified !== currentApprovalStatus) {
      return res.status(400).json({
        message: 'Mismatch: verified and approval_status must both be true or both be false to toggle.',
      });
    }

    // 🔥 Toggle both
    const newStatus = !currentVerified; // if false → true, if true → false

    await agent.update({
      verified: newStatus,
      approval_status: newStatus,
    });

    res.status(200).json({
      message: `Agent verification and approval status toggled successfully.`,
      agent_id,
      verified: newStatus,
      approval_status: newStatus,
    });
  } catch (error) {
    console.error('❌ Error toggling agent approval status:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});



// POST /api/v1/agent/change-password
agentRouter.put('/change-password', async (req: any, res: any) => {
  try {
    const { agent_id, current_password, new_password, confirm_password } = req.body;

    if (!agent_id || !current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'New and confirm passwords do not match' });
    }

    const agent = await AgentModel.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const isMatch = await bcrypt.compare(current_password, agent.agent_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    agent.agent_password = await bcrypt.hash(new_password, 10);
    agent.password_change_required = true;
    agent.password_changed_at = new Date(); // ✅ Update password changed timestamp

    await agent.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Change password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});



// GET Wallet by Agent ID
agentRouter.get("/wallet/:agent_id", async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    const wallet = await WalletModel.findOne({ where: { agent_id } });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    return res.json(wallet);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// POST Create or Update Wallet
agentRouter.post("/wallet/upsert", async (req: any, res: any) => {
  const { agent_id, total_earnings, total_withdrawn } = req.body;

  try {
    const wallet_id = `WLT${Date.now()}`;
    const [wallet, created] = await WalletModel.upsert({
      wallet_id,
      agent_id,
      total_earnings,
      total_withdrawn,
      current_balance: total_earnings - total_withdrawn,
      last_updated: new Date(),
    });

    return res.json({ message: created ? "Wallet created" : "Wallet updated", wallet });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});


// GET All Withdrawal Requests or by Agent ID
agentRouter.get("/withdrawals", async (req: any, res: any) => {
  const { agent_id } = req.query;

  try {
    const whereClause = agent_id ? { agent_id } : {};
    const requests = await WithdrawalRequestModel.findAll({ where: whereClause });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// POST Create Withdrawal Request
agentRouter.post("/withdrawals", async (req: any, res: any) => {
  const { agent_id, amount } = req.body;

  try {
    const wallet = await WalletModel.findOne({ where: { agent_id } });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (amount > wallet.current_balance)
      return res.status(400).json({ message: "Insufficient wallet balance" });

    const request_id = `WRQ${Date.now()}`;
    const newRequest = await WithdrawalRequestModel.create({
      request_id,
      agent_id,
      amount,
      status: "pending",
      request_date: new Date(),
    });

    return res.status(201).json({ message: "Withdrawal request submitted", data: newRequest });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// PUT Approve or Reject Withdrawal Request
agentRouter.put("/withdrawals/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    const request = await WithdrawalRequestModel.findByPk(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (status === "approved") {
      const wallet = await WalletModel.findOne({ where: { agent_id: request.agent_id } });
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });

      wallet.total_withdrawn += request.amount;
      wallet.current_balance -= request.amount;
      wallet.last_updated = new Date();
      await wallet.save();
    }

    request.status = status;
    request.remarks = remarks || null;
    request.approved_date = new Date();
    await request.save();

    return res.json({ message: `Request ${status}`, data: request });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /assigned-bookings/:agent_id
 * Fetch all bookings assigned to a specific agent
 */
agentRouter.get("/assigned-bookings/:agent_id", async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    const assignedBookings = await AssignedTasksModel.findAll({
      where: { agent_id },
      include: [
        {
          model: BookingHistoryModel,
          as: "bookingHistory",
          include: [
            { model: PujaModel, as: "bookedPuja" },
            { model: PujaPackagesModel, as: "bookedPackage" },
            { model: UserModel, as: "user" }
          ]
        }
      ],
    });

    if (assignedBookings.length === 0) {
      return res.status(404).json({ message: "No bookings assigned to this agent." });
    }

    return res.json({ assignedBookings });
  } catch (error) {
    console.error("Error fetching bookings for agent:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

/**
 * PUT /upload-task-media/:booking_id/:agent_id
 * Upload completed image & video to S3 and update booking + task status
 */
agentRouter.put(
  "/upload-task-media/:booking_id/:agent_id",
  upload.fields([
    { name: "completed_image", maxCount: 1 },
    { name: "completed_video", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    const { booking_id, agent_id } = req.params;
    const { task_status, puja_status } = req.body;
    const files = req.files as {
      completed_image?: Express.MulterS3.File[];
      completed_video?: Express.MulterS3.File[];
    };

    try {
      // Update AssignedTasks
      const task = await AssignedTasksModel.findOne({ where: { booking_id, agent_id } });
      if (!task) return res.status(404).json({ message: "Assigned task not found" });

      task.task_status = task_status || task.task_status;
      await task.save();

      // Update BookingHistory
      const booking = await BookingHistoryModel.findByPk(booking_id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (puja_status) booking.puja_status = puja_status;
      if (files.completed_image) booking.completed_image_url_path = files.completed_image[0].location;
      if (files.completed_video) booking.completed_video_url_path = files.completed_video[0].location;

      await booking.save();

      return res.status(200).json({
        message: "Upload & update successful",
        task,
        booking,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "Server error", error });
    }
  }
);


agentRouter.put('/update-availability/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const { available_status } = req.body;

  if (typeof available_status !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing available_status (must be true or false)',
    });
  }

  try {
    const agent = await AgentModel.findByPk(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    agent.available_status = available_status;
    await agent.save();

    return res.status(200).json({
      success: true,
      message: 'Agent availability updated successfully',
      data: { agent_id: agent.agent_id, available_status: agent.available_status },
    });
  } catch (error) {
    console.error('Error updating agent availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update agent availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


agentRouter.put('/update-agent/:agentId', async (req: any, res: any) => {
  const agentId = req.params.agentId;  // Extract agentId from route parameters

  console.log('Received PUT request for agent ID:', agentId); // Log to check if the route is being accessed

  // Destructure the request body
  const {
    agent_name,
    gender,
    phone_number,
    dateofbirth,
    address,
    aadhaarnumber,
    pannumber,
    bankaccount_number,
    ifsccode,
    branch,
    account_holder_name,
    account_type,
  } = req.body;

  try {
    // Find the agent by ID in the database
    const agent = await AgentModel.findOne({
      where: { agent_id: agentId },
    });

    // If agent not found, return a 404 error
    if (!agent) {
      console.log(`Agent with ID ${agentId} not found`);  // Log if agent is not found
      return res.status(404).json({ message: 'Agent not found' });
    }

    console.log('Agent found:', agent); // Log agent details to verify

    // Prepare the update data object
    const updateData: Partial<{
      agent_name: string;
      gender: string;
      phone_number: string;
      dateofbirth: Date;
      address: string;
      aadhaarnumber: string;
      pannumber: string;
      bankaccount_number: string;
      ifsccode: string;
      branch: string;
      account_holder_name: string;
      account_type: string;
    }> = {};

    // Only update fields that are provided in the request body
    if (agent_name) updateData.agent_name = agent_name;
    if (gender) updateData.gender = gender;
    if (phone_number) updateData.phone_number = phone_number;
    if (address) updateData.address = address;
    if (aadhaarnumber) updateData.aadhaarnumber = aadhaarnumber;
    if (pannumber) updateData.pannumber = pannumber;
    if (bankaccount_number) updateData.bankaccount_number = bankaccount_number;
    if (ifsccode) updateData.ifsccode = ifsccode;
    if (branch) updateData.branch = branch;
    if (account_holder_name) updateData.account_holder_name = account_holder_name;
    if (account_type) updateData.account_type = account_type;

    // Ensure dateofbirth is handled correctly as a Date type
    if (dateofbirth) {
      updateData.dateofbirth = new Date(dateofbirth); // Convert string to Date object
    }

    console.log('Update Data:', updateData); // Log the data to be updated

    // Perform the update on the agent record
    await agent.update(updateData);

    console.log('KYC details updated successfully'); // Log success message

    // Return success response
    return res.status(200).json({ message: 'KYC details updated successfully' });
  } catch (error) {
    // Log the full error to the console for debugging
    if (error instanceof Error) {
      console.error('Error updating agent details:', error.message);
    } else {
      console.error('Error updating agent details:', error);
    }
    if (error instanceof Error) {
      console.error('Stack Trace:', error.stack);
    } else {
      console.error('Stack Trace: Unknown error type');
    }
    
    // Return a generic error message to the client
    return res.status(500).json({ 
      message: 'Error updating KYC details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});


agentRouter.put(
  '/update-profile-image/:agent_id',
  upload.single('profile_image'),
  async (req: any, res: any) => {
    try {
      const { agent_id } = req.params;

      if (!req.file || !req.file.location) {
        return res.status(400).json({ message: 'Image upload failed' });
      }

      const agent = await AgentModel.findByPk(agent_id);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      // Update profile image URL in DB
      agent.agent_profile_image_url = req.file.location;
      await agent.save();

      res.status(200).json({
        message: 'Profile image updated successfully',
        profileImageUrl: req.file.location,
      });
    } catch (err) {
      console.error('Profile image update error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Route to fetch earnings data for an agent
agentRouter.get('/earnings/:agentId', async (req: any, res: any) => {
  const agentId = req.params.agentId;

  try {
    // Fetch the wallet details for the agent
    const wallet = await WalletModel.findOne({
      where: { agent_id: agentId },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found for the agent.' });
    }

    // Example of calculating monthly earnings and withdrawable amount
    const assignedTasks = await AssignedTasksModel.findAll({
      where: {
        agent_id: agentId,
        task_status: { [Op.in]: ['completed', 'pending'] },
      },
    });

    const thisMonthEarnings = assignedTasks.reduce((total, task) => {
      return total + task.agent_commission;
    }, 0);

    const earningsData = {
      total: wallet.total_earnings,
      thisMonth: thisMonthEarnings,
      withdrawable: wallet.current_balance,
      transactions: assignedTasks.map((task) => ({
        id: task.booking_id,
        title: `Commission for Booking ${task.booking_id}`,
        amount: task.agent_commission,
        type: 'earning',
        status: task.task_status,
        date: new Date(task.createdAt).toLocaleDateString(),
      })),
    };

    return res.json(earningsData);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return res.status(500).json({ message: 'Error fetching earnings data.' });
  }
});


// Route to get all-time earnings, monthly earnings, total withdrawn and available balance
agentRouter.get('/wallet/:agent_id', async (req: any, res: any) => {
  try {
    const agent_id = req.params.agent_id;

    // Fetch the wallet information for the given agent
    const wallet = await WalletModel.findOne({
      where: {
        agent_id,
      },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found for this agent.' });
    }

    // Total earnings, total withdrawn, and current balance
    const allTimeEarnings = wallet.total_earnings;
    const totalWithdrawn = wallet.total_withdrawn;
    const availableBalance = wallet.current_balance;

    // Fetch monthly earnings (you can adjust this based on your data model)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); // Get the start of the current month

    const monthlyEarnings = await WalletModel.sum('total_earnings', {
      where: {
        agent_id,
        last_updated: {
          [Op.gte]: currentMonthStart,
        },
      },
    });

    return res.status(200).json({
      agent_id,
      allTimeEarnings,
      totalWithdrawn,
      availableBalance,
      monthlyEarnings: monthlyEarnings || 0,  // Default to 0 if no earnings for the month
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return res.status(500).json({ message: 'An error occurred while fetching wallet data.' });
  }
});



// Create a withdrawal request
agentRouter.post("/request-withdrawal", async (req: any, res: any) => {
  const { agent_id, amount, remarks } = req.body;

  // Check if the agent exists and has enough balance
  const wallet = await WalletModel.findOne({
    where: { agent_id },
  });

  if (!wallet) {
    return res.status(404).json({ message: "Agent not found" });
  }

  // Check if the agent has enough balance
  if (amount > wallet.current_balance) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  try {
    // Create the withdrawal request
    const newWithdrawalRequest = await WithdrawalRequestModel.create({
      agent_id,
      amount,
      status: "pending",
      request_date: new Date(),
      remarks: remarks || null,
    });

    // Optionally, you can deduct the requested amount from the current balance in the wallet
    wallet.current_balance -= amount;
    await wallet.save();

    return res.status(201).json({
      message: "Withdrawal request created successfully",
      withdrawalRequest: newWithdrawalRequest,
    });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return res.status(500).json({ message: "An error occurred while creating the withdrawal request" });
  }
});

// Get all withdrawal requests for an agent
agentRouter.get("/withdrawals/:agent_id", async (req: any, res: any) => {
  const agent_id = req.params.agent_id;

  try {
    // Fetch all withdrawal requests for the agent
    const withdrawalRequests = await WithdrawalRequestModel.findAll({
      where: { agent_id },
    });

    if (withdrawalRequests.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found for this agent" });
    }

    return res.status(200).json(withdrawalRequests);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return res.status(500).json({ message: "An error occurred while fetching withdrawal requests" });
  }
});

// Update the status of a withdrawal request (approved or rejected)
agentRouter.put("/withdrawal/:request_id", async (req: any, res: any) => {
  const { request_id } = req.params;
  const { status, remarks } = req.body;

  try {
    const withdrawalRequest = await WithdrawalRequestModel.findOne({
      where: { request_id },
    });

    if (!withdrawalRequest) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    // Update the status and remarks of the request
    withdrawalRequest.status = status;
    withdrawalRequest.remarks = remarks || withdrawalRequest.remarks;

    if (status === "approved") {
      withdrawalRequest.approved_date = new Date();
    } else if (status === "rejected") {
      withdrawalRequest.approved_date = null;
    }

    await withdrawalRequest.save();

    return res.status(200).json({
      message: "Withdrawal request updated successfully",
      withdrawalRequest,
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    return res.status(500).json({ message: "An error occurred while updating the withdrawal request" });
  }
});

// Fetch commission and withdrawal history
agentRouter.get("/withdrawal-history/:agent_id", async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    // Fetch withdrawal requests for the given agent
    const withdrawalRequests = await WithdrawalRequestModel.findAll({
      where: {
        agent_id,
      },
      include: [
        {
          model: BookingHistoryModel,
          as: "bookingHistory",
          attributes: ["booking_id", "puja_name", "puja_date"], // Include booking details
        },
      ],
    });

    if (withdrawalRequests.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found for this agent" });
    }

    // Map the response to include relevant commission and status details
    const withdrawalHistory = withdrawalRequests.map((request: any) => {
      return {
        request_id: request.request_id,
        agent_id: request.agent_id,
        amount: request.amount,
        status: request.status,
        request_date: request.request_date,
        approved_date: request.approved_date,
        remarks: request.remarks,
        booking_details: {
          booking_id: request.bookingHistory.booking_id,
          puja_name: request.bookingHistory.puja_name,
          puja_date: request.bookingHistory.puja_date,
        },
      };
    });

    return res.status(200).json({
      message: "Withdrawal history fetched successfully",
      withdrawalHistory,
    });
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    return res.status(500).json({ message: "An error occurred while fetching withdrawal history" });
  }
});

// Fetch commission history for an agent (completed tasks with commission details)
agentRouter.get("/commission-history/:agent_id", async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    // Fetch commission details from the AssignedTasksModel for the given agent
    const assignedTasks = await AssignedTasksModel.findAll({
      where: {
        agent_id,
        task_status: "completed", // Only consider completed tasks
      },
      include: [
        {
          model: BookingHistoryModel,
          as: "bookingHistory",
          attributes: ["booking_id", "puja_name", "puja_date"], // Include booking details
        },
      ],
    });

    if (assignedTasks.length === 0) {
      return res.status(404).json({ message: "No commission history found for this agent" });
    }

    // Map the response to include relevant commission and task details
    const commissionHistory = assignedTasks.map((task: any) => {
      return {
        booking_id: task.booking_id,
        agent_id: task.agent_id,
        task_status: task.task_status,
        commission_amount: task.agent_commission,
        booking_details: {
          booking_id: task.bookingHistory.booking_id,
          puja_name: task.bookingHistory.puja_name,
          puja_date: task.bookingHistory.puja_date,
        },
      };
    });

    return res.status(200).json({
      message: "Commission history fetched successfully",
      commissionHistory,
    });
  } catch (error) {
    console.error("Error fetching commission history:", error);
    return res.status(500).json({ message: "An error occurred while fetching commission history" });
  }
});


agentRouter.get("/agent-bank-details/:agent_id", async (req: any, res: any) => {
  const { agent_id } = req.params;

  try {
    // Fetch the agent details
    const agent = await AgentModel.findOne({
      where: {
        agent_id,
      },
      attributes: [
        "agent_id",
        "account_holder_name",
        "bankaccount_number",
        "ifsccode",
        "branch",
        "account_type",
      
      ],
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    return res.status(200).json({
      message: "Agent bank details fetched successfully",
      bankDetails: {
        account_holder_name: agent.account_holder_name,
        bankaccount_number: agent.bankaccount_number,
        ifsccode: agent.ifsccode,
        branch: agent.branch,
        account_type: agent.account_type,
      },
    });
  } catch (error) {
    console.error("Error fetching agent bank details:", error);
    return res.status(500).json({ message: "An error occurred while fetching agent bank details" });
  }
});
agentRouter.get("/withdrawals/:agent_id", async (req: any, res: any) => {
  const agent_id = req.params.agent_id;

  try {
    // Fetch all withdrawal requests for the agent
    const withdrawalRequests = await WithdrawalRequestModel.findAll({
      where: { agent_id },
    });

    if (withdrawalRequests.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found for this agent" });
    }

    return res.status(200).json(withdrawalRequests);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return res.status(500).json({ message: "An error occurred while fetching withdrawal requests" });
  }
});



agentRouter.get('/wallet-summary/:agentId', async (req: any, res: any) => {
  const { agentId } = req.params;

  try {
    // 1. Get Wallet Info
    const wallet = await WalletModel.findOne({ where: { agent_id: agentId } });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // 2. Calculate total withdrawn (only approved)
    const approvedWithdrawals = await WithdrawalRequestModel.findAll({
      where: {
        agent_id: agentId,
        status: 'approved',
      },
      attributes: ['amount'],
      raw: true,
    });

    const totalWithdrawn = approvedWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount.toString()),
      0
    );

    // 3. Monthly-wise Commission Earnings
    const monthlyEarnings = await AssignedTasksModel.findAll({
      where: { agent_id: agentId },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('created')), 'month'],
        [fn('SUM', col('agent_commission')), 'total_earnings'],
      ],
      group: [fn('DATE_TRUNC', 'month', col('created'))],
      order: [[literal('month'), 'DESC']],
      raw: true,
    }).then((data) =>
      data.map((item) => ({
        ...item,
        total_earnings: parseFloat((item as any).total_earnings).toFixed(2),
      }))
    );

    // 4. Commission History with Booking ID and Puja Name
    const commissionHistory = await AssignedTasksModel.findAll({
      where: { agent_id: agentId },
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          attributes: ['booking_id', 'puja_name'],
        },
      ],
      attributes: ['task_status', 'agent_commission', 'created'],
      order: [['created', 'DESC']],
    });

    // 5. Flat Withdrawal History (all statuses)
    const withdrawalsHistory = await WithdrawalRequestModel.findAll({
      where: { agent_id: agentId },
      order: [['request_date', 'DESC']],
    });

    // 6. Final Computed Values
    const totalEarnings = parseFloat(wallet.total_earnings.toString());
    const availableBalance = totalEarnings - totalWithdrawn;

    // 7. Response
    return res.json({
      walletSummary: {
        totalEarnings: totalEarnings.toFixed(2),
        totalWithdrawn: totalWithdrawn.toFixed(2),
        availableBalance: availableBalance.toFixed(2),
        lastUpdated: wallet.last_updated,
      },
      monthlyEarnings,
      commissionHistory,
      withdrawalsHistory,
    });
  } catch (error) {
    console.error('❌ Error fetching wallet summary:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});



export default agentRouter;
