import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure


interface GulikaKalamAttributes {
    id: number;
    startsAt: Date;
    endsAt: Date;
    date_observed: string;
  }
  
  export interface GulikaKalamInput extends Optional<GulikaKalamAttributes, 'id'> {}
  export interface GulikaKalamOutput extends Required<GulikaKalamAttributes> {}
  
  class GulikaKalamModel
    extends Model<GulikaKalamAttributes, GulikaKalamInput>
    implements GulikaKalamAttributes
  {
    public id!: number;
    public startsAt!: Date;
    public endsAt!: Date;
    public date_observed!: string;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  GulikaKalamModel.init(
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
      tableName: 'gulika_kalam',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default GulikaKalamModel;
  