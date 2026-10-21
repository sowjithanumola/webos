# Security Specification: WebOS Cloud Storage & Profile

## 1. Data Invariants
- **Identity Invariant**: Users can only access, create, update, or delete their own data under `/users/{userId}`. Any attempt to access another user's files, settings, or profile must return `PERMISSION_DENIED`.
- **Relational Integrity**: A user file under `/users/{userId}/files/{fileId}` must have `userId == request.auth.uid` and path variable `{userId} == request.auth.uid`.
- **Immutability Invariant**: `userId`, `createdAt`, and `id` must be immutable once created.
- **Payload Boundaries**: All strings have explicit length limits (`name <= 256`, `content <= 524288`, `path <= 1024`).
- **No Blanket Queries**: All `list` operations enforce `userId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Target: PERMISSION_DENIED)

1. **Unauthenticated Read**: Attempting to read `/users/user123` with `request.auth == null`.
2. **Unauthenticated Write**: Attempting to create `/users/user123/files/file1` with `request.auth == null`.
3. **Cross-Tenant File Read**: User `alice` reading `/users/bob/files/secret.txt`.
4. **Cross-Tenant File Write**: User `alice` writing to `/users/bob/files/malicious.sh`.
5. **Cross-Tenant Profile Spoof**: User `alice` attempting to overwrite `/users/bob`.
6. **Identity Tampering on File Create**: User `alice` writing to `/users/alice/files/file1` with `userId: "bob"`.
7. **Identity Mutation on Update**: User `alice` modifying existing file to change `userId: "bob"`.
8. **Junk Path ID Poisoning**: Attempting write with 2KB junk character ID as `{fileId}` or `{userId}`.
9. **Volumetric Buffer Overflow**: Attempting write with `content` exceeding 512KB.
10. **Shadow Key Injection**: Attempting file creation with unauthorized property `isAdmin: true`.
11. **Settings Cross-Tenant Update**: User `alice` setting `/users/bob/settings/system`.
12. **Settings Invalid Enum**: Attempting to set `theme: "invalid_theme"`.
