// src/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://fxwnpebzfcfvqvnxkayn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4d25wZWJ6ZmNmdnF2bnhrYXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzMxMDUsImV4cCI6MjA5NDIwOTEwNX0._94i3GtL_5IPFdm8aVs1RRIhwXEiPd-cudf0Fomh3fs'
);
