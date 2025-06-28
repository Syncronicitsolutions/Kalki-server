import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

// Define the attributes for the AdminUsers model
interface AdminUsersAttributes {
  admin_user_id: number;
  admin_user_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
  role: string;
}

// Define the input type for optional fields
export interface AdminUsersInput
  extends Optional<AdminUsersAttributes, "admin_user_id"> {}

// Define the output type for required fields
export interface AdminUsersOutput extends Required<AdminUsersAttributes> {}

class AdminUsersModel
  extends Model<AdminUsersAttributes, AdminUsersInput>
  implements AdminUsersAttributes
{
  public admin_user_id!: number;
  public admin_user_name!: string;
  public admin_email!: string;
  public admin_phone!: string;
  public admin_password!: string;
  public role!: string;

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
AdminUsersModel.init(
  {
    admin_user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    admin_user_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    admin_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // Ensure email is unique
    },
    admin_phone: {
      type: DataTypes.STRING(20),
      allowNull: true, // Phone number is optional
    },
    admin_password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "admin_users",
    timestamps: true, // Enable timestamps to handle `createdAt` and `updatedAt`
    createdAt: "created", // Map Sequelize's `createdAt` to `created`
    updatedAt: "updated", // Map Sequelize's `updatedAt` to `updated`
    underscored: true, // Use snake_case for column names
  }
);

export default AdminUsersModel;
export { AdminUsersAttributes };
