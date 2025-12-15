CREATE OR REPLACE FUNCTION get_doctors_with_details()
RETURNS TABLE (
    id UUID,
    experience_years INT,
    average_rating REAL,
    total_reviews INT,
    is_popular BOOLEAN,
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT,
    specialization_name TEXT,
    next_appointment_date DATE,
    available_slots_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH upcoming_slots AS (
        SELECT
            doctor_id,
            MIN(slot_date) as next_slot_date,
            SUM(max_appointments - COALESCE(booked_appointments, 0)) as total_available_slots
        FROM
            availability_slots
        LEFT JOIN (
            SELECT slot_id, COUNT(*) as booked_appointments
            FROM appointments
            WHERE payment_status IN ('paid', 'pending') AND status <> 'cancelled'
            GROUP BY slot_id
        ) AS booked ON availability_slots.id = booked.slot_id
        WHERE slot_date >= CURRENT_DATE
        GROUP BY doctor_id
    )
    SELECT
        d.id,
        d.experience_years,
        d.average_rating,
        d.total_reviews,
        d.is_popular,
        p.full_name,
        p.avatar_url,
        p.gender,
        s.name as specialization_name,
        us.next_slot_date,
        CAST(us.total_available_slots AS INT)
    FROM
        doctors d
    INNER JOIN
        profiles p ON d.profile_id = p.id
    INNER JOIN
        specializations s ON d.specialization_id = s.id
    LEFT JOIN
        upcoming_slots us ON d.id = us.doctor_id
    WHERE
        d.status = 'approved'
    ORDER BY
        d.is_popular DESC,
        d.average_rating DESC;
END;
$$ LANGUAGE plpgsql;
