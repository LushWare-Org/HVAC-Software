import numpy as np

from utils.model_loader import get_failure_features, get_failure_model


def predict_failure(data) -> float:
    model = get_failure_model()
    features = get_failure_features()

    input_array = np.array([[getattr(data, feature) for feature in features]], dtype=float)
    probability = model.predict_proba(input_array)[0][1]

    return float(probability)
