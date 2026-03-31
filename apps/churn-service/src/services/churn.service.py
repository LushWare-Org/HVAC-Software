import numpy as np

from utils.model_loader import get_churn_features, get_churn_model


def predict_churn(data) -> float:
    model = get_churn_model()
    features = get_churn_features()

    input_array = np.array([[getattr(data, feature) for feature in features]], dtype=float)
    probability = model.predict_proba(input_array)[0][1]

    return float(probability)
