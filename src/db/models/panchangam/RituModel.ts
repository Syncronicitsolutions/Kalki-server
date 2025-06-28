import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure

interface RituInfoAttributes {
    id: number;
    ritu_number: number;
    ritu_name: string;
    date_observed: string;
  }
  
  export interface RituInfoInput extends Optional<RituInfoAttributes, "id"> {}
  export interface RituInfoOutput extends Required<RituInfoAttributes> {}
  
  class RituInfoModel
    extends Model<RituInfoAttributes, RituInfoInput>
    implements RituInfoAttributes
  {
    public id!: number;
    public ritu_number!: number;
    public ritu_name!: string;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  RituInfoModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      ritu_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ritu_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: "ritu_info",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default RituInfoModel;
  