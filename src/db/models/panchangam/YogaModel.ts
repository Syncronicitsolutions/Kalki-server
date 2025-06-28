import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure


interface YogaDurationsAttributes {
    id: number;
    number: number;
    name: string;
    completion: string;
    yoga_left_percentage?: number;
    date_observed: string;
  }
  
  export interface YogaDurationsInput extends Optional<YogaDurationsAttributes, "id"> {}
  export interface YogaDurationsOutput extends Required<YogaDurationsAttributes> {}
  
  class YogaDurationsModel
    extends Model<YogaDurationsAttributes, YogaDurationsInput>
    implements YogaDurationsAttributes
  {
    public id!: number;
    public number!: number;
    public name!: string;
    public completion!: string;
    public yoga_left_percentage?: number;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  YogaDurationsModel.init(
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
      completion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      yoga_left_percentage: {
        type: DataTypes.FLOAT,
        allowNull: true, // Optional field
      },
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: "yoga_durations",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default YogaDurationsModel;
  