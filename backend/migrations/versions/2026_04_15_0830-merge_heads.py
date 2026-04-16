"""merge coachboard and main heads

Revision ID: a1b2c3merge01
Revises: cdac07b15b04, c20d82e05c4d

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "a1b2c3merge01"
down_revision: tuple[str, str] = ("cdac07b15b04", "c20d82e05c4d")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
