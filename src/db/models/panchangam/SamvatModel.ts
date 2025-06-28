import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure

interface SamvatInfoAttributes {
    id: number;
    status: string;
    timestamp: string;
    saka_salivahana_number: number;
    saka_salivahana_name_number: number;
    saka_salivahana_year_name: string;
    vikram_chaitradi_number: number;
    vikram_chaitradi_name_number: number;
    vikram_chaitradi_year_name: string;
    date_observed: string;
  }
  
  export interface SamvatInfoInput extends Optional<SamvatInfoAttributes, "id"> {}
  export interface SamvatInfoOutput extends Required<SamvatInfoAttributes> {}
  
  class SamvatInfoModel
    extends Model<SamvatInfoAttributes, SamvatInfoInput>
    implements SamvatInfoAttributes
  {
    public id!: number;
    public status!: string;
    public timestamp!: string;
    public saka_salivahana_number!: number;
    public saka_salivahana_name_number!: number;
    public saka_salivahana_year_name!: string;
    public vikram_chaitradi_number!: number;
    public vikram_chaitradi_name_number!: number;
    public vikram_chaitradi_year_name!: string;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  SamvatInfoModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      saka_salivahana_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saka_salivahana_name_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saka_salivahana_year_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      vikram_chaitradi_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vikram_chaitradi_name_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vikram_chaitradi_year_name: {
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
      tableName: "samvat_info",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default SamvatInfoModel;
  