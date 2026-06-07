import PortalShell from '@/app/components/portal-shell'

export default function DosenLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="dosen">{children}</PortalShell>
}
