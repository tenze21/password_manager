# Dependencies

## Core:
- **express**: web framework
- **sequelize**: ORM for postgresSQL
- **pg**: postgres driver
- **@password_manager/shared**: Our shared types (`workspace:*` means latest local version)

## Security:
- **helmet**: Sets security HTTP headers
- **cors**: Cross-Origin Resource Sharing configuration
- **express-rate-limit**: Prevents brute force attacks
- **jsonwebtoken**: JWT authentication

## 2FA:
- **speakeasy**: TOTP generation/verification (Google Authenticator)
- **qrcode**: Generate QR codes for TOTP setup
- **nodemailer**: Send emails (for email OTP)

## Development:
- **tsx**: Typescript execution engine (fast, no build step needed for dev).
- **sequelize-cli**: Database migration

# Models
- `CreateOptional<T>:`
    - Field is optional when CREATING (INSERT)
    - Field is required when READING (SELECT)
    - Used for: IDs, timestamps, default values

- `InferAttributes:` TypeScript infers what comes OUT of the database.

- `InferCreationAttributes` - TypeScript infers what goes INTO the database.

- `declare` - tells TypeScript "this property exists, but don't initialize it", Without declare, TypeScript would expect you to initialize in constructor.

- `NonAttribute<T>` - Tells Sequelize: "This is NOT a database column", Used for associations and computed properties, TypeScript allows it, but Sequelize won't create a column

- `CreateOptional<T>` vs `string | null`: 
    - `CreateOptional<T>:` optional (auto-generated), always string never undefined.
    - `string | null:` can provide string or null, can be string or null.

- **All the associations are defined in a seperate file `models/index.ts` to avoid circular dependencies.**

## Database syncing vs migration.

- **Syncing:**
    - Automatically creates or updates database tables to match your Sequelize models.
    - When you call `sequelize.sync({ force: true });` or `sequelize.sync({ alter: true });`, sequelize Creates tables if they don’t exist and (Optionally) drops or alters existing tables to match your model definitions.
    - Hence, due it's destructive nature syncing is not used in production.

- **Migration:**
    - Safely and explicitly control schema changes over time.
    - Controlled and versioned schema evolution.
    - Easy to rollback on failure.
    - Multiple developers can collaborate safely.
    - Keeps the database in sync across environments (dev, staging, prod).