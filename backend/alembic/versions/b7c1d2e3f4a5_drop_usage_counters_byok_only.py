"""drop usage counters: bring-your-own-key only

Revision ID: b7c1d2e3f4a5
Revises: 300a976995e5
Create Date: 2026-11-20 17:00:00

The daily free allowance on a shared server key is gone (product decision): every AI action
runs on the user's own Groq key, so there is nothing left to count.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c1d2e3f4a5'
down_revision: Union[str, Sequence[str], None] = '300a976995e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('usage_counters')


def downgrade() -> None:
    op.create_table('usage_counters',
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('day', sa.Date(), nullable=False),
    sa.Column('action', sa.String(length=30), nullable=False),
    sa.Column('count', sa.Integer(), server_default='0', nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'day', 'action')
    )
