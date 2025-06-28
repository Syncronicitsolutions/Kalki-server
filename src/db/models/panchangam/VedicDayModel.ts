import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure

interface VedicWeekdayAttributes {
    id: number;
    weekday_number: number;
    weekday_name: string;
    vedic_weekday_number: number;
    vedic_weekday_name: string;
    date_observed: string;
  }
  
  export interface VedicWeekdayInput extends Optional<VedicWeekdayAttributes, "id"> {}
  export interface VedicWeekdayOutput extends Required<VedicWeekdayAttributes> {}
  
  class VedicWeekdayModel
    extends Model<VedicWeekdayAttributes, VedicWeekdayInput>
    implements VedicWeekdayAttributes
  {
    public id!: number;
    public weekday_number!: number;
    public weekday_name!: string;
    public vedic_weekday_number!: number;
    public vedic_weekday_name!: string;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  VedicWeekdayModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      weekday_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      weekday_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      vedic_weekday_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vedic_weekday_name: {
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
      tableName: "vedic_weekday",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default VedicWeekdayModel;
  