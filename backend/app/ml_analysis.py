"""Heuristic ML health analysis for uploaded datasets plus training code.

Pure stdlib on purpose (no pandas dependency on the deployment target).
Produces six category scores + a weighted ML Health Score.
"""

import csv
import io
import re
from collections import Counter
from typing import Any

TARGET_ALIASES = {
    "target", "label", "class", "y", "outcome", "output", "response",
    "dependent", "target_variable", "target_var", "class_label",
}
ID_ALIASES = {"id", "uuid", "uid", "row_id", "serial", "index", "row_num", "rowid"}
TIME_HINTS = ("date", "time", "timestamp", "datetime")

SPLIT_RE = re.compile(
    r"train_test_split|KFold|StratifiedKFold|cross_val_score|cross_validate|"
    r"TimeSeriesSplit|GroupKFold|GroupShuffleSplit|validation_split", re.I)
FIT_RE = re.compile(r"\.fit\(", re.I)
X_FEATURES_RE = re.compile(r"X\s*=\s*(?:df|data|train)?\s*\.?\s*\[([^\]]+)\]", re.I)
SCORE_RE = re.compile(
    r"f1_score|roc_auc_score|roc_curve|precision_score|recall_score|"
    r"confusion_matrix|classification_report|precision_recall_curve|"
    r"mean_squared_error|r2_score|mean_absolute_error", re.I)
ACCURACY_RE = re.compile(r"accuracy_score", re.I)
MODEL_RE = re.compile(
    r"RandomForest|GradientBoosting|XGB|XGBoost|LightGBM|LGBM|CatBoost|SVC|"
    r"LogisticRegression|LinearRegression|KNeighbors|GaussianNB|DecisionTree|"
    r"MLPClassifier|MLPRegressor|Lasso|Ridge|ElasticNet|AdaBoost|Bagging|"
    r"HistGradientBoosting|keras|tensorflow|torch|statsmodels", re.I)
SEARCH_RE = re.compile(
    r"GridSearchCV|RandomizedSearchCV|Optuna|hyperopt|grid_search|random_search", re.I)
BASELINE_RE = re.compile(r"DummyClassifier|DummyRegressor", re.I)
SCALER_RE = re.compile(
    r"StandardScaler|MinMaxScaler|RobustScaler|OneHotEncoder|LabelEncoder|"
    r"PolynomialFeatures|SelectKBest|PCA", re.I)


def _parse_rows(csv_text: str) -> list[list[str]] | None:
    try:
        rows = [
            r for r in csv.reader(io.StringIO(csv_text.strip()))
            if any(c.strip() for c in r)
        ]
        if len(rows) < 2:
            return None
        return rows
    except Exception:
        return None


def _clean(v: Any) -> str:
    return str(v).strip()


def _to_float(v: Any) -> float | None:
    try:
        return float(_clean(v))
    except (ValueError, TypeError):
        return None


def _unique_vals(col: list[str]) -> set[str]:
    return {c for c in col if c != ""}


def _pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 3:
        return 0.0
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = sum((x - mx) ** 2 for x in xs)
    dy = sum((y - my) ** 2 for y in ys)
    if dx == 0 or dy == 0:
        return 0.0
    return num / ((dx * dy) ** 0.5)


def _find_target(header: list[str]) -> int:
    for i, h in enumerate(header):
        if _clean(h).lower() in TARGET_ALIASES:
            return i
    return len(header) - 1


def _status(score: int) -> str:
    return "ok" if score >= 80 else ("warn" if score >= 60 else "bad")


def analyze_ml(csv_text: str, code: str) -> dict | None:
    rows = _parse_rows(csv_text)
    if rows is None:
        return None

    header = [_clean(h) for h in rows[0]]
    data = [r for r in rows[1:] if any(_clean(c) for c in r)]
    n_rows, n_cols = len(data), len(header)
    if n_rows == 0:
        return None

    dataset = _dataset_summary(header, data)
    target_idx = _find_target(header)
    target_name = header[target_idx]

    quality_score, quality_issues = _data_quality(header, data)
    balance_score, balance_issues, dist = _class_balance(data, target_idx)
    leakage_score, leakage_issues = _leakage(header, data, target_idx, code)
    validation_score, validation_issues = _validation(code)
    metrics_score, metrics_issues = _metrics(code, validation_score, balance_score)
    model_score, model_issues = _model_selection(code)

    categories = [
        {"key": "data_quality", "label": "Data Quality", "score": quality_score, "status": _status(quality_score)},
        {"key": "leakage", "label": "Leakage Risk", "score": leakage_score, "status": _status(leakage_score)},
        {"key": "validation", "label": "Validation", "score": validation_score, "status": _status(validation_score)},
        {"key": "metrics", "label": "Metrics", "score": metrics_score, "status": _status(metrics_score)},
        {"key": "model_selection", "label": "Model Selection", "score": model_score, "status": _status(model_score)},
        {"key": "class_balance", "label": "Class Balance", "score": balance_score, "status": _status(balance_score)},
    ]

    weights = {
        "data_quality": 0.20, "leakage": 0.20, "validation": 0.15,
        "metrics": 0.15, "model_selection": 0.15, "class_balance": 0.15,
    }
    overall = round(sum(c["score"] * weights[c["key"]] for c in categories))

    issues = sorted(
        quality_issues + leakage_issues + validation_issues + metrics_issues
        + model_issues + balance_issues,
        key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["severity"]],
    )

    return {
        "score": overall,
        "status": _status(overall),
        "categories": categories,
        "dataset": {
            "rows": n_rows,
            "columns": n_cols,
            "target": target_name,
            "target_type": dataset["target_type"],
            "missing_pct": dataset["missing_pct"],
            "duplicate_pct": dataset["duplicate_pct"],
            "constant_columns": dataset["constant_columns"],
            "class_distribution": dist,
        },
        "issues": issues,
    }


