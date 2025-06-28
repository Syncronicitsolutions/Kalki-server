import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure


interface KaranaDurationsAttributes {
    id: number;
    number: number;
    name: string;
    karana_left_percentage?: number;
    completion: string;
    date_observed: string;
  }
  
  export interface KaranaDurationsInput extends Optional<KaranaDurationsAttributes, "id"> {}
  export interface KaranaDurationsOutput extends Required<KaranaDurationsAttributes> {}
  
  class KaranaDurationsModel
    extends Model<KaranaDurationsAttributes, KaranaDurationsInput>
    implements KaranaDurationsAttributes
  {
    public id!: number;
    public number!: number;
    public name!: string;
    public karana_left_percentage?: number;
    public completion!: string;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  KaranaDurationsModel.init(
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
      karana_left_percentage: {
        type: DataTypes.FLOAT,
        allowNull: true, // Optional field
      },
      completion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: "karana_durations",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default KaranaDurationsModel;
  