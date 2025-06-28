import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import based on your project structure

interface AayanamAttributes {
    id: number;
    aayanam: string;
    date_observed: string;
  }
  
  export interface AayanamInput extends Optional<AayanamAttributes, "id"> {}
  export interface AayanamOutput extends Required<AayanamAttributes> {}
  
  class AayanamModel
    extends Model<AayanamAttributes, AayanamInput>
    implements AayanamAttributes
  {
    public id!: number;
    public aayanam!: string;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  AayanamModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      aayanam: {
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
      tableName: "aayanam",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: true,
    }
  );
  
  export default AayanamModel;
  