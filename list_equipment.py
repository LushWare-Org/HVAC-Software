import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST'),
    port=int(os.getenv('POSTGRES_PORT')),
    database=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD')
)

cur = conn.cursor()

# Count equipment
cur.execute('SELECT COUNT(*) FROM crm.equipment')
count = cur.fetchone()[0]
print(f'Total equipment: {count}')
print()

# List all equipment IDs
print('Equipment IDs (first 20):')
cur.execute('SELECT id FROM crm.equipment ORDER BY id LIMIT 20')
for row in cur.fetchall():
    print(f'  {row[0]}')

cur.close()
conn.close()
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST'),
    port=int(os.getenv('POSTGRES_PORT')),
    database=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD')
)

cur = conn.cursor()

# Count equipment
cur.execute('SELECT COUNT(*) FROM crm.equipment')
count = cur.fetchone()[0]
print(f'Total equipment: {count}')
print()

# List all equipment IDs
print('Equipment IDs (first 20):')
cur.execute('SELECT id FROM crm.equipment ORDER BY id LIMIT 20')
for row in cur.fetchall():
    print(f'  {row[0]}')

cur.close()
conn.close()
