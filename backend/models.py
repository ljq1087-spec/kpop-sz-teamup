"""Pydantic 数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    """微信登录请求"""
    code: str
    nickname: str = ""
    avatar_url: str = ""


class TeamCreate(BaseModel):
    """创建组队"""
    song_name: str = Field(..., min_length=1, max_length=100)
    missing_positions: List[str] = Field(default_factory=list)
    rehearsal_time: str = Field(..., min_length=1)
    performance_time: str = Field(..., min_length=1)
    max_members: int = Field(default=5, ge=1, le=20)
    join_condition: str = ""
    notes: str = ""
    district: str = ""


class TeamJoin(BaseModel):
    """上车报名"""
    position: str = ""


class TeamListQuery(BaseModel):
    """组队列表查询"""
    status: str = "active"
    district: str = ""
    keyword: str = ""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)


class TeamResponse(BaseModel):
    """组队响应"""
    id: int
    song_name: str
    missing_positions: List[str]
    rehearsal_time: str
    performance_time: str
    max_members: int
    join_condition: str
    notes: str
    district: str
    status: str
    creator_openid: str
    creator_nickname: str = ""
    creator_avatar: str = ""
    member_count: int = 0
    members: List[dict] = []
    created_at: str


class MyTeamsResponse(BaseModel):
    """我的组队"""
    published: List[TeamResponse] = []
    joined: List[TeamResponse] = []
