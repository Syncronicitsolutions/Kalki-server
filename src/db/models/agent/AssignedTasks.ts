import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import AgentModel from "./AgentModel";
import BookingHistoryModel from "../bookings/BookingHistoryModel"; // Import BookingHistoryModel

interface AssignedTasksAttributes {
  booking_id: string;
  agent_id: string;
  task_status: string;
  agent_commission: number;
}

export interface AssignedTasksInput extends Optional<AssignedTasksAttributes, "booking_id" | "agent_id"> {}
export interface AssignedTasksOutput extends Required<AssignedTasksAttributes> {}

class AssignedTasksModel extends Model<AssignedTasksAttributes, AssignedTasksInput> implements AssignedTasksAttributes {
  public booking_id!: string;
  public agent_id!: string;
  public task_status!: string;
  public agent_commission!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    AssignedTasksModel.belongsTo(models.AgentModel, {
      foreignKey: 'agent_id',
      targetKey: 'agent_id',
      as: 'agentDetails',
    });
  
    AssignedTasksModel.belongsTo(models.BookingHistoryModel, {
      foreignKey: 'booking_id',
      as: 'bookingHistory',
    });
  }
  
}

AssignedTasksModel.init(
  {
    booking_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      references: {
        model: "booking_history",
        key: "booking_id",
      },
      onDelete: "CASCADE",
    },
    agent_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      references: {
        model: "agent",
        key: "agent_id",
      },
      onDelete: "CASCADE",
    },
    task_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    agent_commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      }
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "assigned_tasks",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default AssignedTasksModel;
