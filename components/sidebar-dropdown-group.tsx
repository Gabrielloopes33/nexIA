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

function SectionSeparator({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
    </div>
  )
}

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
        "flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
        isActive
          ? "bg-white/20 text-white font-medium"
          : "text-white/80 hover:bg-white/10 hover:text-white",
        child.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
      )}
    >
      <span className="truncate">{child.label}</span>
      {child.badge !== undefined && child.badge > 0 && (
        <span className="ml-2 flex-shrink-0 bg-white/20 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {child.badge > 99 ? "99+" : child.badge}
        </span>
      )}
    </span>
  )

  if (child.disabled) {
    return <div>{content}</div>
  }

  return (
    <Link href={child.href} className="block">
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

  return (
    <div className="w-full">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200",
          "text-white/90 hover:text-white hover:bg-white/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        )}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="text-xs font-medium flex-1 text-left truncate">
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-1 space-y-0.5">
          {groupedChildren.map(({ section, items }, sectionIndex) => (
            <div key={section || `section-${sectionIndex}`}>
              {section && <SectionSeparator label={section} />}
              <div className="space-y-0.5">
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
