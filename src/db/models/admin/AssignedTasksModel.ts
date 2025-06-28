import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import BookingHistoryModel from "../../models/bookings/BookingHistoryModel";
import AgentDetailsModel from "./AgentDetailsModel";

interface AssignedTasksAttributes {
  booking_id: string;
  agent_id: number;
  task_status: string;
  agent_commission: number;
}

export interface AssignedTasksInput
  extends Optional<AssignedTasksAttributes, "booking_id" | "agent_id"> {}

export interface AssignedTasksOutput
  extends Required<AssignedTasksAttributes> {}

class AssignedTasksModel
  extends Model<AssignedTasksAttributes, AssignedTasksInput>
  implements AssignedTasksAttributes
{
  public booking_id!: string;
  public agent_id!: number;
  public task_status!: string;
  public agent_commission!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate() {
    AssignedTasksModel.belongsTo(BookingHistoryModel, {
      foreignKey: "booking_id",
      as: "booking",
    });
    AssignedTasksModel.belongsTo(AgentDetailsModel, {
      foreignKey: "agent_id",
      as: "agent",
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
      type: DataTypes.INTEGER,
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
export { AssignedTasksAttributes };
