import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PujaModel from "./PujaModel";

// Define the attributes for the PujaDates model
interface PujaDatesAttributes {
  sr_no: number;
  puja_id: string;
  puja_date: Date;
  created_by: number | null;
}

// Define the input type for optional fields
export interface PujaDatesInput
  extends Optional<PujaDatesAttributes, "sr_no" | "created_by"> {}

// Define the output type for required fields
export interface PujaDatesOutput extends Required<PujaDatesAttributes> {}

class PujaDatesModel
  extends Model<PujaDatesAttributes, PujaDatesInput>
  implements PujaDatesAttributes
{
  public sr_no!: number;
  public puja_id!: string;
  public puja_date!: Date;
  public created_by!: number | null;

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    PujaDatesModel.belongsTo(models.PujaModel, {
      as: 'datePuja',
      foreignKey: 'puja_id'
    });
    // console.log("PujaDatesModel Associations:", PujaDatesModel.associations);
  }
}

// Initialize the model
PujaDatesModel.init(
  {
    sr_no: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    puja_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "puja", // Table name for the foreign key
        key: "puja_id", // Column in the foreign table
      },
      onDelete: "CASCADE", // Cascade deletion when parent record is deleted
    },
    puja_date: {
      type: DataTypes.DATEONLY, // DATE without time component
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "puja_dates",
    timestamps: true,
    createdAt: "created", // Map Sequelize's `createdAt` to `created`
    updatedAt: "updated", // Map Sequelize's `updatedAt` to `updated`
    underscored: true, // Use snake_case for column names
  }
);

export default PujaDatesModel;
export { PujaDatesAttributes };
