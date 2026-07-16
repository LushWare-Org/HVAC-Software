/**
 * AI & IoT tab — Reasoning content + IoT content stacked in one scrollable
 * tab, matching the mockup's combined "AI & IoT" grouping. Both halves keep
 * their exact original data sources and behavior.
 */
import { Sparkles, Wifi } from 'lucide-react'
import { useCustomerStatusSummary } from '../../../hooks/useCustomers'
import { IotDevicesTab } from '../IotDevicesTab'
import { formatMoney } from '../../../lib/format'
import type { CustomerStatusSummary } from '../../../types/api'
import { SectionLabel } from '../shared'

function formatPct(value: number) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function offerLabel(value?: string) {
  if (!value) return 'None'
  return value.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function riskColor(level: CustomerStatusSummary['churnPrediction']['level']) {
  if (level === 'High') return 'var(--red)'
  if (level === 'Medium') return 'var(--amber)'
  return 'var(--green)'
}

function fallbackReasoning(summary: CustomerStatusSummary) {
  const upsell = summary.upsellRecommendation
  const retention = summary.retentionPrediction
  const source = summary.predictionSource === 'model' ? 'ML service' : 'fallback rule model'

  return {
    upsellRecommendation: {
      ruleBased: `Scores consider service recency (${summary.signals.daysSinceLastService} days), failure risk (${summary.failurePrediction.level}), churn risk (${summary.churnPrediction.level}), and monthly spend (${formatMoney(summary.signals.avgMonthlySpend)}).`,
      mlResult: upsell
        ? `Recommended ${offerLabel(upsell.recommendedOffer)} with ${formatPct(upsell.confidence)} confidence and ${formatPct(upsell.priorityScore ?? upsell.confidence)} priority.`
        : 'No upsell recommendation was returned for this customer.',
      aiExplanation: upsell
        ? `The offer is favored because the customer signals make ${offerLabel(upsell.recommendedOffer).toLowerCase()} the strongest commercial follow-up.`
        : 'The system needs more offer data before it can explain a specific upsell recommendation.',
    },
    retentionSuggestion: {
      ruleBased: 'Retention thresholds favor premium contracts for high conversion and value, retention discounts for high churn, and maintenance plans for repeated failure history.',
      mlResult: retention
        ? `${source} inputs produced ${formatPct(retention.pConvert)} conversion probability, ${formatMoney(retention.ltv)} annual value, ${formatPct(retention.churnProbability)} churn probability, and score ${Math.round(retention.score)}.`
        : 'No retention suggestion was returned for this customer.',
      aiExplanation: retention
        ? `${retention.reason}. Suggested action: ${offerLabel(retention.action)} at ${retention.priority} priority via ${offerLabel(retention.recommendedChannel)}.`
        : 'The system cannot explain a retention action until a retention prediction is available.',
    },
    failureAndChurnPrediction: {
      ruleBased: 'Fallback rules increase churn for long inactivity and low recent service count; failure risk rises with older equipment, service gaps, and poor review history.',
      mlResult: `${source} returned ${summary.churnPrediction.level} churn risk (${formatPct(summary.churnPrediction.probability)}) and ${summary.failurePrediction.level} failure risk (${formatPct(summary.failurePrediction.probability)}).`,
      aiExplanation: 'The combined result means this customer needs outreach calibrated to churn risk and service timing calibrated to failure risk.',
    },
    proposedNextStep: {
      ruleBased: 'Next-step rules prioritize paused follow-up review, urgent intervention, retention offers, maintenance scheduling, re-engagement, monitoring, then normal cadence.',
      mlResult: `Selected next step: ${summary.proposedNextStep}`,
      aiExplanation: 'This converts the risk and recommendation results into the next operational action for the team.',
    },
  }
}

function ReasoningCard({ title, result, accent, details }: {
  title: string; result: string; accent: string
  details: { ruleBased: string; mlResult: string; aiExplanation: string }
}) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg-card)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{title}</h4>
          <p style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, margin: '4px 0 0' }}>{result}</p>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 8px', borderRadius: 8, color: accent, background: 'var(--blue-glow)' }}>
          Explanation
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {(['Rule based', 'ML result', 'AI explanation'] as const).map((label, i) => {
          const text = [details.ruleBased, details.mlResult, details.aiExplanation][i]
          return (
            <div key={label} style={{ borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
              <p style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.5, margin: 0 }}>{text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AiIotTab({ customerId }: { customerId: string }) {
  const statusSummaryQuery = useCustomerStatusSummary(customerId || undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <SectionLabel icon={Sparkles}>AI Reasoning</SectionLabel>
        {statusSummaryQuery.isLoading && (
          <div style={{ borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>Loading reasoning from customer status signals...</p>
          </div>
        )}
        {statusSummaryQuery.isError && (
          <div style={{ borderRadius: 12, border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)', background: 'color-mix(in srgb, var(--red) 8%, transparent)', padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', margin: 0 }}>Reasoning is unavailable right now.</p>
            <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>The status summary endpoint could not be loaded.</p>
          </div>
        )}
        {!statusSummaryQuery.isLoading && !statusSummaryQuery.isError && statusSummaryQuery.data && (() => {
          const summary = statusSummaryQuery.data
          const reasoning = summary.reasoning ?? fallbackReasoning(summary)
          const upsell = summary.upsellRecommendation
          const retention = summary.retentionPrediction

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div style={{ borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prediction source</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 4 }}>{summary.predictionSource === 'model' ? 'ML model' : 'Rule fallback'}</div>
                </div>
                <div style={{ borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Churn risk</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: riskColor(summary.churnPrediction.level) }}>
                    {summary.churnPrediction.level} ({formatPct(summary.churnPrediction.probability)})
                  </div>
                </div>
                <div style={{ borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failure risk</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: riskColor(summary.failurePrediction.level) }}>
                    {summary.failurePrediction.level} ({formatPct(summary.failurePrediction.probability)})
                  </div>
                </div>
                <div style={{ borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue risk</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 4 }}>{formatMoney(summary.revenueRisk)}</div>
                </div>
              </div>

              <ReasoningCard
                title="Upsell Recommendation"
                result={upsell ? `${offerLabel(upsell.recommendedOffer)} - ${formatPct(upsell.confidence)} confidence` : 'No recommendation'}
                accent="var(--blue)"
                details={reasoning.upsellRecommendation}
              />
              <ReasoningCard
                title="Retention Suggestion"
                result={retention ? `${offerLabel(retention.action)} - ${retention.priority} priority` : 'No suggestion'}
                accent={retention?.priority === 'high' ? 'var(--red)' : retention?.priority === 'medium' ? 'var(--amber)' : 'var(--green)'}
                details={reasoning.retentionSuggestion}
              />
              <ReasoningCard
                title="Failure & Churn Prediction"
                result={`${summary.failurePrediction.level} failure, ${summary.churnPrediction.level} churn`}
                accent={summary.churnPrediction.level === 'High' || summary.failurePrediction.level === 'High' ? 'var(--red)' : 'var(--blue)'}
                details={reasoning.failureAndChurnPrediction}
              />
              <ReasoningCard
                title="Proposed Next Step"
                result={summary.proposedNextStep}
                accent="var(--green)"
                details={reasoning.proposedNextStep}
              />
            </div>
          )
        })()}
      </div>

      <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 22 }}>
        <SectionLabel icon={Wifi}>IoT Devices</SectionLabel>
        <IotDevicesTab customerId={customerId} />
      </div>
    </div>
  )
}
