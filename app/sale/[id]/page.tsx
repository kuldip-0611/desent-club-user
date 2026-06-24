import { StoreShell } from '@/modules/shop/components/store-shell'
import { SaleDetailPageModule } from '@/modules/shop/sale-detail-page'

type Props = { params: Promise<{ id: string }> }

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <StoreShell>
      <SaleDetailPageModule saleId={id} />
    </StoreShell>
  )
}
