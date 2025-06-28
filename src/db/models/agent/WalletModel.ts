import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface WalletAttributes {
  wallet_id: string;
  agent_id: string;
  total_earnings: number;
  total_withdrawn: number;
  current_balance: number;
  last_updated: Date | null;
}

export interface WalletInput extends Optional<WalletAttributes, "wallet_id"> {}
export interface WalletOutput extends Required<WalletAttributes> {}

class WalletModel extends Model<WalletAttributes, WalletInput> implements WalletAttributes {
  public wallet_id!: string;
  public agent_id!: string;
  public total_earnings!: number;
  public total_withdrawn!: number;
  public current_balance!: number;
  public last_updated!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    WalletModel.belongsTo(models.AgentModel, {
      foreignKey: "agent_id",
      as: "agent",
    });
  }
}

WalletModel.init(
  {
    wallet_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    agent_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensures one wallet per agent
    },
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2), // Fixed from FLOAT to DECIMAL
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    total_withdrawn: {
      type: DataTypes.DECIMAL(10, 2), // Fixed from FLOAT to DECIMAL
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    current_balance: {
      type: DataTypes.DECIMAL(10, 2), // Fixed from FLOAT to DECIMAL
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Auto-set timestamp
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "wallets",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default WalletModel;
