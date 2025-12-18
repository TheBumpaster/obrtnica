import { hasAny } from './helpers';
import type { NavigationNode, PermissionSet, Platform } from './types';

type FilterOptions = {
  platform?: Platform;
};

export function filterNavByPermissions(
  nodes: NavigationNode[],
  granted: PermissionSet,
  options?: FilterOptions
): NavigationNode[] {
  return nodes
    .map((node) => {
      const platformAllowed =
        !options?.platform || !node.platforms || node.platforms.includes(options.platform);
      const visible = platformAllowed && hasAny(node.requiredPermissions, granted);
      if (!visible) {
        return null;
      }

      const children = node.children ? filterNavByPermissions(node.children, granted, options) : undefined;
      const filteredChildren = children && children.length > 0 ? children : undefined;
      if (node.children && !filteredChildren) {
        // Hide empty groups after filtering
        return null;
      }

      const disabled =
        node.disabledWhenMissing && node.disabledWhenMissing.length > 0
          ? !hasAny(node.disabledWhenMissing, granted)
          : false;

      const result: NavigationNode = {
        ...node,
        children: filteredChildren,
        disabled,
      };
      return result;
    })
    .filter((n): n is NavigationNode => Boolean(n));
}
