import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface AbhijitMuhuratAttributes {
    id: number;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface AbhijitMuhuratInput extends Optional<AbhijitMuhuratAttributes, 'id'> {}
  export interface AbhijitMuhuratOutput extends Required<AbhijitMuhuratAttributes> {}
  
  class AbhijitMuhuratModel
    extends Model<AbhijitMuhuratAttributes, AbhijitMuhuratInput>
    implements AbhijitMuhuratAttributes
  {
    public id!: number;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  AbhijitMuhuratModel.init(
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
      tableName: 'abhijit_muhurat',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default AbhijitMuhuratModel;
  