def _dataset_summary(header: list[str], data: list[list[str]]) -> dict:
    n_rows, n_cols = len(data), len(header)
    total_cells = n_rows * n_cols
    missing = sum(1 for r in data for c in r if _clean(c) == "")
    missing_pct = round(missing * 100 / total_cells, 1) if total_cells else 0.0

    seen, dups = set(), 0
    for r in data:
        key = tuple(_clean(c) for c in r)
        if key in seen:
            dups += 1
        seen.add(key)
    duplicate_pct = round(dups * 100 / n_rows, 1) if n_rows else 0.0

    constant_columns = [
        header[i] for i in range(n_cols)
        if len(_unique_vals([r[i] for r in data])) <= 1
    ]

    target_idx = _find_target(header)
    vals = [_clean(r[target_idx]) for r in data if _clean(r[target_idx]) != ""]
    if not vals:
        target_type = "unknown"
    else:
        numeric = all(_to_float(v) is not None for v in vals)
        target_type = ("regression" if numeric and len(set(vals)) > 12 else "classification")

    return {
        "missing_pct": missing_pct,
        "duplicate_pct": duplicate_pct,
        "constant_columns": constant_columns,
        "target_type": target_type,
    }


def _data_quality(header: list[str], data: list[list[str]]) -> tuple[int, list[dict]]:
    summary = _dataset_summary(header, data)
    score, issues = 100.0, []
    if summary["missing_pct"] > 0:
        penalty = min(40.0, summary["missing_pct"] * 2)
        score -= penalty
        if summary["missing_pct"] >= 5:
            issues.append({
                "category": "Data Quality", "severity": "medium" if summary["missing_pct"] < 20 else "high",
                "message": f"{summary['missing_pct']}% of cells are missing. Impute or drop incomplete rows.",
            })
    if summary["duplicate_pct"] > 0:
        score -= min(25.0, summary["duplicate_pct"])
        if summary["duplicate_pct"] >= 5:
            issues.append({
                "category": "Data Quality", "severity": "medium",
                "message": f"{summary['duplicate_pct']}% of rows are duplicates.",
            })
    if summary["constant_columns"]:
        score -= min(20.0, len(summary["constant_columns"]) * 10)
        issues.append({
            "category": "Data Quality", "severity": "medium",
            "message": f"Constant column(s) add no signal: {', '.join(summary['constant_columns'][:3])}.",
        })
    return max(0, round(score)), issues


def _class_balance(data: list[list[str]], target_idx: int) -> tuple[int, list[dict], dict]:
    vals = [_clean(r[target_idx]) for r in data if _clean(r[target_idx]) != ""]
    if len(vals) < 2:
        return 30, [{
            "category": "Class Balance", "severity": "high",
            "message": "Target column has fewer than 2 usable values.",
        }], {}
    numeric = all(_to_float(v) is not None for v in vals)
    if numeric and len(set(vals)) > 12:
        counts = Counter(vals)
        top = counts.most_common(5)
        return 100, [], {k: v for k, v in top}

    counts = Counter(vals)
    top = counts.most_common(5)
    major, minor = counts.most_common(1)[0][1], counts.most_common()[-1][1]
    ratio = minor / max(major, 1)
    score = max(0, round(min(1.0, ratio / 0.5) * 100))
    issues = []
    if ratio < 0.5:
        issues.append({
            "category": "Class Balance", "severity": "medium" if ratio >= 0.2 else "high",
            "message": (
                f"Class imbalance: the smallest class has {ratio:.0%} of the majority class. "
                "Consider stratified splits and class weights."
            ),
        })
    return score, issues, {k: v for k, v in top}


