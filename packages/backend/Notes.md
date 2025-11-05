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
