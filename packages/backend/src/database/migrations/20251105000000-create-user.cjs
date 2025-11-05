"use strict";

/**
 * Migration: Create Users Table
 *
 * Migrations are JavaScript (not TypeScript) because Sequelize CLI
 * File naming: timestamp-description.js
 * Timestamp ensures correct execution order
 */

/** @type {import('sequelize-cli').Migration}*/
module.exports = {
  /**
   * Run migration (upgrade)
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },

      master_password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      encrypted_private_key: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      public_key: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      salt: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },

      locked_until: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'users_email_unique',
    });
  },
  /**
   * Rollback migration (downgrade)
   */
  async down(queryInterface, Sequelize){
    await queryInterface.dropTable('users');
  }
};
