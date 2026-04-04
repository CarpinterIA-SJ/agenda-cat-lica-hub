import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const normalizeOrganizerEventLink = (to: NavLinkProps["to"]) => {
  if (typeof to === "string") {
    const match = to.match(/^\/organizador\/evento\/([^/]+)\/dashboard$/);
    if (match) {
      return `/organizador/evento/${match[1]}/configuracoes`;
    }
  }
  return to;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const normalizedTo = normalizeOrganizerEventLink(to);

    return (
      <RouterNavLink
        ref={ref}
        to={normalizedTo}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
