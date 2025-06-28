import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // adjust path if needed

// Step 1: Define Attributes
interface FeedbacksAttributes {
  feedback_id: number;
  username: string;
  email: string | null;
  rating: number;
  message: string | null;
}

// Step 2: Define Input and Output types
export interface FeedbacksInput
  extends Optional<FeedbacksAttributes, "feedback_id" | "email" | "message"> {}

export interface FeedbacksOutput extends Required<FeedbacksAttributes> {}

// Step 3: Define Sequelize Model
class FeedbacksModel
  extends Model<FeedbacksAttributes, FeedbacksInput>
  implements FeedbacksAttributes
{
  public feedback_id!: number;
  public username!: string;
  public email!: string | null;
  public rating!: number;
  public message!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Step 4: Init Model
FeedbacksModel.init(
  {
    feedback_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "feedbacks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, 
    underscored: true,
  }
);

export default FeedbacksModel;
