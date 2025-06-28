import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface DurMuhuratAttributes {
    id: number;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface DurMuhuratInput extends Optional<DurMuhuratAttributes, 'id'> {}
  export interface DurMuhuratOutput extends Required<DurMuhuratAttributes> {}
  
  class DurMuhuratModel
    extends Model<DurMuhuratAttributes, DurMuhuratInput>
    implements DurMuhuratAttributes
  {
    public id!: number;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  DurMuhuratModel.init(
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
      tableName: 'dur_muhurat',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default DurMuhuratModel;
  