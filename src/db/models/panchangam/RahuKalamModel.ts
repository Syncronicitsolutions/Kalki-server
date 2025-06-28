import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure


interface RahuKalamAttributes {
    id: number;
    date_observed: string;
    startsAt: Date;
    endsAt: Date;
  }
  
  export interface RahuKalamInput extends Optional<RahuKalamAttributes, 'id'> {}
  export interface RahuKalamOutput extends Required<RahuKalamAttributes> {}
  
  class RahuKalamModel
    extends Model<RahuKalamAttributes, RahuKalamInput>
    implements RahuKalamAttributes
  {
    public id!: number;
    public date_observed!: string;
    public startsAt!: Date;
    public endsAt!: Date;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  RahuKalamModel.init(
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
      tableName: 'rahu_kalam',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default RahuKalamModel;
  