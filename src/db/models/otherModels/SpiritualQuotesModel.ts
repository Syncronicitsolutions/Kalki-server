import {
    Model,
    DataTypes,
    Optional,
    Sequelize,
  } from 'sequelize';
  import sequelizeConnection from '../../config';
  
  interface SpiritualQuoteAttributes {
    id: number;
    text: string;
    author: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
  }
  
  interface SpiritualQuoteCreationAttributes extends Optional<SpiritualQuoteAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> {}
  
  export class SpiritualQuote
    extends Model<SpiritualQuoteAttributes, SpiritualQuoteCreationAttributes>
    implements SpiritualQuoteAttributes {
    public id!: number;
    public text!: string;
    public author!: string;
    public is_active?: boolean;
    public created_at?: Date;
    public updated_at?: Date;
  }
  
  export const initSpiritualQuoteModel = (sequelize: Sequelize) => {
    SpiritualQuote.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        text: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        author: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'spiritual_quotes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  };
  