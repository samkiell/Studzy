-- =====================================================================
-- NEW-SEMESTER RESET  (Rain session)
-- Atomic: wrapped in one DO block (one transaction). If anything fails,
-- the WHOLE block rolls back — nothing is half-applied.
--
-- Per user decisions:
--   - Clear quiz history (attempts + attempt_answers)        [remove attempts]
--   - Delete bookmarks + discussions                         [#4]
--   - Wipe all CBT questions incl. the 340 orphan STT201     [#2]
--   - Wipe all resources EXCEPT STT202's                     [resources]
--   - Replace old courses with the new catalogue, keep STT202
-- Guard: STT202's resource count must be unchanged, else rollback.
-- =====================================================================
DO $$
DECLARE
  stt_id          uuid;
  stt_res_before  bigint;
  stt_res_after   bigint;
BEGIN
  SELECT id INTO stt_id FROM courses WHERE code = 'STT202';
  IF stt_id IS NULL THEN
    RAISE EXCEPTION 'STT202 not found — aborting, nothing changed.';
  END IF;
  SELECT count(*) INTO stt_res_before FROM resources WHERE course_id = stt_id;

  -- quiz history — answers first (attempt_id FK -> attempts), then attempts
  DELETE FROM attempt_answers WHERE id IS NOT NULL;
  DELETE FROM attempts        WHERE id IS NOT NULL;

  -- (#4) bookmarks + discussions
  DELETE FROM bookmarks   WHERE id IS NOT NULL;
  DELETE FROM discussions WHERE id IS NOT NULL;

  -- RAG embeddings (leftovers; none belong to STT202)
  DELETE FROM study_material_embeddings WHERE id IS NOT NULL;

  -- resources: everything except STT202's (cascades to user_activity / user_progress)
  DELETE FROM resources WHERE course_id <> stt_id;

  -- (#2 + CBT wipe) all questions: STT202 has none; includes the 340 orphan STT201
  DELETE FROM questions WHERE course_code IS DISTINCT FROM 'STT202';

  -- courses: remove old courses, keep STT202 (old courses' theory_exams cascade away)
  DELETE FROM courses WHERE code <> 'STT202';

  -- GUARD: the preserved course must be intact
  SELECT count(*) INTO stt_res_after FROM resources WHERE course_id = stt_id;
  IF stt_res_after <> stt_res_before THEN
    RAISE EXCEPTION 'ABORT: STT202 resources changed (%->%). Rolled back.',
      stt_res_before, stt_res_after;
  END IF;

  -- new-semester courses (STT202 already present, kept above)
  INSERT INTO courses (code, title, is_cbt) VALUES
    ('CSC202', 'Computer Programming II',                       false),
    ('CPE204', 'Intro. to Digital System II',                   false),
    ('CPE206', 'Digital Laboratory I',                          false),
    ('MTH202', 'Mathematical Methods II',                       false),
    ('SEN212', 'Software Engineering Process',                  false),
    ('SEN214', 'Introduction to Mobile Application Development', false),
    ('SEN216', 'Introduction to Web Technologies',              false),
    ('CIS204', 'Introduction to Problem Solving',               false);

  -- preserve STT202; align its title to the new catalogue
  UPDATE courses SET title = 'Probability Distributions I' WHERE code = 'STT202';

  RAISE NOTICE 'New-semester reset OK. STT202 resources kept: %.', stt_res_after;
END $$;
