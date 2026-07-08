"""Update database schema for 4-role enterprise RBAC.

Revision ID: 0002_rbac_update
Revises: 0001_initial
Create Date: 2026-07-08 15:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0002_rbac_update"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add columns to stores and users
    op.add_column(
        "stores",
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "users",
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id", ondelete="SET NULL"), nullable=True),
    )

    # 2. Update role names in the roles table
    # Update ID 1: SuperAdmin -> Administrator
    op.execute("UPDATE roles SET role_name = 'Administrator' WHERE id = 1")
    # Update ID 2: StoreManager -> Store Manager
    op.execute("UPDATE roles SET role_name = 'Store Manager' WHERE id = 2")
    # Update ID 3: Analyst -> Retail Analyst
    op.execute("UPDATE roles SET role_name = 'Retail Analyst' WHERE id = 3")

    # 3. Add new Marketing Manager role
    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Integer()),
        sa.column("role_name", sa.String()),
    )
    op.bulk_insert(
        roles_table,
        [
            {"id": 4, "role_name": "Marketing Manager"},
        ],
    )


def downgrade() -> None:
    # Remove Marketing Manager
    op.execute("DELETE FROM roles WHERE id = 4")

    # Revert roles
    op.execute("UPDATE roles SET role_name = 'SuperAdmin' WHERE id = 1")
    op.execute("UPDATE roles SET role_name = 'StoreManager' WHERE id = 2")
    op.execute("UPDATE roles SET role_name = 'Analyst' WHERE id = 3")

    # Drop columns
    op.drop_column("users", "store_id")
    op.drop_column("stores", "is_approved")
