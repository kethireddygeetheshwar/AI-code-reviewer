import os

os.environ["DATABASE_URL"] = "sqlite:///./test_ml.db"

from app.ml_analysis import analyze_ml

BALANCED_CSV = (
    "age,income,target\n"
    "30,50000,1\n"
    "25,42000,0\n"
    "45,80000,1\n"
    "35,62000,0\n"
    "28,47000,1\n"
    "52,90000,0\n"
)

GOOD_CODE = (
    "from sklearn.model_selection import train_test_split\n"
    "from sklearn.ensemble import RandomForestClassifier\n"
    "from sklearn.metrics import f1_score, confusion_matrix\n"
    "X = df.drop('target', axis=1)\n"
    "y = df['target']\n"
    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n"
    "model = RandomForestClassifier()\n"
    "model.fit(X_train, y_train)\n"
    "print(f1_score(y_test, model.predict(X_test)))\n"
)

BAD_CODE = (
    "import pandas as pd\n"
    "df = pd.read_csv('data.csv')\n"
    "model = RandomForestClassifier()\n"
    "model.fit(df)\n"
    "print(accuracy_score(y_test, model.predict(df)))\n"
)


def test_returns_health_structure():
    result = analyze_ml(BALANCED_CSV, GOOD_CODE)
    assert result is not None
    assert 0 <= result["score"] <= 100
    assert len(result["categories"]) == 6
    assert result["dataset"]["target"] == "target"
    assert result["dataset"]["rows"] == 6


def test_invalid_csv_returns_none():
    assert analyze_ml("not,really\n", GOOD_CODE) is None
    assert analyze_ml("", GOOD_CODE) is None


def test_data_quality_flags_missing_and_duplicates():
    csv_text = "a,b,target\n1,2,1\n1,2,1\n1,,1\n"
    result = analyze_ml(csv_text, GOOD_CODE)
    assert result is not None
    quality = next(c for c in result["categories"] if c["key"] == "data_quality")
    assert quality["score"] < 100


def test_class_balance_scores_imbalance():
    csv_text = "a,b,target\n" + "1,1,1\n" * 90 + "2,2,0\n" * 10
    result = analyze_ml(csv_text, GOOD_CODE)
    balance = next(c for c in result["categories"] if c["key"] == "class_balance")
    assert balance["score"] < 40
    assert any(i["category"] == "Class Balance" for i in result["issues"])


def test_balanced_target_scores_high():
    result = analyze_ml(BALANCED_CSV, GOOD_CODE)
    balance = next(c for c in result["categories"] if c["key"] == "class_balance")
    assert balance["score"] >= 80


def test_leakage_flags_duplicate_target_column():
    csv_text = "x,dup,target\n1,1,1\n2,0,0\n3,1,1\n4,0,0\n5,1,1\n6,0,0\n"
    result = analyze_ml(csv_text, GOOD_CODE)
    leakage = next(c for c in result["categories"] if c["key"] == "leakage")
    assert leakage["score"] < 100


def test_leakage_flags_id_column():
    csv_text = "id,x,target\n1001,1,1\n1002,2,0\n1003,3,1\n1004,4,0\n1005,5,1\n1006,6,0\n"
    result = analyze_ml(csv_text, GOOD_CODE)
    leakage = next(c for c in result["categories"] if c["key"] == "leakage")
    assert leakage["score"] < 100


def test_validation_penalizes_fit_without_split():
    result = analyze_ml(BALANCED_CSV, BAD_CODE)
    validation = next(c for c in result["categories"] if c["key"] == "validation")
    assert validation["score"] < 60


def test_good_code_gets_full_validation_and_high_metrics():
    result = analyze_ml(BALANCED_CSV, GOOD_CODE)
    validation = next(c for c in result["categories"] if c["key"] == "validation")
    metrics = next(c for c in result["categories"] if c["key"] == "metrics")
    assert validation["score"] == 100
    assert metrics["score"] >= 80


def test_model_selection_detects_search():
    code = GOOD_CODE.replace("RandomForestClassifier()", "GridSearchCV(RandomForestClassifier(), {})")
    result = analyze_ml(BALANCED_CSV, code)
    model = next(c for c in result["categories"] if c["key"] == "model_selection")
    assert model["score"] == 100


def test_regression_target_skips_class_balance():
    csv_text = "a,b,target\n1,1,100.5\n2,2,200.1\n3,3,150.3\n4,4,400.9\n5,5,90.2\n6,6,310.7\n"
    result = analyze_ml(csv_text, GOOD_CODE)
    balance = next(c for c in result["categories"] if c["key"] == "class_balance")
    assert balance["score"] == 100
