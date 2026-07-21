"""FastAPI 主入口 — 深圳 Kpop 路演组队小程序后端"""
import json
import uuid
import hashlib
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, init_db
from models import LoginRequest, TeamCreate, TeamJoin, TeamListQuery

app = FastAPI(title="KPOP深圳组队", version="1.0.0")

# CORS — 允许小程序请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 简单的 token 管理（开发阶段） ───
# 生产环境应使用 JWT
TOKENS = {}  # token -> openid


def create_token(openid: str) -> str:
    token = hashlib.sha256(f"{openid}{uuid.uuid4()}".encode()).hexdigest()
    TOKENS[token] = openid
    return token


def get_openid(authorization: Optional[str] = Header(None)) -> str:
    """从 Authorization header 获取 openid"""
    if not authorization:
        # 开发模式：用默认 openid
        return "dev_user_001"
    token = authorization.replace("Bearer ", "")
    openid = TOKENS.get(token)
    if not openid:
        # 开发模式容错
        return "dev_user_001"
    return openid


# ─── 初始化数据库 ───
@app.on_event("startup")
def startup():
    init_db()


# ─── 健康检查 ───
@app.get("/api/health")
def health():
    return {"status": "ok", "name": "KPOP深圳组队"}


# ═══════════════════════════════════════
#  用户 API
# ═══════════════════════════════════════

@app.post("/api/login")
def login(req: LoginRequest):
    """微信登录（开发阶段简化）"""
    # 生产环境：用 code 调用微信接口获取 openid
    # 开发阶段：用 code 作为 openid
    openid = req.code if req.code else f"dev_{uuid.uuid4().hex[:8]}"

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE openid = ?", (openid,)).fetchone()

    if user:
        # 更新昵称和头像
        if req.nickname:
            db.execute("UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?",
                       (req.nickname, req.avatar_url, openid))
    else:
        db.execute("INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)",
                   (openid, req.nickname or "", req.avatar_url or ""))

    db.commit()
    db.close()

    token = create_token(openid)
    return {"token": token, "openid": openid, "nickname": req.nickname}


@app.get("/api/user/profile")
def get_profile(openid: str = Header(None, alias="X-Openid")):
    """获取用户信息"""
    actual_openid = openid or "dev_user_001"
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE openid = ?", (actual_openid,)).fetchone()
    db.close()
    if not user:
        return {"openid": actual_openid, "nickname": "", "avatar_url": "", "credit_score": 100}
    return dict(user)


# ═══════════════════════════════════════
#  组队 API
# ═══════════════════════════════════════

