import axios from 'axios';
import crypto from 'crypto';

import dotenv from 'dotenv';
dotenv.config();


const CLIENT_ID = process.env.CASHFREE_CLIENT_ID!;
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET!;
const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg';
const X_API_VERSION = '2023-08-01';

// ✅ Generate unique order_id
function generateOrderId(): string {
  const random = crypto.randomBytes(6).toString('hex');
  return `ORDER_${random}`;
}

export async function createCashfreeOrder() {
  const order_id = generateOrderId();

  const requestBody = {
    order_id,
    order_amount: 10.15,
    order_currency: 'INR',
    customer_details: {
      customer_id: '7112AAA812234',
      customer_email: 'john@cashfree.com',
      customer_phone: '9908734801',
      customer_name: 'John Doe',
    },
    order_note: 'Test order from TypeScript',
    order_meta: {
      return_url: `https://yourdomain.com/thankyou?order_id=${order_id}&status={order_status}`,
      payment_methods: 'cc,dc,upi',
    },
    order_tags: {
      source: 'typescript_integration',
    },
    order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
  };

  try {
    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
        'x-api-version': X_API_VERSION,
      },
    });

    console.log('✅ Order Created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Order Creation Failed:', error?.response?.data || error.message);
    throw error;
  }
}

// Call directly (optional for CLI)
createCashfreeOrder();
