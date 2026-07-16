/**
 * Agreements tab — thin wrapper around the shared CustomerAgreementsTab
 * (also used by the Agreements module's own customer-scoped views).
 */
import CustomerAgreementsTab from '../../agreements/CustomerAgreementsTab'

export default function AgreementsTab({ customerId, customerName }: { customerId: string; customerName: string }) {
  return <CustomerAgreementsTab customerId={customerId} customerName={customerName} />
}
