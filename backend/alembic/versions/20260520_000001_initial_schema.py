"""initial schema

Revision ID: 20260520_000001
Revises: 
Create Date: 2026-05-20 18:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260520_000001"
down_revision = None
branch_labels = None
depends_on = None


contact_request_status = postgresql.ENUM(
    "pending",
    "accepted",
    "rejected",
    name="contactrequeststatus",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    contact_request_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("login", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_login"), "users", ["login"], unique=True)

    op.create_table(
        "contacts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("contact_user_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["contact_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "contact_user_id", name="uq_contacts_pair"),
    )
    op.create_index(op.f("ix_contacts_contact_user_id"), "contacts", ["contact_user_id"], unique=False)
    op.create_index(op.f("ix_contacts_user_id"), "contacts", ["user_id"], unique=False)

    op.create_table(
        "contact_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("from_user_id", sa.String(length=36), nullable=False),
        sa.Column("to_user_id", sa.String(length=36), nullable=False),
        sa.Column("status", contact_request_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("from_user_id", "to_user_id", "status", name="uq_contact_requests_pair_status"),
    )
    op.create_index(op.f("ix_contact_requests_from_user_id"), "contact_requests", ["from_user_id"], unique=False)
    op.create_index(op.f("ix_contact_requests_to_user_id"), "contact_requests", ["to_user_id"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("creator_user_id", sa.String(length=36), nullable=True),
        sa.Column("creator_token", sa.String(length=128), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_code"), "sessions", ["code"], unique=True)
    op.create_index(op.f("ix_sessions_creator_user_id"), "sessions", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_sessions_expires_at"), "sessions", ["expires_at"], unique=False)

    op.create_table(
        "session_files",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("extension", sa.String(length=10), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("size_bytes >= 0", name="ck_session_files_size_positive"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stored_name"),
    )
    op.create_index(op.f("ix_session_files_session_id"), "session_files", ["session_id"], unique=False)

    op.create_table(
        "session_texts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_table("session_texts")
    op.drop_index(op.f("ix_session_files_session_id"), table_name="session_files")
    op.drop_table("session_files")
    op.drop_index(op.f("ix_sessions_expires_at"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_creator_user_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_code"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_contact_requests_to_user_id"), table_name="contact_requests")
    op.drop_index(op.f("ix_contact_requests_from_user_id"), table_name="contact_requests")
    op.drop_table("contact_requests")
    op.drop_index(op.f("ix_contacts_user_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_contact_user_id"), table_name="contacts")
    op.drop_table("contacts")
    op.drop_index(op.f("ix_users_login"), table_name="users")
    op.drop_table("users")

    contact_request_status.drop(bind, checkfirst=True)
