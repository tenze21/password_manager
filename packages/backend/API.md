# **API Documentation.**
## **User Register**
- **Route:** `/api/auth/register`
- **Description:** Create new user account. Generates and Sets httpOnly refresh token.
- **Access:** Public
- **method:** `POST`
- **Body:** 
    ```JSON
    {
        "email": "alice@example.com",
        "masterPasswordHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "encryptedPrivateKey": "ZW5jcnlwdGVkLXByaXZhdGUta2V5",
        "publicKey": "cHVibGljLWtleQ==",
        "salt": "c2FsdC12YWx1ZQ=="
    }
    ```
- **Success Response:**
    ```JSON
    {
        "success": true,
        "data": {
        "user": {
            "id": "...",
            "email": "alice@example.com",
            "emailVerified": false,
            "createdAt": "...",
            "updatedAt": "..."
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "encryptedPrivateKey": "ZW5jcnlwdGVkLXByaXZhdGUta2V5",
        "salt": "c2FsdC12YWx1ZQ=="
        }
    }
    ```
- **Failure Response:**
    - **Existing user:**
        ```json
            {
                "success": false,
                "error": {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "Email already registered"
                }
            }
        ```
    - **Invalid request body:**
        ```JSON
            {
                "success": false,
                "error":{
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "details": "..."
                }
            }
        ```
    - **Rate Limit**
        ```json
            {
                "success": false,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Too many authentication attempts, please try again later"
                }
            }
        ```

## **User Login**
- **Route:** `/api/auth/login`
- **Description:** Authenticate user. Set refresh token.
- **Access:** Public
- **method:** `POST`
- **Body:**
    ```json
        {
            "email": "test@example.com",
            "masterPasswordHash": "hashedhashhashedhashhashed1234567890"
        }
    ```
- **Sucess Response:**
    ```json
        {
            "success": true,
            "data": {
                "user": { ... },
                "accessToken": "...",
                "encryptedPrivateKey": "...",
                "salt": "..."
            }
        }
    ```
- **Failure Response:**
    - **Invalid crendentials:**
        ```json
            <!-- status code: 401 -->
            {
                "success": false,
                "error":{
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password"
                }
            }
        ```
    - **Account locked:**
        ```json
            <!-- status code: 423 -->
            {
                "success": false,
                "error":{
                    "code": "ACCOUNT_LOCKED",
                    "message": "Account locked. Try again in ${minutesLeft} minutes"
                }
            }
        ```
    - **No 2FA code:**
        ```json
            <!-- status code: 403 -->
            {
                "success": false,
                "error":{
                    "code": "TWO_FACTOR_REQUIRED",
                    "message": "2FA code required"
                }
            }
        ```
    - **Rate limit:**
        ```json
            <!-- status code: 423 -->
            {
                "success": false,
                "error": {
                "code": "ACCOUNT_LOCKED",
                "message": "Account locked. Try again in 15 minutes"
                }
            }
        ```
        *Lock account for 15 mins up on 5 failed attempts within 15 minutes window.*
- **Actions:** Track failed login attempts, Lock account for 15 minutes up on 5 failed tries.

## **Get current authenticated user:**
- **Route:** `/api/auth/me`
- **Description:** Get the current authenticated user.
- **Access:** Private
- **method:** `GET`
- **Body:** N/A
- **Success Response:**
    ```json
        {
            "success":true,
            "data":{
                "user": {...}
            }
        }
    ```
- **Failure Response:**
    - **Not authenticated:**
        ```json
            <!-- status code: 401 -->
            {
                "success": false,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Not authenticated",
                }
            }
        ```
    - **No Auth Header:**
        ```json
            <!-- status code: 403 -->
            {
                "success": false,
                "error":{
                    "code": "UNAUTHORIZED",
                    "message": "No token provided"
                }
            }
        ```
    - **Invalid access token:**
        ```json
            <!-- status code: 401 -->
            {
                "success": false,
                "error": {
                    "code": "TOKEN_EXPIRED",
                    "message": "Invalid or expired"
                }
            }
        ```
    - **User not found:**
        ```json
            {
                "success": false,
                "error":{
                    "code": "UNAUTHORIZED",
                    "message": "User not found"
                }
            }
        ```

## **Logout:**
- **Route:** `/api/auth/logout`
- **Description:** Logout user.
- **Access:** Public
- **method:** `POST`
- **Body:** N/A
- **Success Response:**
    ```json
        {
            "success":true,
            "data":{
                "message":"Logged out successfully"
            }
        }
    ```