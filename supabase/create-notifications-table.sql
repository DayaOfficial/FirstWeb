-- Tabel notifikasi owner
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'registration',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  email TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: hanya owner yang bisa baca
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: owner bisa baca semua notifikasi
CREATE POLICY "Owner can read notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- Policy: owner bisa update (mark as read)
CREATE POLICY "Owner can update notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- Policy: owner bisa delete
CREATE POLICY "Owner can delete notifications" ON notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- Policy: service role bisa insert (untuk API register)
CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
