def compute_revenue_risk(churn_prob: float, failure_prob: float, avg_monthly_spend: float) -> float:
    ltv = avg_monthly_spend * 12
    repair_value = 200

    return round((churn_prob * ltv) + (failure_prob * repair_value), 2)


def recommend_action(churn_prob: float, failure_prob: float) -> str:
    if churn_prob > 0.7 and failure_prob > 0.7:
        return "URGENT_INTERVENTION"
    if churn_prob > 0.7:
        return "RETENTION"
    if failure_prob > 0.7:
        return "MAINTENANCE"
    return "NONE"