@app.get("/api/teams")
def list_teams(
    status: str = Query("active"),
    district: str = Query(""),
    keyword: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    openid: str = Header(None, alias="X-Openid")
):
    """获取组队列表"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    where = ["1=1"]
    params = []

    if status:
        where.append("t.status = ?")
        params.append(status)
    if district:
        where.append("t.district = ?")
        params.append(district)
    if keyword:
        where.append("(t.song_name LIKE ? OR t.missing_positions LIKE ?)")
        kw = f"%{keyword}%"
        params.extend([kw, kw])

    offset = (page - 1) * page_size
    where_clause = " AND ".join(where)

    rows = db.execute(f"""
        SELECT t.*, u.nickname as creator_nickname, u.avatar_url as creator_avatar,
               (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.creator_openid = u.openid
        WHERE {where_clause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()

    # 获取总数
    total = db.execute(f"""
        SELECT COUNT(*) FROM teams t WHERE {where_clause}
    """, params).fetchone()[0]

    # 构建响应
    teams = []
    for row in rows:
        team = dict(row)
        # 解析 missing_positions
        try:
            team["missing_positions"] = json.loads(row["missing_positions"])
        except (json.JSONDecodeError, TypeError):
            team["missing_positions"] = []

        # 获取已上车成员
        members = db.execute("""
            SELECT tm.*, u.nickname, u.avatar_url
            FROM team_members tm
            LEFT JOIN users u ON tm.openid = u.openid
            WHERE tm.team_id = ?
        """, (row["id"],)).fetchall()
        team["members"] = [dict(m) for m in members]

        # 当前用户是否已上车
        team["has_joined"] = any(m["openid"] == actual_openid for m in team["members"])
        # 是否是发布者
        team["is_creator"] = row["creator_openid"] == actual_openid

        teams.append(team)

    db.close()
    return {
        "teams": teams,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": offset + page_size < total
    }


@app.get("/api/teams/{team_id}")
def get_team_detail(team_id: int, openid: str = Header(None, alias="X-Openid")):
    """获取组队详情"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    row = db.execute("""
        SELECT t.*, u.nickname as creator_nickname, u.avatar_url as creator_avatar,
               (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.creator_openid = u.openid
        WHERE t.id = ?
    """, (team_id,)).fetchone()

    if not row:
        db.close()
        raise HTTPException(status_code=404, detail="组队不存在")

    team = dict(row)
    try:
        team["missing_positions"] = json.loads(row["missing_positions"])
    except (json.JSONDecodeError, TypeError):
        team["missing_positions"] = []

    members = db.execute("""
        SELECT tm.*, u.nickname, u.avatar_url
        FROM team_members tm
        LEFT JOIN users u ON tm.openid = u.openid
        WHERE tm.team_id = ?
    """, (team_id,)).fetchall()
    team["members"] = [dict(m) for m in members]
    team["has_joined"] = any(m["openid"] == actual_openid for m in team["members"])
    team["is_creator"] = row["creator_openid"] == actual_openid

    db.close()
    return team


@app.post("/api/teams")
def create_team(req: TeamCreate, openid: str = Header(None, alias="X-Openid")):
    """发布组队"""
    actual_openid = openid or "dev_user_001"

    # 确保用户存在
    db = get_db()
    user = db.execute("SELECT openid FROM users WHERE openid = ?", (actual_openid,)).fetchone()
    if not user:
        db.execute("INSERT INTO users (openid, nickname) VALUES (?, ?)", (actual_openid, ""))

    cursor = db.execute("""
        INSERT INTO teams (song_name, missing_positions, rehearsal_time, performance_time,
                          max_members, join_condition, notes, district, creator_openid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req.song_name,
        json.dumps(req.missing_positions, ensure_ascii=False),
        req.rehearsal_time,
        req.performance_time,
        req.max_members,
        req.join_condition,
        req.notes,
        req.district,
        actual_openid
    ))
    team_id = cursor.lastrowid
    db.commit()
    db.close()

    return {"id": team_id, "message": "组队发布成功!"}


@app.post("/api/teams/{team_id}/join")
def join_team(team_id: int, req: TeamJoin, openid: str = Header(None, alias="X-Openid")):
    """上车报名"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    team = db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not team:
        db.close()
        raise HTTPException(status_code=404, detail="组队不存在")
    if team["status"] != "active":
        db.close()
        raise HTTPException(status_code=400, detail="该组队已关闭")

    # 检查是否已报名
    existing = db.execute(
        "SELECT * FROM team_members WHERE team_id = ? AND openid = ?",
        (team_id, actual_openid)
    ).fetchone()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="你已经上车了")

    # 检查人数
    member_count = db.execute(
        "SELECT COUNT(*) FROM team_members WHERE team_id = ?", (team_id,)
    ).fetchone()[0]
    if member_count >= team["max_members"]:
        db.close()
        raise HTTPException(status_code=400, detail="人数已满")

    # 确保用户存在
    user = db.execute("SELECT openid FROM users WHERE openid = ?", (actual_openid,)).fetchone()
    if not user:
        db.execute("INSERT INTO users (openid, nickname) VALUES (?, ?)", (actual_openid, ""))

    db.execute(
        "INSERT INTO team_members (team_id, openid, position) VALUES (?, ?, ?)",
        (team_id, actual_openid, req.position)
    )
    db.commit()
    db.close()

    return {"message": "上车成功!"}


@app.delete("/api/teams/{team_id}/join")
def leave_team(team_id: int, openid: str = Header(None, alias="X-Openid")):
    """取消报名"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    existing = db.execute(
        "SELECT * FROM team_members WHERE team_id = ? AND openid = ?",
        (team_id, actual_openid)
    ).fetchone()
    if not existing:
        db.close()
        raise HTTPException(status_code=400, detail="你还没有上车")

    db.execute(
        "DELETE FROM team_members WHERE team_id = ? AND openid = ?",
        (team_id, actual_openid)
    )
    db.commit()
    db.close()

    return {"message": "已下车"}


@app.put("/api/teams/{team_id}/complete")
def complete_team(team_id: int, openid: str = Header(None, alias="X-Openid")):
    """组队完成（仅发布者）"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    team = db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not team:
        db.close()
        raise HTTPException(status_code=404, detail="组队不存在")
    if team["creator_openid"] != actual_openid:
        db.close()
        raise HTTPException(status_code=403, detail="只有发布者可以操作")

    db.execute("UPDATE teams SET status = 'completed' WHERE id = ?", (team_id,))
    db.commit()
    db.close()

    return {"message": "组队完成! 🎉"}


@app.put("/api/teams/{team_id}/cancel")
def cancel_team(team_id: int, openid: str = Header(None, alias="X-Openid")):
    """取消组队（仅发布者）"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    team = db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not team:
        db.close()
        raise HTTPException(status_code=404, detail="组队不存在")
    if team["creator_openid"] != actual_openid:
        db.close()
        raise HTTPException(status_code=403, detail="只有发布者可以操作")

    db.execute("UPDATE teams SET status = 'cancelled' WHERE id = ?", (team_id,))
    db.commit()
    db.close()

    return {"message": "组队已取消"}


# ═══════════════════════════════════════
#  我的组队 API
# ═══════════════════════════════════════

@app.get("/api/my/teams")
def my_teams(openid: str = Header(None, alias="X-Openid")):
    """获取我的组队（发布的 + 报名的）"""
    actual_openid = openid or "dev_user_001"
    db = get_db()

    # 我发布的
    published_rows = db.execute("""
        SELECT t.*, u.nickname as creator_nickname, u.avatar_url as creator_avatar,
               (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.creator_openid = u.openid
        WHERE t.creator_openid = ?
        ORDER BY t.created_at DESC
    """, (actual_openid,)).fetchall()

    published = []
    for row in published_rows:
        team = dict(row)
        try:
            team["missing_positions"] = json.loads(row["missing_positions"])
        except (json.JSONDecodeError, TypeError):
            team["missing_positions"] = []
        members = db.execute("""
            SELECT tm.*, u.nickname, u.avatar_url
            FROM team_members tm LEFT JOIN users u ON tm.openid = u.openid
            WHERE tm.team_id = ?
        """, (row["id"],)).fetchall()
        team["members"] = [dict(m) for m in members]
        team["has_joined"] = True
        team["is_creator"] = True
        published.append(team)

    # 我报名的（不包含自己发布的）
    joined_rows = db.execute("""
        SELECT t.*, u.nickname as creator_nickname, u.avatar_url as creator_avatar,
               (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN users u ON t.creator_openid = u.openid
        WHERE tm.openid = ? AND t.creator_openid != ?
        ORDER BY t.created_at DESC
    """, (actual_openid, actual_openid)).fetchall()

    joined = []
    for row in joined_rows:
        team = dict(row)
        try:
            team["missing_positions"] = json.loads(row["missing_positions"])
        except (json.JSONDecodeError, TypeError):
            team["missing_positions"] = []
        members = db.execute("""
            SELECT tm.*, u.nickname, u.avatar_url
            FROM team_members tm LEFT JOIN users u ON tm.openid = u.openid
            WHERE tm.team_id = ?
        """, (row["id"],)).fetchall()
        team["members"] = [dict(m) for m in members]
        team["has_joined"] = True
        team["is_creator"] = False
        joined.append(team)

    db.close()
    return {"published": published, "joined": joined}


# ═══════════════════════════════════════
#  启动
# ═══════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8800)
