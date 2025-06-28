import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface GoodBadTimesAttributes {
    id: number;
    type: string; // Abhijit, Amrit Kaal, Brahma Muhurat, etc.
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface GoodBadTimesInput extends Optional<GoodBadTimesAttributes, 'id'> {}
  export interface GoodBadTimesOutput extends Required<GoodBadTimesAttributes> {}
  
  class GoodBadTimesModel
    extends Model<GoodBadTimesAttributes, GoodBadTimesInput>
    implements GoodBadTimesAttributes
  {
    public id!: number;
    public type!: string;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  GoodBadTimesModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
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
      tableName: 'good_bad_times',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default GoodBadTimesModel;
  