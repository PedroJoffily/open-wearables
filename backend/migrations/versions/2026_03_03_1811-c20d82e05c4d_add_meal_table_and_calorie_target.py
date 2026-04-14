"""Add meal table and calorie target

Revision ID: c20d82e05c4d
Revises: a1b2c3d4e5f6

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c20d82e05c4d'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('meal',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('calories_kcal', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('protein_g', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('carbs_g', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('fat_g', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('meal_type', sa.String(length=32), nullable=False),
    sa.Column('eaten_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_meal_user_eaten_at', 'meal', ['user_id', 'eaten_at'], unique=False)
    op.add_column('personal_record', sa.Column('daily_calorie_target_kcal', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('personal_record', 'daily_calorie_target_kcal')
    op.drop_index('idx_meal_user_eaten_at', table_name='meal')
    op.drop_table('meal')
