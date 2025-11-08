for i in {1..5}; do
    echo "Attempt $i:"
    curl -X POST http://localhost:3001/api/auth/login \
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