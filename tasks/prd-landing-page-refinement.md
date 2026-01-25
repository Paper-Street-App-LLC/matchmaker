# PRD: Landing Page Refinement

## Overview

Refine the Matchmaker landing page to position Matchmaker as a standalone product, move the sign-up form to a more prominent position, and simplify the overall copy while maintaining the Apple-like tone.

## Problem Statement

The current landing page has several issues:

- "The Introduction" is mentioned in multiple places, creating confusion about what product users are signing up for
- The sign-up form appears too late in the page flow, potentially losing interested visitors
- Copy could be tightened to improve focus and reduce information overload
- The relationship between Matchmaker and The Introduction is unclear

## Goals

- Position Matchmaker as the primary, standalone product
- Move sign-up form to appear immediately after the demo section
- Clarify The Introduction relationship in FAQs only
- Simplify copy throughout while preserving dual-audience appeal
- Maintain Apple-like tone and visual treatment

## Non-Goals

- Removing any existing sections
- Changing the visual design or layout beyond form relocation
- Modifying the demo section's The Introduction mention
- Altering the sign-up form fields or validation logic

## User Stories

### US-LP-001: Review Landing Page Structure

As a developer, I need to understand the current landing page structure and identify all 'The Introduction' mentions so that I can plan the refinement changes accurately.

**Acceptance Criteria:**
- Document current page section order
- List all locations where 'The Introduction' is mentioned
- Identify current sign-up form position
- Note current FAQ content

**Files in Scope:**
- `web/src/app/page.tsx`

### US-LP-002: Move Sign-up Form After Demo Section

As a visitor, I want to see the sign-up form immediately after the demo section so that I can register quickly once I'm interested without scrolling through the entire page.

**Acceptance Criteria:**
- Sign-up form appears directly after demo section
- Form retains all existing fields and functionality
- Visual treatment feels prominent but not jarring
- Form submission still works correctly

**Dependencies:** US-LP-001

**Files in Scope:**
- `web/src/app/page.tsx`

### US-LP-003: Remove Excess 'The Introduction' Mentions

As a visitor, I want Matchmaker presented as a standalone product so that I understand I'm signing up for Matchmaker, not an internal tool for another service.

**Acceptance Criteria:**
- 'The Introduction' mentions removed from sections other than demo and FAQs
- Demo section keeps existing The Introduction mention (acceptable)
- Page positions Matchmaker as the standalone product
- Existing Apple-like tone preserved

**Dependencies:** US-LP-001

**Files in Scope:**
- `web/src/app/page.tsx`

### US-LP-004: Rewrite FAQs to Center on Matchmaker

As a visitor, I want FAQs that focus on Matchmaker with a clear explanation of The Introduction relationship so that I understand the product without confusion.

**Acceptance Criteria:**
- FAQs rewritten to center on Matchmaker as the product
- Single clear explanation of The Introduction relationship included
- Positioning: 'Matchmaker powers The Introduction's matchmaking operations'
- Context provided that The Introduction is a professional matchmaking service
- Apple-like tone maintained

**Dependencies:** US-LP-001

**Files in Scope:**
- `web/src/app/page.tsx`

### US-LP-005: Simplify Copy Throughout Landing Page

As a visitor, I want to read a focused, concise landing page so that I can understand the value proposition without information overload.

**Acceptance Criteria:**
- Hero section preserves 'Meet Your Matchmaker' dual-audience appeal
- Features/Benefits sections have tightened language
- No sections removed (simplification only)
- Dual audience messaging preserved (matchmakers and singles)
- Apple-like tone maintained throughout

**Dependencies:** US-LP-002, US-LP-003, US-LP-004

**Files in Scope:**
- `web/src/app/page.tsx`

### US-LP-006: Verify Sign-up Form Functionality

As a developer, I need to verify the sign-up form works correctly after relocation so that users can successfully register.

**Acceptance Criteria:**
- Form submission works correctly in new location
- All form validation still functions
- Success/error states display properly
- No console errors during form interaction

**Dependencies:** US-LP-002

**Files in Scope:**
- `web/src/app/page.tsx`

## Implementation Tasks

### Phase 1 (Research)
- `docs: audit landing page structure and The Introduction mentions`

### Phase 2 (Structural Changes)
- `refactor(web): move sign-up form after demo section`
- `refactor(web): remove excess The Introduction mentions`

### Phase 3 (Content Updates)
- `content(web): rewrite FAQs to center on Matchmaker`
- `content(web): simplify copy throughout landing page`

### Phase 4 (Verification)
- `test(web): verify sign-up form functionality after relocation`

## Success Criteria

- Landing page positions Matchmaker as standalone product
- Sign-up form appears immediately after demo section
- The Introduction mentioned only in demo section and one FAQ
- Copy is tighter and more focused
- All form functionality preserved
- Apple-like tone maintained throughout

## Rollback Strategy

- Each task implemented as atomic conventional commit
- Feature branch with clean commit history for easy bisection
- Single file scope (`page.tsx`) makes rollback straightforward

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Copy changes alter brand voice | Review against existing Apple-like tone before committing |
| Form relocation breaks functionality | Manual testing of all form interactions |
| Removing mentions causes context loss | Ensure FAQ clearly explains relationship |

## Dependencies

- None external
- Phase 2 depends on Phase 1 research
- Phase 3 depends on Phase 2 structural changes
- Phase 4 depends on Phase 2 form relocation
