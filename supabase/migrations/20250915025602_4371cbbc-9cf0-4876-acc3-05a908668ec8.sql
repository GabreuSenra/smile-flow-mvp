-- Add clinic rooms/offices configuration
ALTER TABLE clinic_settings 
ADD CONSTRAINT unique_clinic_setting UNIQUE (clinic_id, setting_key);

-- Insert default room configuration for existing clinics
INSERT INTO clinic_settings (clinic_id, setting_key, setting_value)
SELECT DISTINCT id, 'rooms', '{"total_rooms": 2, "room_names": ["Consultório 1", "Consultório 2"]}'::jsonb
FROM clinics
ON CONFLICT (clinic_id, setting_key) DO NOTHING;