'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Contact } from '@/lib/mock/contacts'

interface ContactPanelContextType {
  isOpen: boolean
  selectedContact: Contact | null
  openContactPanel: (contact: Contact) => void
  closeContactPanel: () => void
}

const ContactPanelContext = createContext<ContactPanelContextType | undefined>(undefined)

export function ContactPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const openContactPanel = (contact: Contact) => {
    setSelectedContact(contact)
    setIsOpen(true)
  }

  const closeContactPanel = () => {
    setIsOpen(false)
    setTimeout(() => setSelectedContact(null), 200)
  }

  return (
    <ContactPanelContext.Provider 
      value={{ isOpen, selectedContact, openContactPanel, closeContactPanel }}
    >
      {children}
    </ContactPanelContext.Provider>
  )
}

export function useContactPanel() {
  const context = useContext(ContactPanelContext)
  if (context === undefined) {
    throw new Error('useContactPanel must be used within a ContactPanelProvider')
  }
  return context
}
