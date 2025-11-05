'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM type for 2FA methods
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_two_factor_settings_method" AS ENUM ('email', 'totp');
    `);
    
    await queryInterface.createTable('two_factor_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      
      method: {
        type: Sequelize.ENUM('email', 'totp'),
        allowNull: false,
      },
      
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      
      secret: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      backup_codes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    
    // Unique index on user_id (one 2FA setting per user)
    await queryInterface.addIndex('two_factor_settings', ['user_id'], {
      unique: true,
      name: 'two_factor_settings_user_id_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('two_factor_settings');
    
    // Drop ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_two_factor_settings_method";
    `);
  }
};

