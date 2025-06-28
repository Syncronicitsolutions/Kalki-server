import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface WithdrawalRequestAttributes {
  request_id: string;
  agent_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  request_date: Date;
  approved_date: Date | null;
  remarks: string | null;
  payment_reference: string | null; // ✅ Newly added field
}

export interface WithdrawalRequestInput extends Optional<WithdrawalRequestAttributes, "request_id"> {}
export interface WithdrawalRequestOutput extends Required<WithdrawalRequestAttributes> {}

class WithdrawalRequestModel extends Model<WithdrawalRequestAttributes, WithdrawalRequestInput>
  implements WithdrawalRequestAttributes {
  public request_id!: string;
  public agent_id!: string;
  public amount!: number;
  public status!: "pending" | "approved" | "rejected";
  public request_date!: Date;
  public approved_date!: Date | null;
  public remarks!: string | null;
  public payment_reference!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    WithdrawalRequestModel.belongsTo(models.AgentModel, {
      foreignKey: "agent_id",
      as: "agent",
    });
  }
}

WithdrawalRequestModel.init(
  {
    request_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    agent_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    request_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "withdrawal_requests",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default WithdrawalRequestModel;
