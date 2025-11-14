import {Sequelize} from 'sequelize';
import {config} from './env.js';

/**
 * Sequelize instance configuration
 * 
 * Sequelize is the ORM that translates our TypeScript models
 * into SQL queries for PostgreSQL
 */
export const sequelize= new Sequelize(config.database.url,{
    dialect: 'postgres',
    dialectOptions:{
        ssl:{
            require: true,
            rejectUnauthorized: false, 
        }
    },

    // Logging
    logging: false,

    // Connection pool settings
    pool:{
        max: 5, //Maximum number of connections
        min:0,  //Minimum number of connections
        acquire: 30000, //Maximum time (ms) to get connection before throwing error
        idle: 1000, //Maximum time (ms) a connection can be idle before release.
    },

    // Model definition settings
    define: {
        // Use sanke_case for database columns
        underscored: true,
        // Automatically add createdAt and UpdatedAt timestamps
        timestamps: true,
        // Don't pluralize table names
        freezeTableName: true,
    }
});

/**
 * Test database connection
 * Called on application startup
*/
export async function testConnection(): Promise<void>{
    try {
        await sequelize.authenticate();
        console.log("Database connection established successfully");
    } catch (error) {
        console.error("Unable to connect to database:", error);
    }
}

/**
 * Sync database models (development only!)
 * In production, use migrations instead
 */
export async function syncDatabase(): Promise<void>{
    if(config.env === 'development'){
        try {
            await sequelize.sync({alter: true});
            console.log("Database models synchronized");
        } catch (error) {
            console.error("Error synchronizing database: ", error);
        }
    }
}