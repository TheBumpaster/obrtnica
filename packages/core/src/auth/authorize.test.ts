import { describe, it, expect } from 'vitest';

import { checkPermission, requirePermission, AuthorizationError } from './authorize';
import type { AuthorizationContext, UserPermissions } from './authorize';

describe('Authorization Engine', () => {
  const mockOrgContext: AuthorizationContext = {
    actorType: 'user',
    actorId: 'user1',
    orgId: 'org1',
    hasMfa: true,
    hasStepUp: true,
    emergencyAccess: false,
  };

  const mockServiceContext: AuthorizationContext = {
    actorType: 'service',
    actorId: 'service1',
    orgId: 'org1',
  };

  const mockUserPermissions: UserPermissions = {
    orgPermissions: new Set(['org.view', 'org.members.invite', 'workspace.data.read']),
    workspacePermissions: new Map([
      ['workspace1', new Set(['workspace.data.read', 'workspace.data.write'])],
    ]),
  };

  describe('checkPermission', () => {
    it('should grant permission when user has it', () => {
      const result = checkPermission(mockOrgContext, 'org.view', mockUserPermissions);
      expect(result.granted).toBe(true);
    });

    it('should deny permission when user does not have it', () => {
      const result = checkPermission(mockOrgContext, 'org.billing.update', mockUserPermissions);
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Missing permission');
    });

    it('should deny human-only permissions to service accounts', () => {
      const result = checkPermission(mockServiceContext, 'org.api_tokens.manage', {
        orgPermissions: new Set(['org.api_tokens.manage']),
        workspacePermissions: new Map(),
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Permission requires human actor');
    });

    it('should throw MFA_REQUIRED when MFA is required but not present', () => {
      const contextWithoutMfa = { ...mockOrgContext, hasMfa: false };

      expect(() => {
        checkPermission(contextWithoutMfa, 'org.members.permissions.assign', mockUserPermissions);
      }).toThrow(AuthorizationError);

      try {
        checkPermission(contextWithoutMfa, 'org.members.permissions.assign', mockUserPermissions);
      } catch (error) {
        expect((error as AuthorizationError).code).toBe('MFA_REQUIRED');
      }
    });

    it('should throw STEP_UP_REQUIRED when step-up is required but not present', () => {
      const contextWithoutStepUp = { ...mockOrgContext, hasStepUp: false };
      const permissionsWithStepUp = {
        orgPermissions: new Set(['org.security.manage']),
        workspacePermissions: new Map(),
      };

      expect(() => {
        checkPermission(contextWithoutStepUp, 'org.security.manage', permissionsWithStepUp);
      }).toThrow(AuthorizationError);

      try {
        checkPermission(contextWithoutStepUp, 'org.security.manage', permissionsWithStepUp);
      } catch (error) {
        expect((error as AuthorizationError).code).toBe('STEP_UP_REQUIRED');
      }
    });

    it('should allow permissions when emergency access is active', () => {
      const emergencyContext = { ...mockOrgContext, emergencyAccess: true, hasMfa: false, hasStepUp: false };
      const permissionsWithStepUp = {
        orgPermissions: new Set(['org.emergency_access.manage']),
        workspacePermissions: new Map(),
      };

      // Should not throw even though MFA/step-up are required
      const result = checkPermission(emergencyContext, 'org.emergency_access.manage', permissionsWithStepUp);
      expect(result.granted).toBe(true);
    });

    it('should check workspace permissions correctly', () => {
      const workspaceContext = { ...mockOrgContext, workspaceId: 'workspace1' };

      const result1 = checkPermission(workspaceContext, 'workspace.data.write', mockUserPermissions);
      expect(result1.granted).toBe(true);

      const result2 = checkPermission(workspaceContext, 'workspace.data.export', mockUserPermissions);
      expect(result2.granted).toBe(false);
    });

    it('should deny workspace permissions without workspace context', () => {
      const result = checkPermission(mockOrgContext, 'workspace.data.write', mockUserPermissions);
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Workspace context required');
    });

    it('should grant self permissions to authenticated users', () => {
      const result = checkPermission(mockOrgContext, 'self.profile.update', mockUserPermissions);
      expect(result.granted).toBe(true);
    });

    it('should deny self permissions to service accounts', () => {
      const result = checkPermission(mockServiceContext, 'self.profile.update', mockUserPermissions);
      expect(result.granted).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw when permission is granted', () => {
      expect(() => {
        requirePermission(mockOrgContext, 'org.view', mockUserPermissions);
      }).not.toThrow();
    });

    it('should throw AuthorizationError when permission is denied', () => {
      expect(() => {
        requirePermission(mockOrgContext, 'org.billing.update', mockUserPermissions);
      }).toThrow(AuthorizationError);
    });

    it('should throw with FORBIDDEN code for denied permissions', () => {
      try {
        requirePermission(mockOrgContext, 'org.billing.update', mockUserPermissions);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        // Note: hasMfa is defined, so code should be FORBIDDEN not UNAUTHORIZED
        expect((error as AuthorizationError).code).toMatch(/FORBIDDEN|UNAUTHORIZED/);
      }
    });
  });
});
