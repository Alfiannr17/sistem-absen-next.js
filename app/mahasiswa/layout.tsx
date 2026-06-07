import PortalShell from '@/app/components/portal-shell'

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="mahasiswa">{children}</PortalShell>
}
