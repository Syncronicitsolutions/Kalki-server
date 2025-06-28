import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure

// Define the attributes for the TithiDurations model
interface TithiDurationsAttributes {
  id: number;
  number: number;
  name: string;
  paksha: string; // Paksha (Krishna or Shukla)
  completes_at: string; // Use string to store the date-time from API as a string
  left_precentage: number; // The remaining percentage of time
  date_observed: string; // Store the date when the data was observed
}

// Define the input type for optional fields
export interface TithiDurationsInput extends Optional<TithiDurationsAttributes, "id"> {}

// Define the output type for required fields
export interface TithiDurationsOutput extends Required<TithiDurationsAttributes> {}

class TithiDurationsModel
  extends Model<TithiDurationsAttributes, TithiDurationsInput>
  implements TithiDurationsAttributes
{
  public id!: number;
  public number!: number;
  public name!: string;
  public paksha!: string;
  public completes_at!: string; // Store the completion time as a string
  public left_precentage!: number;
  public date_observed!: string; // Store the observation date as a string

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
TithiDurationsModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    paksha: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    completes_at: {
      type: DataTypes.STRING, // Store the completion date-time as string
      allowNull: false,
    },
    left_precentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date_observed: {
      type: DataTypes.STRING, // Store the observation date as string
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "tithi_durations", // Ensure this matches the actual table name in your DB
    timestamps: true, // Enable createdAt and updatedAt columns
    createdAt: "created", // Map Sequelize's `createdAt` to `created`
    updatedAt: "updated", // Map Sequelize's `updatedAt` to `updated`
    underscored: true, // Optionally use snake_case for column names
  }
);

export default TithiDurationsModel;
export { TithiDurationsAttributes };
