"""add avatar_url to users

Revision ID: 20261018_000002
Revises: 20260520_000001
Create Date: 2026-10-18 21:30:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20261018_000002"
down_revision = "20260520_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")

