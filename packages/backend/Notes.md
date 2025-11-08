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

# Database syncing vs migration.

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

## Use of different secrets for access and refresh tokens.
The use of different secrets to generate access and refresh token ensures that if an attacker compromises one  secret, they can't forge the other token type. Also:
- **Blast radius containment**: If JWT_ACCESS_SECRET leaks, attacker can't create long-lived refresh tokens
- **Defense in depth**: Two independent security layers 

# Stored user password decryption flow.
```javascript
    // CLIENT SIDE (on login)
    masterPassword (user input)
    + salt (from server) 
    → Argon2 
    → encryptionKey

    encryptionKey + encryptedPrivateKey (from server)
    → Decrypt
    → privateKey (used to decrypt vault passwords)
```

# Rate limiter
```javascript
export const authLimiter= rateLimit({
    windowMs: 15 * 60 * 1000, //15 mins
    max: 5, //5 request per window
    message: {
        success: false,
        error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Too many authentication attempts, please try again later'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, //Don't count successful requests

    handler: (req, res)=>{
        res.status(429).json({
            success: false,
            error: {
                code: ERROR_CODES.FORBIDDEN,
                message: 'Too many authentication attempts, please try again later'
            }
        });
    }
});
```
**Setting the `skipSuccessfulRequests: true` configures the rate limiter middleware to count only failed authentication attempts while ignoring successful attempts this ensures that legitimate users aren't acidentally locked out of their accounts while preventing brute force and account sniffing attacks.**

# **Security Features Implemented**

1. **Zero-knowledge architecture**
   - Client-side encryption key derivation
   - Server never sees plain passwords or encryption keys

2. **Double password hashing**
   - Client: Argon2 (memory-hard, GPU-resistant)
   - Server: bcrypt (additional security layer)

3. **JWT authentication**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Separate secrets for each token type

4. **Brute force protection**
   - Rate limiting (5 attempts per 15 min per IP)
   - Account locking (5 failed logins → 15 min lockout)
   - Timing-safe comparisons

5. **XSS/CSRF protection**
   - httpOnly cookies for refresh tokens
   - CORS configuration
   - Helmet security headers

## **Architecture Patterns**

1. **Layered architecture**
    ```
    Routes → Controllers → Services → Models → Database
    ```