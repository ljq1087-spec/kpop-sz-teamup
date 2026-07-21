"""数据库连接和初始化"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "kpop.db")


def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            openid TEXT PRIMARY KEY,
            nickname TEXT NOT NULL DEFAULT '',
            avatar_url TEXT NOT NULL DEFAULT '',
            credit_score INTEGER NOT NULL DEFAULT 100,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_name TEXT NOT NULL,
            missing_positions TEXT NOT NULL DEFAULT '[]',
            rehearsal_time TEXT NOT NULL,
            performance_time TEXT NOT NULL,
            max_members INTEGER NOT NULL DEFAULT 5,
            join_condition TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            district TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active',
            creator_openid TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (creator_openid) REFERENCES users(openid)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            openid TEXT NOT NULL,
            position TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (openid) REFERENCES users(openid),
            UNIQUE(team_id, openid)
        )
    """)

    # 创建索引
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_teams_created ON teams(created_at DESC)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_members_team ON team_members(team_id)
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("数据库初始化完成!")
