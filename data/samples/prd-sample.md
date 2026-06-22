# Product Requirements Document (PRD)
## Feature: User Authentication & Account Management

**Product:** ShopEase — B2C E-commerce Platform  
**Version:** 2.1.0  
**Date:** 2026-06-22  
**Author:** Product Team  
**Status:** Approved for Development  
**Sprint:** Sprint 14 — Security & Auth Module

---

## 1. Overview

ShopEase requires a secure, user-friendly authentication system supporting email/password login, social sign-in (Google, Facebook), and two-factor authentication (2FA). This PRD covers the full account management lifecycle: registration, login, password reset, profile editing, and account deletion.

---

## 2. Business Objectives

- Reduce cart abandonment caused by friction in the login flow by 25%
- Achieve < 2 seconds login response time (P95)
- Meet OWASP Top 10 security standards for authentication
- Support 50,000 concurrent authenticated sessions at peak

---

## 3. User Stories

### 3.1 Registration

**US-001** — As a new visitor, I want to register with my email and password so that I can place orders.

**Acceptance Criteria:**
- Email must be unique; show error if duplicate
- Password: min 8 chars, 1 uppercase, 1 number, 1 special character
- Verification email sent within 30 seconds of registration
- Unverified accounts cannot complete checkout
- Rate-limit duplicate registration attempts (HTTP 429)

**US-002** — As a new visitor, I want to register using my Google account to skip the form.

**Acceptance Criteria:**
- Google OAuth 2.0 flow (openid, email, profile scopes)
- If Google email matches existing account, prompt to link accounts
- First-time Google users bypass email verification

---

### 3.2 Login

**US-003** — As a registered user, I want to log in with email and password.

**Acceptance Criteria:**
- Session token issued as HTTP-only, Secure, SameSite=Strict cookie
- Token expiry: 30 minutes idle, 7 days absolute
- After 5 failed attempts, lock account 15 minutes and email user
- Remember me checkbox extends expiry to 30 days

**US-004** — As a user with 2FA enabled, I want to enter a TOTP code after password login.

**Acceptance Criteria:**
- TOTP compliant with RFC 6238 (Google Authenticator compatible)
- 30-second window with 1-window grace period
- 10 single-use backup codes generated at 2FA setup
- Account recovery via email + identity verification

---

### 3.3 Password Reset

**US-005** — As a user who forgot my password, I want to reset it via email link.

**Acceptance Criteria:**
- Reset link expires after 1 hour and is single-use
- New password cannot match previous 3 passwords
- On successful reset, invalidate all active sessions
- Generic error if email not found (do not confirm account existence)

---

### 3.4 Profile Management

**US-006** — As a logged-in user, I want to edit my name, phone, and profile picture.

**Acceptance Criteria:**
- Changes saved with success notification
- Phone: E.164 format validation
- Avatar: JPEG/PNG/WEBP, max 5 MB, auto-resized 256x256 px

**US-007** — As a logged-in user, I want to permanently delete my account (GDPR).

**Acceptance Criteria:**
- Requires password confirmation
- Soft-delete 30 days, hard-delete after (GDPR Art. 17)
- Cannot delete if active orders exist — show blocking message

---

## 4. Functional Requirements

| ID    | Requirement                                                    | Priority | Sprint |
|-------|----------------------------------------------------------------|----------|--------|
| FR-01 | Email/password registration with verification email           | P0       | 14     |
| FR-02 | Google OAuth 2.0 sign-in and account linking                  | P0       | 14     |
| FR-03 | Facebook OAuth 2.0 sign-in                                    | P1       | 15     |
| FR-04 | Session management with HTTP-only cookie and refresh token    | P0       | 14     |
| FR-05 | Account lockout after 5 failed attempts (15-minute cooldown)  | P0       | 14     |
| FR-06 | TOTP-based 2FA with backup codes                              | P1       | 14     |
| FR-07 | Password reset via email link (1-hour expiry)                 | P0       | 14     |
| FR-08 | Previous password history check (last 3)                      | P1       | 14     |
| FR-09 | Profile editing: name, phone, avatar                          | P1       | 15     |
| FR-10 | GDPR account deletion (soft 30d then hard-delete)             | P0       | 15     |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Login API: < 500 ms P95 under 10,000 RPS
- Registration: < 1,000 ms P95
- Password reset email: < 60 seconds delivery

### 5.2 Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with RS256
- Rate limiting: 10 req/min per IP on /auth/* endpoints
- HTTPS enforced; no tokens in URL parameters
- Audit log for all auth events

### 5.3 Availability
- Auth service SLA: 99.9% uptime
- Graceful degradation if 2FA service is down

---

## 6. API Endpoints

| Method | Endpoint                  | Auth     | Description               |
|--------|---------------------------|----------|---------------------------|
| POST   | /api/auth/register        | No       | Create new account        |
| POST   | /api/auth/login           | No       | Authenticate user         |
| POST   | /api/auth/logout          | Yes      | Invalidate session        |
| POST   | /api/auth/forgot-password | No       | Send reset link           |
| POST   | /api/auth/reset-password  | No+token | Set new password          |
| GET    | /api/auth/me              | Yes      | Get current user profile  |
| PUT    | /api/auth/me              | Yes      | Update profile            |
| DELETE | /api/auth/me              | Yes      | Delete account            |
| POST   | /api/auth/2fa/setup       | Yes      | Initialise 2FA            |
| POST   | /api/auth/2fa/verify      | Yes      | Verify TOTP + enable 2FA  |

---

## 7. Error Codes

| Code | HTTP | Message                              |
|------|------|--------------------------------------|
| E001 | 400  | Validation error: {field} is invalid |
| E002 | 401  | Invalid credentials                  |
| E003 | 401  | Email not verified                   |
| E004 | 423  | Account locked — try again in 15 min |
| E005 | 429  | Too many requests                    |
| E007 | 409  | Email already registered             |
| E008 | 410  | Reset link expired or already used   |

---

## 8. Out of Scope

- Biometric authentication — planned v3.0
- Enterprise SSO (SAML, LDAP) — separate module
- Magic link / passwordless login — under evaluation

---

## 9. Open Questions

1. Should Google-linked accounts be allowed to set a password later?
2. UX for 2FA recovery if both device and backup codes are lost?
3. Block account deletion vs cancel active orders automatically?

---

*Use this PRD as input to the QA Generator to produce a Test Strategy, Test Plan, Test Cases, and Bug Report.*
