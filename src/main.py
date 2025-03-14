import sqlite3
from contextlib import contextmanager

class DBManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
        return self.conn

    def disconnect(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    def execute(self, query, params=()):
        conn = self.connect()
        cur = conn.cursor()
        cur.execute(query, params)
        conn.commit()
        return cur.lastrowid

    def executemany(self, query, seq_of_params):
        conn = self.connect()
        cur = conn.cursor()
        cur.executemany(query, seq_of_params)
        conn.commit()
        return cur.lastrowid

    def fetchall(self, query, params=()):
        conn = self.connect()
        cur = conn.cursor()
        cur.execute(query, params)
        return cur.fetchall()

    def fetchone(self, query, params=()):
        conn = self.connect()
        cur = conn.cursor()
        cur.execute(query, params)
        return cur.fetchone()

    def begin(self):
        conn = self.connect()
        conn.execute('BEGIN')

    def commit(self):
        if self.conn:
            self.conn.commit()

    def rollback(self):
        if self.conn:
            self.conn.rollback()

    @contextmanager
    def transaction(self):
        try:
            self.begin()
            yield
            self.commit()
        except Exception:
            self.rollback()
            raise

    def create_table(self, table_name, columns):
        columns_definition = ', '.join([f'{col} {dtype}' for col, dtype in columns.items()])
        query = f'CREATE TABLE IF NOT EXISTS {table_name} ({columns_definition})'
        self.execute(query)

    def drop_table(self, table_name):
        query = f'DROP TABLE IF EXISTS {table_name}'
        self.execute(query)

    def insert(self, table_name, data):
        placeholders = ', '.join(['?' for _ in data])
        columns = ', '.join(data.keys())
        values = tuple(data.values())
        query = f'INSERT INTO {table_name} ({columns}) VALUES ({placeholders})'
        return self.execute(query, values)

    def update(self, table_name, data, condition):
        set_clause = ', '.join([f'{col} = ?' for col in data.keys()])
        values = list(data.values())
        cond_clause = ' AND '.join([f'{col} = ?' for col in condition.keys()])
        values.extend(condition.values())
        query = f'UPDATE {table_name} SET {set_clause} WHERE {cond_clause}'
        return self.execute(query, values)

    def delete(self, table_name, condition):
        cond_clause = ' AND '.join([f'{col} = ?' for col in condition.keys()])
        values = tuple(condition.values())
        query = f'DELETE FROM {table_name} WHERE {cond_clause}'
        return self.execute(query, values)

    def select(self, table_name, columns='*', condition=None):
        cols = ', '.join(columns) if isinstance(columns, (list, tuple)) else columns
        query = f'SELECT {cols} FROM {table_name}'
        values = ()
        if condition:
            cond_clause = ' AND '.join([f'{col} = ?' for col in condition.keys()])
            values = tuple(condition.values())
            query += f' WHERE {cond_clause}'
        return self.fetchall(query, values)

    def close(self):
        self.disconnect()
