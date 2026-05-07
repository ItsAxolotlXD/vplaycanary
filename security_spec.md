# Security Specification for vplay canary

## 1. Data Invariants
- A user profile must have a role and be protected from self-elevation.
- A video must belong to an authenticated user who is they claim to be (`userId` matches `request.auth.uid`).
- A video must have a valid non-empty title and URL.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a video for another user ID.
2. **Privilege Escalation**: Attempt to update own role to 'admin'.
3. **Ghost Field Injection**: Attempt to create a user with a hidden 'isSuperUser' field.
4. **ID Poisoning**: Attempt to use a 1MB string as a document ID.
5. **Orphaned Write**: Attempt to create a video without being authenticated.
6. **State Skip**: Attempt to delete another user's video metadata.
7. **Resource Exhaustion**: Send a 1MB title string.
8. **PII Leak**: Attempt to read all user profiles as a guest.
9. **Identity Integrity**: Update a video's `userId` to someone else's.
10. **Shadow Update**: Add a `tags` array with 10,000 items.
11. **Email Spoofing**: Login with a non-verified email and try to write (if verification is strictly required).
12. **Blanket Read**: Query all videos without any filters.

## 3. Test Runner (Draft for firestore.rules.test.ts)
```typescript
// tests to verify PERMISSION_DENIED for above payloads
```
