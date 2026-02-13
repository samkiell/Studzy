-- RPC for incrementing view count
CREATE OR REPLACE FUNCTION increment_view_count(resource_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE resources
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = resource_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for incrementing completion count
CREATE OR REPLACE FUNCTION increment_completion_count(resource_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE resources
  SET completion_count = COALESCE(completion_count, 0) + 1
  WHERE id = resource_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
