import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface AmritKaalAttributes {
    id: number;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface AmritKaalInput extends Optional<AmritKaalAttributes, 'id'> {}
  export interface AmritKaalOutput extends Required<AmritKaalAttributes> {}
  
  class AmritKaalModel
    extends Model<AmritKaalAttributes, AmritKaalInput>
    implements AmritKaalAttributes
  {
    public id!: number;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  AmritKaalModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
      tableName: 'amrit_kaal',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default AmritKaalModel;
  