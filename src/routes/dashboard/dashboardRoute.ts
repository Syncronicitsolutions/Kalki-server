// controllers/bookingsStatsController.ts

import { Request, Response } from 'express';
import BookingHistoryModel from '../../db/models/bookings/BookingHistoryModel';
import UserModel from '../../db/models/users/usersModel';
import { Op, fn, col, literal } from 'sequelize';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // ---------- Bookings Increase Comparison ----------
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthCount = await BookingHistoryModel.count({
      where: {
        created_at: {
          [Op.gte]: currentMonthStart,
          [Op.lt]: nextMonthStart,
        },
      } as any,
    });

    const lastMonthCount = await BookingHistoryModel.count({
      where: {
        created_at: {
          [Op.gte]: lastMonthStart,
          [Op.lt]: lastMonthEnd,
        },
      } as any,
    });

    const bookingChangePercent =
      lastMonthCount === 0
        ? 100
        : Math.round(
            ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100
          );

    // ---------- User Growth by Month ----------
    const userGrowth = await UserModel.findAll({
      attributes: [
        [fn('TO_CHAR', col('created'), 'Mon'), 'month'],
        [fn('COUNT', col('userid')), 'users'],
      ],
      group: [fn('TO_CHAR', col('created'), 'Mon')],
      order: [[fn('MIN', col('created')), 'ASC']],
      raw: true,
    });

    // ---------- Top Performed Pujas ----------
    const totalBookings = await BookingHistoryModel.count();

    const topPujasRaw = await BookingHistoryModel.findAll({
      attributes: [
        'puja_name',
        [fn('COUNT', col('puja_name')), 'count'],
      ],
      group: ['puja_name'],
      order: [[literal('count'), 'DESC']],
      raw: true,
      limit: 10,
    });

    const topPujas = topPujasRaw.map((p: any) => ({
      puja: p.puja_name,
      percentage: parseFloat(((p.count / totalBookings) * 100).toFixed(2)),
    }));

    // ---------- Final Response ----------
    res.status(200).json({
      success: true,
      bookingsStats: {
        currentMonth: currentMonthCount,
        lastMonth: lastMonthCount,
        percentageChange: bookingChangePercent,
      },
      userGrowth,
      topPujas,
    });
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
