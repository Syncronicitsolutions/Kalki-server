import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Adjust this import as per your file structure

interface YamaGandamAttributes {
    id: number;
    date_observed: string;
    startsAt: Date;
    endsAt: Date;
  }
  
  export interface YamaGandamInput extends Optional<YamaGandamAttributes, 'id'> {}
  export interface YamaGandamOutput extends Required<YamaGandamAttributes> {}
  
  class YamaGandamModel
    extends Model<YamaGandamAttributes, YamaGandamInput>
    implements YamaGandamAttributes
  {
    public id!: number;
    public date_observed!: string;
    public startsAt!: Date;
    public endsAt!: Date;
  
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }
  
  YamaGandamModel.init(
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
      tableName: 'yama_gandam',
      timestamps: true,
      createdAt: 'created',
      updatedAt: 'updated',
      underscored: true,
    }
  );
  
  export default YamaGandamModel;
  