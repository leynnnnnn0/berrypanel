"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/navigation";
import { getDashboardBreadcrumbs } from "@/lib/dashboard-navigation";

export function Breadcrumbs({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItemType[];
}) {
  const pathname = usePathname();
  const items = breadcrumbs.length > 0
    ? breadcrumbs
    : getDashboardBreadcrumbs(pathname);

  return (
    <>
      {items.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList className="gap-1.5 text-sm sm:gap-2">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <Fragment key={`${item.title}-${index}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-[#2F4156]">
                        {item.title}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild className="text-[#567C8D] hover:text-[#2F4156]">
                        <Link href={item.href}>{item.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator className="text-[#567C8D]" />
                  )}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
}
