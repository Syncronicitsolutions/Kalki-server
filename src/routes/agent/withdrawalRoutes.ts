import express from 'express';
import WithdrawalRequestModel from '../../db/models/agent/WithdrawalRequestModel';
import WalletModel from '../../db/models/agent/WalletModel';
import AgentModel from '../../db/models/agent/AgentModel';


const withdrawlrouter = express.Router();

/**
 * 1. POST /agent/:agentId/request-withdrawal
 */
// Helper to generate request ID like WDL20250508153045
const generateWithdrawalId = (): string => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
  
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const MM = pad(now.getMinutes());
    const SS = pad(now.getSeconds());
  
    return `WDL${yyyy}${mm}${dd}${HH}${MM}${SS}`;
  };
  
  /**
   * POST /agent/:agentId/request-withdrawal
   */
  withdrawlrouter.post('/request-withdrawal/:agentId/', async (req: any, res: any) => {
    const { agentId } = req.params;
    const { amount } = req.body;
  
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
  
    try {
      const wallet = await WalletModel.findOne({ where: { agent_id: agentId } });
  
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  
      const withdrawAmount = parseFloat(amount);
      const currentBalance = parseFloat(wallet.current_balance.toString());
  
      if (withdrawAmount > currentBalance) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
  
      const request_id = generateWithdrawalId();
  
      const newRequest = await WithdrawalRequestModel.create({
        request_id,
        agent_id: agentId,
        amount: withdrawAmount,
        status: 'pending',
        request_date: new Date(),
        approved_date: null,
        remarks: null,
      });
  
      return res.status(201).json({
        message: 'Withdrawal request submitted',
        data: newRequest,
      });
    } catch (error) {
      console.error('❌ Error creating withdrawal request:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  });

/**
 * 2. GET /agent/:agentId/withdrawals
 */
withdrawlrouter.get('/withdrawals/:agentId/', async (req: any, res: any) => {
  const { agentId } = req.params;

  try {
    const requests = await WithdrawalRequestModel.findAll({
      where: { agent_id: agentId },
      order: [['request_date', 'DESC']],
    });

    return res.status(200).json({ data: requests });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});


withdrawlrouter.put('/withdrawals-status/:requestId', async (req: any, res: any) => {
    const { requestId } = req.params;
    const { status, remarks, payment_reference } = req.body;
  
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
  
    try {
      const request = await WithdrawalRequestModel.findByPk(requestId);
      if (!request) return res.status(404).json({ message: 'Request not found' });
  
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request already processed' });
      }
  
      // If approved, validate wallet and payment_reference
      if (status === 'approved') {
        if (!payment_reference) {
          return res.status(400).json({ message: 'Payment reference is required for approval' });
        }
  
        const wallet = await WalletModel.findOne({ where: { agent_id: request.agent_id } });
  
        if (!wallet || wallet.current_balance < request.amount) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
  
        // Deduct balance from wallet
        wallet.total_withdrawn += request.amount;
        wallet.current_balance -= request.amount;
        wallet.last_updated = new Date();
        await wallet.save();
  
        // Update payment reference
        request.payment_reference = payment_reference;
      }
  
      // Update status, remarks, and approved date
      request.status = status;
      request.remarks = remarks || null;
      request.approved_date = new Date();
      await request.save();
  
      return res.status(200).json({ message: `Request ${status}`, data: request });
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  });
  


withdrawlrouter.get('/agent-withdrawal/:requestId', async (req: any, res: any) => {
    const { requestId } = req.params;
  
    try {
      const request = await WithdrawalRequestModel.findOne({
        where: { request_id: requestId },
        include: [
          {
            model: AgentModel,
            as: 'agent',
            attributes: [
              'agent_id',
              'agent_name',
              'phone_number',
              'agent_email',
              'bankaccount_number',
              'ifsccode',
              'branch',
              'account_holder_name',
              'account_type',
            ],
          },
        ],
      });
  
      if (!request) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }
  
      return res.status(200).json({ data: request });
    } catch (error) {
      console.error('Error fetching withdrawal request:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  });
  

  withdrawlrouter.get('/all-withdrawals', async (req: any, res: any) => {
    try {
      const requests = await WithdrawalRequestModel.findAll({
        order: [['request_date', 'DESC']],
        include: [
          {
            model: AgentModel,
            as: 'agent', // Make sure this alias matches your model association
            attributes: [
              'agent_id',
              'agent_name',
              'phone_number'
            ],
          },
        ],
      });
  
      return res.status(200).json({ data: requests });
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  });

export default withdrawlrouter;
