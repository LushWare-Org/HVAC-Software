from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import ModuleType


_BASE_PATH = Path(__file__).resolve().parent


def _load_module(file_name: str, module_name: str) -> ModuleType:
    spec = spec_from_file_location(module_name, _BASE_PATH / file_name)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load service module: {file_name}")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_churn_service = _load_module("churn.service.py", "churn_service")
_failure_service = _load_module("failure.service.py", "failure_service")
_revenue_service = _load_module("revenue.service.py", "revenue_service")
_upsell_service = _load_module("upsell.service.py", "upsell_service")

predict_churn = _churn_service.predict_churn
predict_failure = _failure_service.predict_failure
compute_revenue_risk = _revenue_service.compute_revenue_risk
recommend_action = _revenue_service.recommend_action
recommend_offer = _upsell_service.recommend_offer