def _leakage(header: list[str], data: list[list[str]], target_idx: int, code: str) -> tuple[int, list[dict]]:
    score, issues = 100.0, []
    n = len(data)
    target_vals = [_clean(r[target_idx]) for r in data]
    target_low = header[target_idx].lower()

    for i, h in enumerate(header):
        if i == target_idx:
            continue
        h_low = h.lower()
        col = [_clean(r[i]) for r in data]
        unique_ratio = len(_unique_vals(col)) / max(n, 1)

        if h_low in ID_ALIASES and unique_ratio > 0.9:
            score -= 30
            issues.append({
                "category": "Leakage Risk", "severity": "high",
                "message": f"'{h}' looks like a unique identifier — keep it out of the feature matrix.",
            })

        if h_low == target_low or (h_low in TARGET_ALIASES and i != target_idx):
            score -= 50
            issues.append({
                "category": "Leakage Risk", "severity": "high",
                "message": f"Column '{h}' duplicates the target — this leaks the answer into training.",
            })

        matches = sum(1 for r in data if _clean(r[i]) != "" and _clean(r[i]) == _clean(r[target_idx]))
        if matches >= 0.99 * n:
            score -= 40
            issues.append({
                "category": "Leakage Risk", "severity": "high",
                "message": f"Column '{h}' nearly always equals the target — strong leakage signal.",
            })

        pair = [
            (x, y) for x, y in zip(col, target_vals)
            if _to_float(x) is not None and _to_float(y) is not None
        ]
        if len(pair) >= 10:
            corr = _pearson([float(p[0]) for p in pair], [float(p[1]) for p in pair])
            if abs(corr) > 0.99:
                score -= 40
                issues.append({
                    "category": "Leakage Risk", "severity": "high",
                    "message": f"Column '{h}' is almost perfectly correlated with the target (r={corr:.2f}).",
                })
            elif abs(corr) > 0.97:
                score -= 20
                issues.append({
                    "category": "Leakage Risk", "severity": "medium",
                    "message": f"Column '{h}' is very strongly correlated with the target (r={corr:.2f}).",
                })

    if any(t in h for h in header for t in TIME_HINTS):
        score -= 15
        issues.append({
            "category": "Leakage Risk", "severity": "medium",
            "message": "Time-stamped data detected — use a temporal split to avoid look-ahead leakage.",
        })

    m = X_FEATURES_RE.search(code)
    if m:
        selected = m.group(1)
        if re.search(re.escape(target_low), selected, re.I):
            score -= 40
            issues.append({
                "category": "Leakage Risk", "severity": "high",
                "message": "The feature matrix appears to include the target column.",
            })

    return max(0, round(score)), issues


def _validation(code: str) -> tuple[int, list[dict]]:
    if SPLIT_RE.search(code):
        return 100, []
    if FIT_RE.search(code):
        return 45, [{
            "category": "Validation", "severity": "high",
            "message": "Model is fit on the full dataset with no train/test split or cross-validation.",
        }]
    return 60, [{
        "category": "Validation", "severity": "low",
        "message": "No model training code detected — results depend only on the dataset.",
    }]


def _metrics(code: str, validation_score: int, balance_score: int) -> tuple[int, list[dict]]:
    has_metrics = bool(SCORE_RE.search(code))
    has_accuracy = bool(ACCURACY_RE.search(code))
    score = 25.0 if validation_score >= 80 else 15.0
    if has_metrics:
        score += 60
    if has_accuracy:
        score += 15
    issues = []
    if balance_score < 60 and has_accuracy and not has_metrics:
        score = min(score, 40.0)
        issues.append({
            "category": "Metrics", "severity": "medium",
            "message": "Imbalanced classes with accuracy-only evaluation — add F1 / precision / recall or ROC-AUC.",
        })
    if not has_metrics and not has_accuracy:
        issues.append({
            "category": "Metrics", "severity": "high",
            "message": "No evaluation metrics found. Add a test-set score so results are measurable.",
        })
    return max(0, min(100, round(score))), issues


def _model_selection(code: str) -> tuple[int, list[dict]]:
    issues = []
    if SEARCH_RE.search(code):
        return 100, []
    score = 40.0
    if MODEL_RE.search(code):
        score += 40
    if BASELINE_RE.search(code):
        score += 10
        issues.append({
            "category": "Model Selection", "severity": "low",
            "message": "Baseline model present — good practice for comparison.",
        })
    if SCALER_RE.search(code):
        score += 10
    if not MODEL_RE.search(code):
        issues.append({
            "category": "Model Selection", "severity": "medium",
            "message": "No ML model detected in the code — results may just describe the dataset.",
        })
    return max(0, min(100, round(score))), issues
