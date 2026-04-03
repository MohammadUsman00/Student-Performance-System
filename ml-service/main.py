from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
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
    modelName: str # linear_regression, random_forest, decision_tree

# Model Pipelines
pipelines = {
    "linear_regression": None,
    "random_forest": None,
    "decision_tree": None
}

is_trained = False

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
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES)
        ])
    
    return Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', model)
    ])

@app.post("/train-all")
async def train_all():
    global is_trained, pipelines
    # Simulate Kaggle dataset structure (UCI Student Performance)
    np.random.seed(42)
    n_samples = 1500
    
    data = {}
    for feat in NUMERICAL_FEATURES:
        if feat == "age": data[feat] = np.random.randint(15, 22, n_samples)
        elif feat in ["Medu", "Fedu"]: data[feat] = np.random.randint(0, 5, n_samples)
        elif feat in ["traveltime", "studytime"]: data[feat] = np.random.randint(1, 5, n_samples)
        elif feat == "failures": data[feat] = np.random.randint(0, 4, n_samples)
        elif feat == "absences": data[feat] = np.random.randint(0, 30, n_samples)
        elif feat == "previousMarks": data[feat] = np.random.uniform(40, 100, n_samples)
        else: data[feat] = np.random.randint(1, 6, n_samples) # health, Dalc, etc
        
    for feat in CATEGORICAL_FEATURES:
        if feat == "gender": data[feat] = np.random.choice(["M", "F"], n_samples)
        elif feat == "address": data[feat] = np.random.choice(["U", "R"], n_samples)
        elif feat == "famsize": data[feat] = np.random.choice(["GT3", "LE3"], n_samples)
        elif feat == "Pstatus": data[feat] = np.random.choice(["T", "A"], n_samples)
        elif feat in ["Mjob", "Fjob"]: data[feat] = np.random.choice(["teacher", "health", "services", "at_home", "other"], n_samples)
        elif feat == "reason": data[feat] = np.random.choice(["home", "reputation", "course", "other"], n_samples)
        elif feat == "guardian": data[feat] = np.random.choice(["mother", "father", "other"], n_samples)
        else: data[feat] = np.random.choice(["yes", "no"], n_samples)
        
    df = pd.DataFrame(data)
    
    # Target score calculation (some noise + weights)
    # Weights for some key features
    score = (df['studytime'] * 4) + (df['previousMarks'] * 0.5) - (df['failures'] * 10) + (df['Medu'] * 2) - (df['absences'] * 0.5)
    # Influence of some categorical (e.g. schoolsup)
    score += df['schoolsup'].apply(lambda x: 5 if x == "yes" else 0)
    score += np.random.normal(10, 5, n_samples)
    score = np.clip(score, 0, 100)
    
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = score
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model_defs = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "decision_tree": DecisionTreeRegressor(random_state=42)
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
                "r2": float(r2_score(y_test, y_pred))
            },
            "classificationMetrics": get_classification_metrics(y_test, y_pred),
            "lastTrained": int(time.time())
        })
    
    is_trained = True
    return {"status": "success", "metrics": results}

@app.post("/predict")
async def predict(req: PredictRequest):
    if not is_trained:
        await train_all()
        
    pipeline = pipelines.get(req.modelName)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Model pipeline not found")
    
    # Preprocess boolean fields from Convex (true/false) to API strings (yes/no)
    data_dict = req.studentData.copy()
    for feat in ["schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet", "romantic"]:
        if feat in data_dict:
            data_dict[feat] = "yes" if data_dict[feat] is True else ("no" if data_dict[feat] is False else data_dict[feat])
            
    input_df = pd.DataFrame([data_dict])
    
    # Ensure all columns exist in input_df
    for col in NUMERICAL_FEATURES + CATEGORICAL_FEATURES:
        if col not in input_df.columns:
            # Provide sensible defaults if missing
            if col in NUMERICAL_FEATURES: input_df[col] = 0
            else: input_df[col] = "other"

    prediction = float(pipeline.predict(input_df)[0])
    prediction = min(100, max(0, prediction))
    
    return {
        "predictedScore": prediction,
        "riskLevel": get_risk_level(prediction),
        "modelUsed": req.modelName
    }

@app.get("/health")
async def health():
    return {"status": "ok", "trained": is_trained}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
