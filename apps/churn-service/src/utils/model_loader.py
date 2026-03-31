from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Any

import joblib

from utils.logger import get_logger


LOGGER = get_logger(__name__)
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


class ModelRegistry:
    _instance: "ModelRegistry | None" = None
    _lock = Lock()

    def __new__(cls) -> "ModelRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return

        self._assets: dict[str, Any] = {}
        self._initialized = True

    def load(self) -> None:
        asset_map = {
            "churn_model": MODELS_DIR / "churn_model.pkl",
            "failure_model": MODELS_DIR / "failure_model.pkl",
            "churn_features": MODELS_DIR / "churn_features.pkl",
            "failure_features": MODELS_DIR / "failure_features.pkl",
        }

        for key, path in asset_map.items():
            if key in self._assets:
                continue

            try:
                self._assets[key] = joblib.load(path)
            except FileNotFoundError as exc:
                raise RuntimeError(f"Model artifact not found: {path}") from exc
            except Exception as exc:
                raise RuntimeError(f"Failed to load model artifact: {path}") from exc

        LOGGER.info("model artifacts loaded", extra={"context": {"models_dir": str(MODELS_DIR)}})

    def get(self, key: str) -> Any:
        if key not in self._assets:
            self.load()
        return self._assets[key]


def preload_models() -> None:
    ModelRegistry().load()


def get_churn_model() -> Any:
    return ModelRegistry().get("churn_model")


def get_failure_model() -> Any:
    return ModelRegistry().get("failure_model")


def get_churn_features() -> list[str]:
    return ModelRegistry().get("churn_features")


def get_failure_features() -> list[str]:
    return ModelRegistry().get("failure_features")
