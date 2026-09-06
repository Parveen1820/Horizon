import csv
import io


def analyze_csv(file_content: bytes):
    text = file_content.decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(text))

    rows = list(reader)
    columns = reader.fieldnames or []

    return {
        "success": True,
        "filename": "uploaded.csv",
        "rows": len(rows),
        "columns": len(columns),
        "column_names": columns,
        "preview": rows[:5],
    }