from enum import Enum
from sqlalchemy import String, Boolean, JSON, Index, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import TimestampMixin
from core.database.postgres_database import Base


class FieldType(str, Enum):
    string = "string"
    integer = "integer"
    float = "float"
    boolean = "boolean"
    list = "list"
    dict = "dict"
    date = "date"

    def __str__(self):
        return self.value

    def _serialize_to_db(self):
        return self.value.lower()


class SchemaField(Base, TimestampMixin):
    __tablename__ = "schema_fields"

    id: Mapped[int] = mapped_column(primary_key=True)
    schema_definition_name: Mapped[str] = mapped_column(
        String(255), 
        ForeignKey("schema_definitions.name", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[FieldType] = mapped_column(
        SQLAlchemyEnum(FieldType, name="field_type", create_type=False), 
        nullable=False
    )
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    list_item_type: Mapped[FieldType | None] = mapped_column(
        SQLAlchemyEnum(FieldType, name="field_type", create_type=False), 
        nullable=True
    )
    default_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    schema_definition: Mapped["SchemaDefinition"] = relationship(
        "SchemaDefinition",
        back_populates="fields"
    )

    __table_args__ = (
        Index("idx_schema_fields_schema_definition_name", "schema_definition_name"),
    )