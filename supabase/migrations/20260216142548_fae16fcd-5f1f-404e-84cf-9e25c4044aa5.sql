
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('developer', 'admin', 'seller');

-- 2. Tabela user_roles (separada de profiles, conforme boas práticas)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função SECURITY DEFINER para checar role sem recursão
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Policies para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'developer'));

-- 5. Tabela profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Tabela sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product VARCHAR(100) NOT NULL,
  plan VARCHAR(50),
  period VARCHAR(20),
  value NUMERIC(10,2) DEFAULT 0,
  week INTEGER,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sales"
  ON public.sales FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all sales"
  ON public.sales FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Admins can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'));

-- 7. Tabela calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  had_sale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own calls"
  ON public.calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calls"
  ON public.calls FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all calls"
  ON public.calls FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

-- 8. Tabela ai_feedbacks
CREATE TABLE public.ai_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL UNIQUE,
  summary TEXT,
  strengths TEXT,
  weaknesses TEXT,
  tone VARCHAR(50),
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedbacks of own calls"
  ON public.ai_feedbacks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.calls WHERE calls.id = ai_feedbacks.call_id AND calls.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all feedbacks"
  ON public.ai_feedbacks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all feedbacks"
  ON public.ai_feedbacks FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

-- 9. Tabela tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

-- 10. Tabela call_tags (junção N:N)
CREATE TABLE public.call_tags (
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (call_id, tag_id)
);
ALTER TABLE public.call_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags of own calls"
  ON public.call_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.calls WHERE calls.id = call_tags.call_id AND calls.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all call_tags"
  ON public.call_tags FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all call_tags"
  ON public.call_tags FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

-- 11. Tabela notebooks
CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notebooks"
  ON public.notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notebooks"
  ON public.notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notebooks"
  ON public.notebooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notebooks"
  ON public.notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Tabela notebook_pages
CREATE TABLE public.notebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(120),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notebook pages"
  ON public.notebook_pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.notebooks WHERE notebooks.id = notebook_pages.notebook_id AND notebooks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own notebook pages"
  ON public.notebook_pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notebooks WHERE notebooks.id = notebook_pages.notebook_id AND notebooks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own notebook pages"
  ON public.notebook_pages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.notebooks WHERE notebooks.id = notebook_pages.notebook_id AND notebooks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own notebook pages"
  ON public.notebook_pages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.notebooks WHERE notebooks.id = notebook_pages.notebook_id AND notebooks.user_id = auth.uid()
  ));

-- 13. Tabela idle_time_logs
CREATE TABLE public.idle_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  days_since_last_sale INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.idle_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own idle logs"
  ON public.idle_time_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all idle logs"
  ON public.idle_time_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all idle logs"
  ON public.idle_time_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

-- 14. Tabela ai_error_logs
CREATE TABLE public.ai_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devs can view all error logs"
  ON public.ai_error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Admins can view error logs"
  ON public.ai_error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notebook_pages_updated_at
  BEFORE UPDATE ON public.notebook_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Trigger para auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. Inserir tags padrão
INSERT INTO public.tags (name) VALUES
  ('oportunidade_perdida'),
  ('bom_aproveitamento'),
  ('poderia_ser_melhor'),
  ('excelente'),
  ('venda_rapida'),
  ('upsell'),
  ('reclamacao'),
  ('cancelamento'),
  ('retencao'),
  ('novo_cliente');
