-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to notify webhook on reservation changes
CREATE OR REPLACE FUNCTION notify_reservation_webhook()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  webhook_url text := 'https://aispzwadwdikqmtpmqii.supabase.co/functions/v1/notify-webhook';
  request_id bigint;
BEGIN
  -- Prepare the webhook payload
  payload := jsonb_build_object(
    'event_type', TG_OP,
    'table', TG_TABLE_NAME,
    'timestamp', now(),
    'new_record', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE null END,
    'old_record', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE null END
  );

  -- Make asynchronous HTTP request to edge function
  SELECT net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  ) INTO request_id;

  -- Log the request for debugging
  RAISE LOG 'Webhook notification sent with request_id: %, payload: %', request_id, payload;

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on nyirok_reservations table
DROP TRIGGER IF EXISTS reservation_webhook_trigger ON nyirok_reservations;
CREATE TRIGGER reservation_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON nyirok_reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_webhook();