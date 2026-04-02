import type { Metadata } from 'next'

import { projectConfig } from '@/lib/project-config'

import { LoginPageClient } from './login-page-client'

export const metadata: Metadata = {
  title: `${projectConfig.teamMemberSingular} Login | ${projectConfig.appName}`,
  description: `Sign in to ${projectConfig.appName} with the configured team account policy.`,
}

export default function LoginPage() {
  return (
    <LoginPageClient
      allowedDomainLabel={projectConfig.allowedDomainLabel}
      appName={projectConfig.appName}
      teamMemberSingular={projectConfig.teamMemberSingular}
      teamName={projectConfig.teamName}
    />
  )
}
