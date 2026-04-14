from datetime import datetime

from pydantic import BaseModel


class AlertRead(BaseModel):
    id: str
    user_id: str
    member_name: str
    severity: str
    alert_type: str
    message: str
    resolved: bool
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class AlertList(BaseModel):
    items: list[AlertRead]
    total: int
