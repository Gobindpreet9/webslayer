from typing import List
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.models import SchemaDefinition as SchemaDefinitionPydantic
from api.models import SchemaField as SchemaFieldPydantic
from core.database.postgres_database import Base
from core.models.base import TimestampMixin

class SchemaDefinition(Base, TimestampMixin):
    __tablename__ = "schema_definitions"

    name: Mapped[str] = mapped_column(String(255), primary_key=True)
    fields: Mapped[List["SchemaField"]] = relationship(
        "SchemaField",
        back_populates="schema_definition",
        cascade="all, delete-orphan",
        primaryjoin="SchemaDefinition.name == SchemaField.schema_definition_name",
        lazy="selectin"
    )

    def to_pydantic(self) -> SchemaDefinitionPydantic:
        """Convert SQLAlchemy model to Pydantic model"""
        return SchemaDefinitionPydantic(
            name=self.name,
            fields=[
                SchemaFieldPydantic(
                    name=field.name,
                    field_type=field.field_type,
                    description=field.description,
                    required=field.required,
                    list_item_type=field.list_item_type,
                    default_value=field.default_value
                )
                for field in self.fields
            ]
        )