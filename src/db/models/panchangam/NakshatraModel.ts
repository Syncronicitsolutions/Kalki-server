import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

// Define the attributes for the NakshatraDurations model
interface NakshatraDurationsAttributes {
  id: number;
  number: number;
  name: string;
  starts_at: string; // Use string to store the date-time from API as a string
  ends_at: string; // Use string to store the date-time from API as a string
  remaining_percentage_at_given_time: number;
  date_observed: string; // Store the date when the data was observed
}

// Define the input type for optional fields
export interface NakshatraDurationsInput
  extends Optional<NakshatraDurationsAttributes, "id"> {}

// Define the output type for required fields
export interface NakshatraDurationsOutput
  extends Required<NakshatraDurationsAttributes> {}

class NakshatraDurationsModel
  extends Model<NakshatraDurationsAttributes, NakshatraDurationsInput>
  implements NakshatraDurationsAttributes
{
  public id!: number;
  public number!: number;
  public name!: string;
  public starts_at!: string; // Store the date-time as a string
  public ends_at!: string; // Store the date-time as a string
  public remaining_percentage_at_given_time!: number;
  public date_observed!: string; // Store the observation date as a string

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
NakshatraDurationsModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    starts_at: {
      type: DataTypes.STRING, // Store received date-time as string
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.STRING, // Store received date-time as string
      allowNull: false,
    },
    remaining_percentage_at_given_time: {
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
    tableName: "nakshatra_durations", // Ensure this matches the actual table name in your DB
    timestamps: true, // Enable createdAt and updatedAt columns
    createdAt: "created", // Map Sequelize's `createdAt` to `created`
    updatedAt: "updated", // Map Sequelize's `updatedAt` to `updated`
    underscored: true, // Optionally use snake_case for column names
  }
);

export default NakshatraDurationsModel;
export { NakshatraDurationsAttributes };
