"""Initial schema

Revision ID: 0001
Revises: 
Create Date: 2024-11-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_admins_email', 'admins', ['email'], unique=True)
    op.create_index('ix_admins_id', 'admins', ['id'], unique=False)

    op.create_table(
        'student_registry',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sr_no', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('prn', sa.String(50), nullable=False),
        sa.Column('branch', sa.String(100), nullable=False),
        sa.Column('is_registered', sa.Boolean(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_student_registry_id', 'student_registry', ['id'], unique=False)
    op.create_index('ix_student_registry_prn', 'student_registry', ['prn'], unique=True)

    op.create_table(
        'students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prn', sa.String(50), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('branch', sa.String(100), nullable=False),
        sa.Column('role', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('registry_id', sa.Integer(), sa.ForeignKey('student_registry.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_students_email', 'students', ['email'], unique=True)
    op.create_index('ix_students_id', 'students', ['id'], unique=False)
    op.create_index('ix_students_prn', 'students', ['prn'], unique=True)

    op.create_table(
        'student_forms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('prn', sa.String(50), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('middle_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('father_name', sa.String(200), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('student_mobile', sa.String(15), nullable=False),
        sa.Column('parent_mobile', sa.String(15), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('sgpa', sa.Float(), nullable=False),
        sa.Column('cgpa', sa.Float(), nullable=False),
        sa.Column('backlogs', sa.Integer(), nullable=True),
        sa.Column('preference_1', sa.String(100), nullable=False),
        sa.Column('preference_2', sa.String(100), nullable=False),
        sa.Column('preference_3', sa.String(100), nullable=False),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('admin_remarks', sa.Text(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('is_locked', sa.Boolean(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('admins.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_student_forms_id', 'student_forms', ['id'], unique=False)
    op.create_index('ix_student_forms_student_id', 'student_forms', ['student_id'], unique=False)

    op.create_table(
        'correction_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('form_id', sa.Integer(), sa.ForeignKey('student_forms.id'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('changed_by_role', sa.String(50), nullable=False),
        sa.Column('changed_by_id', sa.Integer(), nullable=False),
        sa.Column('changed_by_name', sa.String(255), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('old_data', sa.JSON(), nullable=True),
        sa.Column('new_data', sa.JSON(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_correction_history_id', 'correction_history', ['id'], unique=False)
    op.create_index('ix_correction_history_form_id', 'correction_history', ['form_id'], unique=False)


def downgrade() -> None:
    op.drop_table('correction_history')
    op.drop_table('student_forms')
    op.drop_table('students')
    op.drop_table('student_registry')
    op.drop_table('admins')
