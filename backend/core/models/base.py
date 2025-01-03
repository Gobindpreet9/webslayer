from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime
from sqlalchemy.sql import func

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )