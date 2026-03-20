"use client"

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarNavItem, SidebarNavChild } from "@/components/sidebar-nav-config"

interface SidebarDropdownGroupProps {
  item: SidebarNavItem
  isOpen: boolean
  onToggle: () => void
  pathname: string
}

// Section separator with horizontal connector (only for section titles)
function SectionSeparator({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-2 px-0 py-2 mt-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
    </div>
  )
}

// Sub-nav item without horizontal connector, just indented
function SubNavItem({
  child,
  isActive,
}: {
  child: SidebarNavChild
  isActive: boolean
}) {
  const content = (
    <span
      className={cn(
        "flex items-center justify-between py-1.5 pr-2 text-[13px] rounded-md transition-colors relative",
        isActive
          ? "bg-white/20 text-white font-medium"
          : "text-white/80 hover:bg-white/10 hover:text-white",
        child.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/50"
      )}
    >
      {/* Active indicator bar - yellow */}
      {isActive && (
        <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full" />
      )}
      <span className="truncate">{child.label}</span>
      {child.badge !== undefined && child.badge > 0 && (
        <span className="ml-2 flex-shrink-0 bg-white/25 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full min-w-[22px] text-center">
          {child.badge > 99 ? "99+" : child.badge}
        </span>
      )}
    </span>
  )

  if (child.disabled) {
    return (
      <div className="cursor-not-allowed pl-4">
        {content}
      </div>
    )
  }

  return (
    <Link href={child.href} className={cn("block", isActive ? "pl-5" : "pl-4")}>
      {content}
    </Link>
  )
}

export function SidebarDropdownGroup({
  item,
  isOpen,
  onToggle,
  pathname,
}: SidebarDropdownGroupProps) {
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0

  // Group children by section
  const groupedChildren: { section: string; items: SidebarNavChild[] }[] = []
  if (hasChildren) {
    let currentSection = ""
    let currentItems: SidebarNavChild[] = []

    item.children!.forEach((child) => {
      const section = child.section || ""
      if (section !== currentSection) {
        if (currentItems.length > 0) {
          groupedChildren.push({ section: currentSection, items: currentItems })
        }
        currentSection = section
        currentItems = [child]
      } else {
        currentItems.push(child)
      }
    })
    if (currentItems.length > 0) {
      groupedChildren.push({ section: currentSection, items: currentItems })
    }
  }

  // Check if any child is active
  const hasActiveChild = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  )

  return (
    <div className="w-full">
      {/* Group Header - Parent Level */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200",
          "text-white/95 hover:text-white hover:bg-white/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          isOpen && "bg-white/10",
          hasActiveChild && !isOpen && "bg-white/5"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-[14px] font-medium flex-1 text-left truncate">
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform duration-200 text-white/70",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Content - Child Level */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {/* Tree container */}
        <div className="relative ml-[22px] pl-0">
          
          {groupedChildren.map(({ section, items }, sectionIndex) => (
            <div key={section || `section-${sectionIndex}`} className="relative">
              {section && <SectionSeparator label={section} />}
              <div className="space-y-1">
                {items.map((child) => {
                  const isActive = pathname === child.href
                  return (
                    <SubNavItem
                      key={child.href}
                      child={child}
                      isActive={isActive}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
