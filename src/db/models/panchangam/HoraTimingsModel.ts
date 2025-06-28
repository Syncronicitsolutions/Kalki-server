import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface HoraTimingsAttributes {
    id: number;
    lord: string;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface HoraTimingsInput extends Optional<HoraTimingsAttributes, 'id'> {}
  export interface HoraTimingsOutput extends Required<HoraTimingsAttributes> {}
  
  class HoraTimingsModel
    extends Model<HoraTimingsAttributes, HoraTimingsInput>
    implements HoraTimingsAttributes
  {
    public id!: number;
    public lord!: string;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  HoraTimingsModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      lord: {
        type: DataTypes.STRING(255),
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
      date_observed: {
        type: DataTypes.STRING, // Store the observation date as string
        allowNull: false,
      },
    },
    {
      sequelize: sequelizeConnection,
      tableName: 'hora_timings',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default HoraTimingsModel;
  