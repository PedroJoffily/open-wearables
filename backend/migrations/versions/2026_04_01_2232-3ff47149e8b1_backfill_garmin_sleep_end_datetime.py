"""backfill_garmin_sleep_end_datetime

Garmin's durationInSeconds only covers asleep time (deep+light+rem).
This caused end_datetime to be earlier than the actual session end and
duration_seconds to exclude awake periods.

This migration recomputes end_datetime from the last stage in the
sleep_stages JSONB timeline, and updates duration_seconds accordingly.

Revision ID: 3ff47149e8b1
Revises: f99ae82f0470

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3ff47149e8b1"
down_revision: Union[str, None] = "f99ae82f0470"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # For each Garmin sleep record that has sleep_stages data, set
    # end_datetime to the maximum end_time across all stages (if later
    # than the current end_datetime), and recompute duration_seconds.
    op.execute("""
        UPDATE event_record er
        SET
            end_datetime = stage_end,
            duration_seconds = EXTRACT(EPOCH FROM (stage_end - er.start_datetime))::int
        FROM (
            SELECT
                sd.record_id,
                MAX((stage->>'end_time')::timestamptz) AS stage_end
            FROM sleep_details sd
            CROSS JOIN LATERAL jsonb_array_elements(sd.sleep_stages) AS stage
            JOIN event_record_detail erd ON erd.record_id = sd.record_id
            JOIN event_record e ON e.id = erd.record_id
            WHERE sd.sleep_stages IS NOT NULL
              AND jsonb_typeof(sd.sleep_stages) = 'array'
              AND jsonb_array_length(sd.sleep_stages) > 0
              AND e.source_name = 'Garmin'
              AND e.category = 'sleep'
            GROUP BY sd.record_id
        ) sub
        WHERE er.id = sub.record_id
          AND sub.stage_end > er.end_datetime
    """)


def downgrade() -> None:
    # Not reversible: original durationInSeconds from Garmin is not stored
    # separately. Re-ingesting from Garmin API would be needed.
    pass
