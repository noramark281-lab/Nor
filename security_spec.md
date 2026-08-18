# Firestore Security Specification

## 1. Data Invariants
- Every user can only read, create, update, and delete their own profile (`/users/{userId}`) where `userId == request.auth.uid`.
- All subcollections (`/users/{userId}/settings/{id}`, `/users/{userId}/trades/{id}`, `/users/{userId}/bot_trades/{id}`, `/users/{userId}/positions/{id}`, `/users/{userId}/dust_logs/{id}`) inherit strict ownership from the parent document path variable (`userId == request.auth.uid`).
- Unauthenticated users have no read/write access across all collections.
- Cross-user data snooping or modifying another user's trades/settings is strictly prevented by both path variable validation and owner UID verification.
- Document IDs must conform to `isValidId()` alphanumeric format with maximum length constraints to prevent resource poisoning.
- Key tampering and ghost fields on mutations are blocked via schema validation helpers.

## 2. The Dirty Dozen Payloads (Rejection Vectors)
1. **Unauthenticated Read/Write**: Anonymous or unauthenticated access attempt to `/users/{userId}`.
2. **Cross-User Snooping**: Authenticated User A attempting to read `/users/UserB/trades`.
3. **Cross-User Trade Injection**: Authenticated User A attempting to create a trade record under `/users/UserB/trades`.
4. **Identity Spoofing**: User A creating a trade in their own path but with `userId: "UserB"`.
5. **ID Poisoning / Denial of Wallet**: An attacker supplying an oversized/malicious document ID with illegal characters.
6. **Shadow Field Injection**: Inserting arbitrary fields like `isAdmin: true` into a trade or settings record.
7. **Negative or NaN Numeric Values**: Submitting negative trade amounts or corrupted price strings.
8. **Invalid Enum Types**: Setting order side to `HOLD` instead of `BUY` or `SELL`.
9. **Oversized Strings**: Injecting huge strings exceeding `maxLength` (e.g., a 10KB symbol string).
10. **Immutable Field Mutation**: Trying to change the `userId` or `id` field during an update.
11. **Path Traversal / Ghost Collections**: Accessing unauthorized top-level collections outside `/users/{userId}`.
12. **Blanket Query Scraping**: Attempting a global collection group query to fetch all trades from all users.

## 3. Test Runner
Verification is enforced through unit tests and automated rules linting ensuring that all 12 attack vectors return `PERMISSION_DENIED`.
