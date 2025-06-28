import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../../config';

interface CommissionHistoryAttributes {
  id: number;
  agent_id: string;
  booking_id: string;
  amount: number;
  source: string; // e.g., "puja completed"
  created_at?: Date;
}

export interface CommissionHistoryInput extends Optional<CommissionHistoryAttributes, 'id'> {}
export interface CommissionHistoryOutput extends Required<CommissionHistoryAttributes> {}

class CommissionHistoryModel
  extends Model<CommissionHistoryAttributes, CommissionHistoryInput>
  implements CommissionHistoryAttributes {
  public id!: number;
  public agent_id!: string;
  public booking_id!: string;
  public amount!: number;
  public source!: string;

  public readonly created_at!: Date;
}

CommissionHistoryModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    agent_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'puja completed',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: 'commission_history',
    timestamps: false,
    underscored: true,
  }
);

export default CommissionHistoryModel;
