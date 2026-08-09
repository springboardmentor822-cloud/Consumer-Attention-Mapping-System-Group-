"""add attendance first_seen/last_seen/is_late/source

Revision ID: 229609ac270e
Revises: 8413510b5425
Create Date: 2026-08-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '229609ac270e'
down_revision: Union[str, Sequence[str], None] = '8413510b5425'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('employee_attendance', sa.Column('first_seen', sa.DateTime(timezone=True), nullable=True))
    op.add_column('employee_attendance', sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True))
    op.add_column('employee_attendance', sa.Column('is_late', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('employee_attendance', sa.Column('source', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employee_attendance', 'source')
    op.drop_column('employee_attendance', 'is_late')
    op.drop_column('employee_attendance', 'last_seen')
    op.drop_column('employee_attendance', 'first_seen')
