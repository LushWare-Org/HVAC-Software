from __future__ import annotations

import math

import numpy as np


class LinearProbabilityModel:
    def __init__(self, feature_names: list[str], weights: list[float], bias: float):
        self.feature_names = feature_names
        self.weights = np.array(weights, dtype=float)
        self.bias = float(bias)

    def predict_proba(self, values):
        array = np.asarray(values, dtype=float)
        logits = array @ self.weights + self.bias
        probabilities = 1.0 / (1.0 + np.exp(-np.clip(logits, -50, 50)))
        probabilities = probabilities.reshape(-1, 1)
        return np.hstack([1.0 - probabilities, probabilities])
