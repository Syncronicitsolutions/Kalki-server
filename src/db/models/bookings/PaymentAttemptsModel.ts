// import { DataTypes } from "sequelize";
// import sequelize from "sequelize/types/sequelize";
//  // ✅ Use the actual sequelize instance you created

// const PaymentAttemptsModel = sequelize.define("PaymentAttempts", {
//   attempt_id: {
//     type: DataTypes.STRING,
//     primaryKey: true,
//   },
//   booking_id: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   order_id: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   session_id: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   status: {
//     type: DataTypes.ENUM("pending", "success", "failed"),
//     defaultValue: "pending",
//   },
//   retry_reason: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
// }, {
//   tableName: "payment_attempts",
//   timestamps: true,
// });

// export default PaymentAttemptsModel;
