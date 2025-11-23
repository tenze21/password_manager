for i in {1..6}; do
  curl -X POST https://password-manager-kwsp.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test$i@example.com",
      "masterPasswordHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "encryptedPrivateKey": "ZW5jcnlwdGVkLXByaXZhdGUta2V5",
      "publicKey": "cHVibGljLWtleQ==",
      "salt": "c2FsdC12YWx1ZQ=="
    }'
  echo ""
done

# 6th request should fail (429 Too Many Requests):
# {
#   "success": false,
#   "error": {
#     "code": "FORBIDDEN",
#     "message": "Too many authentication attempts, please try again later"
#   }
# }