"""add_camera_calibration

Revision ID: 9c7da7cdee27
Revises: 8c6da7cdee26
Create Date: 2026-08-07 12:28:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9c7da7cdee27'
down_revision: Union[str, None] = '8c6da7cdee26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'camera_calibrations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('camera_id', sa.String(length=36), nullable=False),
        sa.Column('src_points', sa.JSON(), nullable=False),
        sa.Column('dst_points', sa.JSON(), nullable=False),
        sa.Column('homography_matrix', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('camera_id')
    )
    op.create_index(op.f('ix_camera_calibrations_camera_id'), 'camera_calibrations', ['camera_id'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_camera_calibrations_camera_id'), table_name='camera_calibrations')
    op.drop_table('camera_calibrations')
