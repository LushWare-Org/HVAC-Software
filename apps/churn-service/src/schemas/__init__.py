from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import ModuleType


_BASE_PATH = Path(__file__).resolve().parent


def _load_module(file_name: str, module_name: str) -> ModuleType:
    spec = spec_from_file_location(module_name, _BASE_PATH / file_name)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load schema module: {file_name}")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_churn_schema = _load_module("churn.schema.py", "churn_schema")
_failure_schema = _load_module("failure.schema.py", "failure_schema")

ChurnInput = _churn_schema.ChurnInput
ChurnResponse = _churn_schema.ChurnResponse
FailureInput = _failure_schema.FailureInput
FailureResponse = _failure_schema.FailureResponse
