export const dynamic = 'force-dynamic'

import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProfilePageModule } from '@/modules/shop/profile-page'

export default function ProfileRoute() {
  return (
    <StoreShell>
      <ProfilePageModule />
    </StoreShell>
  )
}
