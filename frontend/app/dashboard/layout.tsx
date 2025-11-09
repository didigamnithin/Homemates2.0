'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import TenantOnboarding from '@/components/onboarding/TenantOnboarding'
import { apiClient } from '@/lib/api/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, checkAuth, userType } = useAuthStore()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Check if tenant needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoading || !user || userType !== 'tenant') {
        setIsCheckingOnboarding(false)
        return
      }

      try {
        const response = await apiClient.get(`/tenants/phone/${(user as any).phone || user.email || ''}`)
        const tenant = response.data.tenant

        // If tenant doesn't exist or doesn't have required fields, show onboarding
        if (!tenant || !tenant.bedrooms || !tenant.budget_min || !tenant.localities) {
          setNeedsOnboarding(true)
        }
      } catch (error) {
        // If tenant not found, show onboarding
        setNeedsOnboarding(true)
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    if (user && userType === 'tenant' && pathname !== '/dashboard/properties') {
      checkOnboarding()
    } else {
      setIsCheckingOnboarding(false)
    }
  }, [user, userType, isLoading, pathname])

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show onboarding for tenants if needed
  if (needsOnboarding && userType === 'tenant' && pathname !== '/dashboard/properties') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <TenantOnboarding
            phoneNumber={(user as any).phone || user.email || ''}
            onComplete={() => {
              setNeedsOnboarding(false)
              router.push('/dashboard/properties')
            }}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen lg:flex-row flex-col">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background lg:ml-0">
        {children}
      </main>
    </div>
  )
}

