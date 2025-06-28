import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

// Define the attributes for the Tracking model
interface TrackingAttributes {
  sr_no: number;
  booking_id: string; // Change booking_id to string to match booking_history model
  tracking_number: string;
  tracking_link: string | null;
  status: string;
  created_by: number;
}

// Define the input type for optional fields
export interface TrackingInput
  extends Optional<TrackingAttributes, "sr_no" | "tracking_link"> {}

// Define the output type for required fields
export interface TrackingOutput extends Required<TrackingAttributes> {}

class TrackingModel
  extends Model<TrackingAttributes, TrackingInput>
  implements TrackingAttributes
{
  public sr_no!: number;
  public booking_id!: string; // Ensure booking_id is a string to match booking_history model
  public tracking_number!: string;
  public tracking_link!: string | null;
  public status!: string;
  public created_by!: number;

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
TrackingModel.init(
  {
    sr_no: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    booking_id: {
      type: DataTypes.STRING(20), // Changed to STRING(20) to match booking_history
      allowNull: false,
      references: {
        model: "booking_history", // Table name for the foreign key
        key: "booking_id", // Column in the foreign table
      },
      onDelete: "CASCADE", // Cascade deletion when parent record is deleted
    },
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tracking_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "tracking",
    timestamps: true,
    createdAt: "created", // Map Sequelize's `createdAt` to `created`
    updatedAt: "updated", // Automatically handle createdAt and updatedAt
    underscored: true, // Use snake_case for column names
  }
);

export default TrackingModel;
export { TrackingAttributes };
