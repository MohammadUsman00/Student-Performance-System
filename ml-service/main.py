from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Student Performance Detection System - ML Microservice")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature Definitions
NUMERICAL_FEATURES = [
    "age", "Medu", "Fedu", "traveltime", "studytime", "failures", 
    "famrel", "freetime", "goout", "Dalc", "Walc", "health", 
    "absences", "previousMarks"
]

CATEGORICAL_FEATURES = [
    "gender", "address", "famsize", "Pstatus", "Mjob", "Fjob", 
    "reason", "guardian", "schoolsup", "famsup", "paid", 
    "activities", "nursery", "higher", "internet", "romantic"
]

class PredictRequest(BaseModel):
    studentData: Dict[str, Any]
    modelName: str  # linear_regression, random_forest, decision_tree


class TrainAllRequest(BaseModel):
    students: list[Dict[str, Any]]


class PredictBatchRequest(BaseModel):
    students: list[Dict[str, Any]]
    modelName: str

# Model Pipelines
pipelines = {
    "linear_regression": None,
    "random_forest": None,
    "decision_tree": None
}

is_trained = False
trained_sample_count = 0
last_trained_at = 0

TARGET_COLUMN = "previousMarks"
PREDICT_BOOLEAN_FIELDS = [
    "schoolsup",
    "famsup",
    "paid",
    "activities",
    "nursery",
    "higher",
    "internet",
    "romantic",
]
TRAIN_NUMERICAL_FEATURES = [f for f in NUMERICAL_FEATURES if f != TARGET_COLUMN]
TRAIN_FEATURES = TRAIN_NUMERICAL_FEATURES + CATEGORICAL_FEATURES

def get_risk_level(score: float) -> str:
    if score >= 75:
        return "Low"
    elif score >= 50:
        return "Medium"
    else:
        return "High"

def get_classification_metrics(y_true_cont, y_pred_cont):
    def categorize(scores):
        cats = []
        for s in scores:
            if s >= 75: cats.append(2)
            elif s >= 50: cats.append(1)
            else: cats.append(0)
        return cats
    
    y_true_cat = categorize(y_true_cont)
    y_pred_cat = categorize(y_pred_cont)
    
    return {
        "accuracy": float(accuracy_score(y_true_cat, y_pred_cat)),
        "precision": float(precision_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0)),
        "recall": float(recall_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0)),
        "f1": float(f1_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0))
    }

def create_pipeline(model):
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), TRAIN_NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", model),
    ])

def normalize_student_dict(student: Dict[str, Any]) -> Dict[str, Any]:
    row = dict(student)
    for feat in PREDICT_BOOLEAN_FIELDS:
        if feat in row:
            val = row[feat]
            if val is True:
                row[feat] = "yes"
            elif val is False:
                row[feat] = "no"
            elif isinstance(val, str):
                row[feat] = val.strip().lower()
    return row


def coerce_input_df(raw_rows: list[Dict[str, Any]]) -> pd.DataFrame:
    rows = [normalize_student_dict(r) for r in raw_rows]
    df = pd.DataFrame(rows)

    for col in TRAIN_NUMERICAL_FEATURES + [TARGET_COLUMN]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            df[col] = np.nan

    for col in CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = "other"
        else:
            series = df[col].astype(str).str.strip()
            series = series.replace({"": "other", "nan": "other", "None": "other"})
            df[col] = series

    for col in TRAIN_NUMERICAL_FEATURES:
        median = float(df[col].median()) if df[col].notna().any() else 0.0
        df[col] = df[col].fillna(median)

    return df


@app.post("/train-all")
async def train_all(req: TrainAllRequest):
    global is_trained, pipelines, trained_sample_count, last_trained_at

    if not req.students:
        raise HTTPException(status_code=400, detail="No students provided for training")

    df = coerce_input_df(req.students)
    train_df = df[df[TARGET_COLUMN].notna()].copy()

    if len(train_df) < 20:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 20 students with '{TARGET_COLUMN}' for training. Found {len(train_df)}.",
        )

    X = train_df[TRAIN_FEATURES]
    y = train_df[TARGET_COLUMN].astype(float).clip(0, 100)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model_defs = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "decision_tree": DecisionTreeRegressor(random_state=42),
    }

    results = []

    for name, model in model_defs.items():
        pipeline = create_pipeline(model)
        pipeline.fit(X_train, y_train)
        pipelines[name] = pipeline

        y_pred = pipeline.predict(X_test)

        results.append({
            "modelName": name,
            "regressionMetrics": {
                "mae": float(mean_absolute_error(y_test, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                "r2": float(r2_score(y_test, y_pred)),
            },
            "classificationMetrics": get_classification_metrics(y_test, y_pred),
            "lastTrained": int(time.time()),
        })

    is_trained = True
    trained_sample_count = int(len(train_df))
    last_trained_at = int(time.time())

    return {
        "status": "success",
        "trainingRows": trained_sample_count,
        "metrics": results,
    }


def predict_scores(
    rows: list[Dict[str, Any]], model_name: str
) -> list[Dict[str, Any]]:
    if not is_trained:
        raise HTTPException(
            status_code=409, detail="Model is not trained. Train first with /train-all."
        )

    pipeline = pipelines.get(model_name)
    if pipeline is None:
        raise HTTPException(status_code=404, detail="Model pipeline not found")

    input_df = coerce_input_df(rows)
    X = input_df[TRAIN_FEATURES]
    predicted = pipeline.predict(X)

    results: list[Dict[str, Any]] = []
    for score in predicted:
        clipped = min(100.0, max(0.0, float(score)))
        results.append(
            {
                "predictedScore": clipped,
                "riskLevel": get_risk_level(clipped),
                "modelUsed": model_name,
            }
        )
    return results

@app.post("/predict")
async def predict(req: PredictRequest):
    results = predict_scores([req.studentData], req.modelName)
    return results[0]


@app.post("/predict-batch")
async def predict_batch(req: PredictBatchRequest):
    if not req.students:
        return {"predictions": []}
    return {"predictions": predict_scores(req.students, req.modelName)}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "trained": is_trained,
        "trainedSamples": trained_sample_count,
        "lastTrainedAt": last_trained_at,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
