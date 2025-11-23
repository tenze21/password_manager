for i in {1..6}; do
    echo "Attempt $i:"
    curl -X POST https://password-manager-kwsp.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "masterPasswordHash": "hashedhashhashedhashhashed1234567811"
    }'
  echo -e "\n"
done

# After fifth attempt account should be locked
# {
#   "success": false,
#   "error": {
#     "code": "ACCOUNT_LOCKED",
#     "message": "Account locked. Try again in 15 minutes"
#   }
# }