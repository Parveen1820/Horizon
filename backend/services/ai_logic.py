import io
import os
import uuid

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


MODEL_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "models",
    )
)

os.makedirs(MODEL_DIR, exist_ok=True)


def analyze_dataframe(df: pd.DataFrame):
    missing_values = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    numerical_columns = df.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    column_details = []

    for column in df.columns:
        column_details.append(
            {
                "name": column,
                "type": str(df[column].dtype),
                "missing": int(df[column].isnull().sum()),
                "unique": int(df[column].nunique(dropna=True)),
            }
        )

    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "numerical_columns": numerical_columns,
        "categorical_columns": categorical_columns,
        "column_details": column_details,
        "preview": df.head(5).fillna("").to_dict(
            orient="records"
        ),
    }


def train_classification_model(
    file_content: bytes,
    target_column: str,
):
    """
    Train a Random Forest classification model
    using an uploaded CSV file.
    """

    # ---------------------------------------------------------
    # 1. Read CSV
    # ---------------------------------------------------------

    try:
        text = file_content.decode("utf-8-sig")
        df = pd.read_csv(io.StringIO(text))
    except Exception as error:
        raise ValueError(
            f"Unable to read CSV file: {str(error)}"
        )

    if df.empty:
        raise ValueError(
            "The uploaded dataset is empty."
        )

    # ---------------------------------------------------------
    # 2. Validate target column
    # ---------------------------------------------------------

    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' was not found."
        )

       # Remove rows where target is missing
    df = df.dropna(
        subset=[target_column]
    ).copy()

    # Remove duplicate rows
    duplicate_rows_removed = int(
        df.duplicated().sum()
    )

    if duplicate_rows_removed > 0:
        df = df.drop_duplicates().copy()

    if len(df) < 10:
        raise ValueError(
            "Dataset must contain at least 10 valid rows."
        )

    # ---------------------------------------------------------
    # 3. Separate features and target
    # ---------------------------------------------------------

    X = df.drop(
        columns=[target_column]
    )

    y = df[target_column]

    # ---------------------------------------------------------
    # 4. Remove unusable feature columns
    # ---------------------------------------------------------

    unusable_columns = []

    for column in X.columns:

        if X[column].isnull().all():
            unusable_columns.append(column)
            continue

        if X[column].nunique(dropna=True) <= 1:
            unusable_columns.append(column)

    if unusable_columns:
        X = X.drop(
            columns=unusable_columns
        )

    if X.shape[1] == 0:
        raise ValueError(
            "No usable feature columns were found."
        )

    # ---------------------------------------------------------
    # 5. Validate target
    # ---------------------------------------------------------

    class_count = int(
        y.nunique()
    )

    if class_count < 2:
        raise ValueError(
            "The target column must contain at least 2 classes."
        )

    if class_count > 20:
        raise ValueError(
            "The selected target has too many unique classes."
        )

    # ---------------------------------------------------------
    # 6. Detect feature types
    # ---------------------------------------------------------

    numerical_features = X.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_features = X.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    transformers = []

    # Numerical preprocessing
    if numerical_features:

        numerical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="median"
                    ),
                )
            ]
        )

        transformers.append(
            (
                "numerical",
                numerical_pipeline,
                numerical_features,
            )
        )

    # Categorical preprocessing
    if categorical_features:

        categorical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="most_frequent"
                    ),
                ),
                (
                    "encoder",
                    OneHotEncoder(
                        handle_unknown="ignore"
                    ),
                ),
            ]
        )

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            )
        )

    if not transformers:
        raise ValueError(
            "No supported feature columns were found."
        )

    # ---------------------------------------------------------
    # 7. Preprocessor
    # ---------------------------------------------------------

    preprocessor = ColumnTransformer(
        transformers=transformers
    )

    # ---------------------------------------------------------
    # 8. Random Forest
    # ---------------------------------------------------------

    model = RandomForestClassifier(
        n_estimators=150,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "model",
                model,
            ),
        ]
    )

    # ---------------------------------------------------------
    # 9. Train / Test split
    # ---------------------------------------------------------

    try:

        X_train, X_test, y_train, y_test = (
            train_test_split(
                X,
                y,
                test_size=0.20,
                random_state=42,
                stratify=y,
            )
        )

    except ValueError:

        X_train, X_test, y_train, y_test = (
            train_test_split(
                X,
                y,
                test_size=0.20,
                random_state=42,
            )
        )

    # ---------------------------------------------------------
    # 10. Train model
    # ---------------------------------------------------------

    pipeline.fit(
        X_train,
        y_train,
    )

    # ---------------------------------------------------------
    # 11. Evaluate
    # ---------------------------------------------------------

    predictions = pipeline.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )

    # ---------------------------------------------------------
    # 12. Save model
    # ---------------------------------------------------------

    model_id = str(
        uuid.uuid4()
    )

    model_path = os.path.join(
        MODEL_DIR,
        f"{model_id}.joblib",
    )

    joblib.dump(
        {
            "pipeline": pipeline,
            "target_column": target_column,
            "feature_columns": X.columns.tolist(),
        },
        model_path,
    )

    # ---------------------------------------------------------
    # 13. Feature importance
    # ---------------------------------------------------------

    feature_importance = []

    try:

        trained_preprocessor = (
            pipeline.named_steps[
                "preprocessor"
            ]
        )

        trained_model = (
            pipeline.named_steps[
                "model"
            ]
        )

        feature_names = (
            trained_preprocessor
            .get_feature_names_out()
        )

        importances = (
            trained_model.feature_importances_
        )

        importance_data = list(
            zip(
                feature_names,
                importances,
            )
        )

        importance_data.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        for name, importance in (
            importance_data[:10]
        ):

            clean_name = (
                name
                .replace(
                    "numerical__",
                    "",
                )
                .replace(
                    "categorical__",
                    "",
                )
            )

            feature_importance.append(
                {
                    "feature": clean_name,
                    "importance": round(
                        float(importance) * 100,
                        2,
                    ),
                }
            )

    except Exception:
        feature_importance = []

    # ---------------------------------------------------------
    # 14. Sample prediction
    # ---------------------------------------------------------

    sample_row = X_test.iloc[
        [0]
    ]

    sample_prediction = (
        pipeline.predict(
            sample_row
        )[0]
    )

    confidence = None

    try:

        probabilities = (
            pipeline.predict_proba(
                sample_row
            )[0]
        )

        confidence = float(
            np.max(probabilities)
        )

    except Exception:
        confidence = None

    # ---------------------------------------------------------
    # 15. Class distribution
    # ---------------------------------------------------------

    class_distribution = []

    distribution = y.value_counts()

    for class_name, count in (
        distribution.items()
    ):

        class_distribution.append(
            {
                "class": str(
                    class_name
                ),
                "count": int(
                    count
                ),
            }
        )

    # ---------------------------------------------------------
    # 16. Business insight
    # ---------------------------------------------------------

    prediction_text = str(
        sample_prediction
    )

    if confidence is not None:

        confidence_percentage = round(
            confidence * 100,
            2,
        )

        insight = (
            f"The model predicts "
            f"'{prediction_text}' "
            f"with "
            f"{confidence_percentage}% "
            f"confidence for the "
            f"sample record."
        )

    else:

        insight = (
            f"The model predicts "
            f"'{prediction_text}' "
            f"for the sample record."
        )

    # ---------------------------------------------------------
    # 17. Return result
    # ---------------------------------------------------------

    return {
        "success": True,

        "model_id": model_id,

        "model": (
            "Random Forest Classifier"
        ),

        "task": "classification",

        "target_column": target_column,

        "dataset": {
            "rows": int(len(df)),
            "features": int(
                X.shape[1]
            ),
            "numerical_features": int(
                len(
                    numerical_features
                )
            ),
            "categorical_features": int(
                len(
                    categorical_features
                )
            ),
        },

        "cleaning": {
            "missing_values_before": int(
                df.isnull()
                .sum()
                .sum()
            ),
            "duplicate_rows": duplicate_rows_removed,
            "removed_unusable_columns": (
                unusable_columns
            ),
            "numerical_imputation": (
                "Median"
            ),
            "categorical_imputation": (
                "Most Frequent"
            ),
            "categorical_encoding": (
                "One-Hot Encoding"
            ),
        },

        "metrics": {
            "accuracy": round(
                float(accuracy) * 100,
                2,
            ),
            "precision": round(
                float(precision) * 100,
                2,
            ),
            "recall": round(
                float(recall) * 100,
                2,
            ),
            "f1_score": round(
                float(f1) * 100,
                2,
            ),
        },

        "prediction": {
            "value": prediction_text,
            "confidence": (
                round(
                    confidence * 100,
                    2,
                )
                if confidence is not None
                else None
            ),
        },

        "feature_importance": (
            feature_importance
        ),

        "class_distribution": (
            class_distribution
        ),

        "insight": insight,

        "training": {
            "training_rows": int(
                len(X_train)
            ),
            "testing_rows": int(
                len(X_test)
            ),
            "test_size": 20,
        },
    }


def load_model(model_id: str):
    """
    Load a previously saved model.
    """

    model_path = os.path.join(
        MODEL_DIR,
        f"{model_id}.joblib",
    )

    if not os.path.exists(
        model_path
    ):
        raise ValueError(
            "Model not found."
        )

    return joblib.load(
        model_path
    )


def predict_with_model(
    model_id: str,
    input_data: dict,
):
    """
    Make a prediction using a
    previously trained model.
    """

    saved_model = load_model(
        model_id
    )

    pipeline = saved_model[
        "pipeline"
    ]

    feature_columns = (
        saved_model[
            "feature_columns"
        ]
    )

    row = {}

    for column in feature_columns:

        row[column] = input_data.get(
            column,
            None,
        )

    df = pd.DataFrame(
        [row],
        columns=feature_columns,
    )

    prediction = pipeline.predict(
        df
    )[0]

    confidence = None

    try:

        probabilities = (
            pipeline.predict_proba(
                df
            )[0]
        )

        confidence = float(
            np.max(probabilities)
        )

    except Exception:
        confidence = None

    return {
        "success": True,
        "prediction": str(
            prediction
        ),
        "confidence": (
            round(
                confidence * 100,
                2,
            )
            if confidence is not None
            else None
        ),
    }