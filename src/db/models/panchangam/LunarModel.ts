import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure


interface LunarMonthInfoAttributes {
    id: number;
    lunar_month_number: number;
    lunar_month_name: string;
    lunar_month_full_name: string;
    adhika: number;
    nija: number;
    kshaya: number;
    date_observed: string;
  }
  
  export interface LunarMonthInfoInput extends Optional<LunarMonthInfoAttributes, "id"> {}
  export interface LunarMonthInfoOutput extends Required<LunarMonthInfoAttributes> {}
  
  class LunarMonthInfoModel
    extends Model<LunarMonthInfoAttributes, LunarMonthInfoInput>
    implements LunarMonthInfoAttributes
  {
    public id!: number;
    public lunar_month_number!: number;
    public lunar_month_name!: string;
    public lunar_month_full_name!: string;
    public adhika!: number;
    public nija!: number;
    public kshaya!: number;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  LunarMonthInfoModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      lunar_month_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lunar_month_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lunar_month_full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      adhika: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nija: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kshaya: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: "lunar_month_info",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default LunarMonthInfoModel;
  