import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface VarjyamAttributes {
    id: number;
    date_observed: string; // Store the date when the data was observed
    startsAt: Date;
    endsAt: Date;
  }
  
  export interface VarjyamInput extends Optional<VarjyamAttributes, 'id'> {}
  export interface VarjyamOutput extends Required<VarjyamAttributes> {}
  
  class VarjyamModel
    extends Model<VarjyamAttributes, VarjyamInput>
    implements VarjyamAttributes
  {
    public id!: number;
    public date_observed!: string; // Store the observation date as a string
    public startsAt!: Date;
    public endsAt!: Date;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  VarjyamModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: 'varjyam',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default VarjyamModel;
  