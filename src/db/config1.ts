import { Dialect, Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

function getConnection() {
  // Use environment variables for database credentials with default values
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'default_db_name',      // Default if undefined
    process.env.DB_USER || 'default_user',        // Default if undefined
    process.env.DB_PASSWORD || 'default_password',// Default if undefined
    {
      host: process.env.DB_HOST || 'localhost',   // Default if undefined
      port: parseInt(process.env.DB_PORT || '5432', 10), // Default if undefined
      dialect: (process.env.DB_DIALECT as Dialect) || 'postgres', // Default if undefined
      logging: false
    }
  );

  // Test connection
  sequelize.authenticate()
    .then(() => {
      console.log('Database connected successfully.');
    })
    .catch((error) => {
      console.error('Unable to connect to the database:', error);
      process.exit(1); // Exit the process if the connection fails
    });

  return sequelize;
}

const sequelizeConnection = getConnection();

sequelizeConnection.sync({ force: false }).then(() => {
  console.log('Database sync complete!');
}).catch((error) => {
  console.error('Error syncing database:', error);
});

export default sequelizeConnection;
