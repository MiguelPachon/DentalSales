from flask import Flask
import pandas as pd
import psycopg2

app = Flask(__name__)

def get_sales():
    conn = psycopg2.connect(
        host="db",
        database="dentalsales",
        user="postgres",
        password="postgres"
    )
    query = "SELECT dentist, amount, created_at FROM sales ORDER BY created_at DESC;"
    df = pd.read_sql(query, conn)
    conn.close()
    return df

@app.route('/')
def home():
    try:
        df = get_sales()
        if df.empty:
            return "<h1>Analytics DentalSales</h1><p>No hay ventas registradas aún.</p>"
        return f"<h1>Analytics DentalSales</h1>{df.to_html(index=False)}"
    except Exception as e:
        return f"<h1>Error:</h1><pre>{e}</pre>"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

