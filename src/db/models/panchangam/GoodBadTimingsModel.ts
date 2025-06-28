import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface SpecificGoodBadTimingsAttributes {
    id: number;
    name: string;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface SpecificGoodBadTimingsInput extends Optional<SpecificGoodBadTimingsAttributes, 'id'> {}
  export interface SpecificGoodBadTimingsOutput extends Required<SpecificGoodBadTimingsAttributes> {}
  
  class SpecificGoodBadTimingsModel
    extends Model<SpecificGoodBadTimingsAttributes, SpecificGoodBadTimingsInput>
    implements SpecificGoodBadTimingsAttributes
  {
    public id!: number;
    public name!: string;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  SpecificGoodBadTimingsModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
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
      tableName: 'specific_good_bad_timings',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default SpecificGoodBadTimingsModel;
  