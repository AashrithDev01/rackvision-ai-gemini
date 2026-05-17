
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  summary TEXT,
  root_cause TEXT,
  affected_devices JSONB DEFAULT '[]'::jsonb,
  resolution_steps JSONB DEFAULT '[]'::jsonb,
  verification TEXT,
  notes TEXT,
  image_url TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  question TEXT,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Demo/hackathon: public access policies (no auth required)
CREATE POLICY "public read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "public write incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "public update incidents" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "public delete incidents" ON public.incidents FOR DELETE USING (true);

CREATE POLICY "public read analysis" ON public.analysis_results FOR SELECT USING (true);
CREATE POLICY "public write analysis" ON public.analysis_results FOR INSERT WITH CHECK (true);

CREATE POLICY "public read sessions" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "public write sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "public read messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "public write messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Storage bucket for uploaded infrastructure images
INSERT INTO storage.buckets (id, name, public) VALUES ('infra-images', 'infra-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read infra images" ON storage.objects FOR SELECT USING (bucket_id = 'infra-images');
CREATE POLICY "public upload infra images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'infra-images');
