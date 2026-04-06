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
    <div className="relative flex items-center gap-2 px-3 py-2 mt-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
    </div>
  )
}

// Sub-nav item without horizontal connector, alinhado à esquerda
function SubNavItem({
  child,
  isActive,
  index = 0,
}: {
  child: SidebarNavChild
  isActive: boolean
  index?: number
}) {
  const content = (
    <span
      className={cn(
        "flex items-center justify-between py-1.5 pr-3 text-[13px] rounded-md transition-all duration-200 ease-out relative pl-3",
        "hover:translate-x-0.5",
        isActive
          ? "bg-white/20 text-white font-medium translate-x-1"
          : "text-white/80 hover:bg-white/10 hover:text-white",
        child.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/50 hover:translate-x-0"
      )}
      style={{
        animationDelay: `${index * 25}ms`,
      }}
    >
      {/* Active indicator bar - yellow with scale animation */}
      {isActive && (
        <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full origin-left animate-scale-in" />
      )}
      <span className="truncate">{child.label}</span>
      {child.badge !== undefined && child.badge > 0 && (
        <span className="ml-2 flex-shrink-0 bg-white/25 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full min-w-[22px] text-center transition-transform duration-200 hover:scale-110">
          {child.badge > 99 ? "99+" : child.badge}
        </span>
      )}
    </span>
  )

  if (child.disabled) {
    return (
      <div className="cursor-not-allowed">
        {content}
      </div>
    )
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

  // Check if any child is active
  const hasActiveChild = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  )

  // Handle toggle with event prevention
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  return (
    <div className="w-full">
      {/* Group Header - Parent Level */}
      <button
        onClick={handleToggle}
        data-tour={item.key}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ease-out group",
          "text-white/95 hover:text-white hover:bg-white/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          "hover:scale-[1.02] active:scale-[0.98]",
          isOpen && "bg-white/10",
          hasActiveChild && !isOpen && "bg-white/5"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 flex-shrink-0 transition-all duration-200",
          isOpen ? "scale-110" : "group-hover:scale-105"
        )} />
        <span className="text-[14px] font-medium flex-1 text-left truncate">
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-all duration-300 ease-out text-white/70",
            isOpen && "rotate-180",
            !isOpen && "group-hover:translate-y-0.5"
          )}
        />
      </button>

      {/* Dropdown Content - Child Level with smooth animation */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {/* Tree container - alinhado à esquerda com padding para o indicador */}
          <div className="relative pl-3 pt-1">
            
            {groupedChildren.map(({ section, items }, sectionIndex) => (
              <div key={section || `section-${sectionIndex}`} className="relative">
                {section && <SectionSeparator label={section} />}
                <div className="space-y-0.5">
                  {items.map((child, childIndex) => {
                    const isActive = pathname === child.href
                    return (
                      <div
                        key={child.href}
                        className={cn(
                          "transition-all duration-300 ease-out",
                          isOpen
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-2 opacity-0"
                        )}
                        style={{
                          transitionDelay: isOpen ? `${childIndex * 30}ms` : "0ms",
                        }}
                      >
                        <SubNavItem
                          child={child}
                          isActive={isActive}
                          index={childIndex}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
