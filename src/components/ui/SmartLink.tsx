"use client";

import { AnchorHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLoading } from "@/components/providers/LoadingProvider";

interface SmartLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ className, href, children, onClick, ...props }, ref) => {
    const { startLoading } = useLoading();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't show loading for external links or anchored links
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isAnchor = href.startsWith("#");
      
      if (!isExternal && !isAnchor) {
        startLoading();
      }
      
      if (onClick) onClick(e);
    };

    return (
      <Link
        href={href}
        ref={ref}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

SmartLink.displayName = "SmartLink";

export { SmartLink };
