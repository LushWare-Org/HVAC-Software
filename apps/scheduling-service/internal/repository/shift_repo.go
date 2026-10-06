package repository

import (
	"context"
	"errors"
)

// ShiftRow is one technician's own entry for one date: off, or different hours.
// Dates without a row are standard working days.
type ShiftRow struct {
	TechnicianID   string  `json:"technicianId"`
	TechnicianName string  `json:"technicianName"`
	Date           string  `json:"date"` // YYYY-MM-DD
	Available      bool    `json:"available"`
	Start          string  `json:"start"` // HH:MM, local
	End            string  `json:"end"`
	Note           *string `json:"note,omitempty"`
}

var ErrTechnicianNotFound = errors.New("technician not found")

// ShiftOverrides lists entries between two local dates, inclusive.
func (r *SlotRepository) ShiftOverrides(ctx context.Context, companyID, from, to string) ([]ShiftRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT s.technician_id::text, t.name, to_char(s.shift_date, 'YYYY-MM-DD'), s.is_available,
		       to_char(s.start_time, 'HH24:MI'), to_char(s.end_time, 'HH24:MI'), s.notes
		FROM   scheduling.technician_shifts s
		JOIN   scheduling.technicians t ON t.id = s.technician_id
		WHERE  s.company_id = $1 AND s.shift_date BETWEEN $2::date AND $3::date
		ORDER BY s.shift_date, t.name`, companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ShiftRow{}
	for rows.Next() {
		var s ShiftRow
		if err := rows.Scan(&s.TechnicianID, &s.TechnicianName, &s.Date, &s.Available, &s.Start, &s.End, &s.Note); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// SetShift records a technician's day: off, or working start-end. The
// technician must belong to the company.
func (r *SlotRepository) SetShift(ctx context.Context, companyID, technicianID, date string, available bool, start, end string, note *string) error {
	tag, err := r.db.Exec(ctx, `
		INSERT INTO scheduling.technician_shifts (technician_id, company_id, shift_date, start_time, end_time, is_available, notes)
		SELECT t.id, t.company_id, $3::date, $4::time, $5::time, $6, $7
		FROM   scheduling.technicians t
		WHERE  t.id::text = $2 AND t.company_id = $1
		ON CONFLICT (technician_id, shift_date) DO UPDATE
		   SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
		       is_available = EXCLUDED.is_available, notes = EXCLUDED.notes`,
		companyID, technicianID, date, start, end, available, note)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrTechnicianNotFound
	}
	return nil
}

// ClearShift puts a date back to a standard working day.
func (r *SlotRepository) ClearShift(ctx context.Context, companyID, technicianID, date string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM scheduling.technician_shifts
		WHERE company_id = $1 AND technician_id::text = $2 AND shift_date = $3::date`,
		companyID, technicianID, date)
	return err
}
