--
-- PostgreSQL database dump
--

\restrict qoHs6KTqoQEtkRwkfYMA1Dj9Yj4Nc1W4QOrF1qwOaWld1PP8UTGm7jIpSrb0PbO

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    entity_type character varying(255),
    entity_id integer,
    details jsonb,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: billing_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_rates (
    id integer NOT NULL,
    delivery_sheet_id integer,
    medium_rate numeric(10,2) DEFAULT 0.00 NOT NULL,
    super_small_rate numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.billing_rates OWNER TO postgres;

--
-- Name: billing_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.billing_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_rates_id_seq OWNER TO postgres;

--
-- Name: billing_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billing_rates_id_seq OWNED BY public.billing_rates.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    default_weight numeric(10,2) DEFAULT 30.00,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    mobile character varying(15) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_items (
    id integer NOT NULL,
    delivery_sheet_id integer,
    customer_id integer,
    medium_bags integer DEFAULT 0 NOT NULL,
    super_small_bags integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_positive_bags CHECK (((medium_bags >= 0) AND (super_small_bags >= 0)))
);


ALTER TABLE public.delivery_items OWNER TO postgres;

--
-- Name: delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_items_id_seq OWNER TO postgres;

--
-- Name: delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_items_id_seq OWNED BY public.delivery_items.id;


--
-- Name: delivery_quantities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_quantities (
    id integer NOT NULL,
    delivery_item_id integer,
    category_id integer,
    bags integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.delivery_quantities OWNER TO postgres;

--
-- Name: delivery_quantities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_quantities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_quantities_id_seq OWNER TO postgres;

--
-- Name: delivery_quantities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_quantities_id_seq OWNED BY public.delivery_quantities.id;


--
-- Name: delivery_sheet_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_sheet_rates (
    id integer NOT NULL,
    delivery_sheet_id integer,
    category_id integer,
    rate numeric(10,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.delivery_sheet_rates OWNER TO postgres;

--
-- Name: delivery_sheet_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_sheet_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_sheet_rates_id_seq OWNER TO postgres;

--
-- Name: delivery_sheet_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_sheet_rates_id_seq OWNED BY public.delivery_sheet_rates.id;


--
-- Name: delivery_sheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_sheets (
    id integer NOT NULL,
    truck_number character varying(50) NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    driver_name character varying(255) DEFAULT 'Akhtar'::character varying,
    is_deleted boolean DEFAULT false,
    temp_id character varying(255),
    CONSTRAINT delivery_sheets_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'billed'::character varying])::text[])))
);


ALTER TABLE public.delivery_sheets OWNER TO postgres;

--
-- Name: delivery_sheets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_sheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_sheets_id_seq OWNER TO postgres;

--
-- Name: delivery_sheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_sheets_id_seq OWNED BY public.delivery_sheets.id;


--
-- Name: financial_year_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_year_summary (
    id integer NOT NULL,
    financial_year_id integer,
    total_sales numeric(15,2) DEFAULT 0,
    total_discount numeric(15,2) DEFAULT 0,
    total_gst_collected numeric(15,2) DEFAULT 0,
    total_payments numeric(15,2) DEFAULT 0,
    total_pending numeric(15,2) DEFAULT 0,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_year_summary OWNER TO postgres;

--
-- Name: financial_year_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_year_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_year_summary_id_seq OWNER TO postgres;

--
-- Name: financial_year_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_year_summary_id_seq OWNED BY public.financial_year_summary.id;


--
-- Name: financial_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_years (
    id integer NOT NULL,
    year_label character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false,
    is_soft_locked boolean DEFAULT false,
    closed_at timestamp without time zone,
    closed_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_years OWNER TO postgres;

--
-- Name: financial_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_years_id_seq OWNER TO postgres;

--
-- Name: financial_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_years_id_seq OWNED BY public.financial_years.id;


--
-- Name: godown_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.godown_invoice_items (
    id integer NOT NULL,
    godown_invoice_id integer,
    category character varying(50) NOT NULL,
    bags integer NOT NULL,
    rate numeric(10,2) NOT NULL,
    CONSTRAINT godown_invoice_items_bags_check CHECK ((bags >= 0)),
    CONSTRAINT godown_invoice_items_rate_check CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.godown_invoice_items OWNER TO postgres;

--
-- Name: godown_invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.godown_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.godown_invoice_items_id_seq OWNER TO postgres;

--
-- Name: godown_invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.godown_invoice_items_id_seq OWNED BY public.godown_invoice_items.id;


--
-- Name: godown_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.godown_invoices (
    id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    customer_id integer,
    invoice_date date NOT NULL,
    base_amount numeric(12,2) DEFAULT 0 NOT NULL,
    sgst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    cgst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT godown_invoices_status_check CHECK (((status)::text = ANY ((ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying])::text[])))
);


ALTER TABLE public.godown_invoices OWNER TO postgres;

--
-- Name: godown_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.godown_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.godown_invoices_id_seq OWNER TO postgres;

--
-- Name: godown_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.godown_invoices_id_seq OWNED BY public.godown_invoices.id;


--
-- Name: godown_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.godown_payments (
    id integer NOT NULL,
    godown_invoice_id integer,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_date date NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT godown_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT godown_payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'upi'::character varying, 'cheque'::character varying, 'bank'::character varying])::text[])))
);


ALTER TABLE public.godown_payments OWNER TO postgres;

--
-- Name: godown_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.godown_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.godown_payments_id_seq OWNER TO postgres;

--
-- Name: godown_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.godown_payments_id_seq OWNED BY public.godown_payments.id;


--
-- Name: godown_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.godown_stock (
    id integer NOT NULL,
    category character varying(50) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT godown_stock_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.godown_stock OWNER TO postgres;

--
-- Name: godown_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.godown_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.godown_stock_id_seq OWNER TO postgres;

--
-- Name: godown_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.godown_stock_id_seq OWNED BY public.godown_stock.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    delivery_sheet_id integer,
    customer_id integer,
    subtotal numeric(12,2) NOT NULL,
    sgst_amount numeric(12,2) NOT NULL,
    cgst_amount numeric(12,2) NOT NULL,
    expense_amount numeric(12,2) DEFAULT 0.00,
    total_amount numeric(12,2) NOT NULL,
    status character varying(50) DEFAULT 'unpaid'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    discount_type character varying(50),
    discount_value numeric(10,2) DEFAULT NULL::numeric,
    discount_amount numeric(12,2) DEFAULT 0.00,
    CONSTRAINT invoices_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: payment_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_adjustments (
    id integer NOT NULL,
    invoice_id integer,
    adjustment_type character varying(50) DEFAULT 'discount'::character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_adjustments OWNER TO postgres;

--
-- Name: payment_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_adjustments_id_seq OWNER TO postgres;

--
-- Name: payment_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_adjustments_id_seq OWNED BY public.payment_adjustments.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer,
    customer_id integer,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_positive_payment CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'upi'::character varying, 'cheque'::character varying, 'bank'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    category character varying(50) NOT NULL,
    movement_type character varying(50) NOT NULL,
    bags integer NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['factory_in'::character varying, 'delivery_out'::character varying, 'godown_in'::character varying])::text[])))
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_id_seq OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    mobile character varying(15) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['driver'::character varying, 'manager'::character varying, 'owner'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: billing_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_rates ALTER COLUMN id SET DEFAULT nextval('public.billing_rates_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_items ALTER COLUMN id SET DEFAULT nextval('public.delivery_items_id_seq'::regclass);


--
-- Name: delivery_quantities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_quantities ALTER COLUMN id SET DEFAULT nextval('public.delivery_quantities_id_seq'::regclass);


--
-- Name: delivery_sheet_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheet_rates ALTER COLUMN id SET DEFAULT nextval('public.delivery_sheet_rates_id_seq'::regclass);


--
-- Name: delivery_sheets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheets ALTER COLUMN id SET DEFAULT nextval('public.delivery_sheets_id_seq'::regclass);


--
-- Name: financial_year_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_year_summary ALTER COLUMN id SET DEFAULT nextval('public.financial_year_summary_id_seq'::regclass);


--
-- Name: financial_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_years ALTER COLUMN id SET DEFAULT nextval('public.financial_years_id_seq'::regclass);


--
-- Name: godown_invoice_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.godown_invoice_items_id_seq'::regclass);


--
-- Name: godown_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoices ALTER COLUMN id SET DEFAULT nextval('public.godown_invoices_id_seq'::regclass);


--
-- Name: godown_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_payments ALTER COLUMN id SET DEFAULT nextval('public.godown_payments_id_seq'::regclass);


--
-- Name: godown_stock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_stock ALTER COLUMN id SET DEFAULT nextval('public.godown_stock_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: payment_adjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments ALTER COLUMN id SET DEFAULT nextval('public.payment_adjustments_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, "timestamp") FROM stdin;
1	7	CREATE	CUSTOMER	1	{"name": "Pragat "}	2026-02-22 14:33:29.166439
2	7	CREATE	CUSTOMER	2	{"name": "Jayshankar Larasi"}	2026-02-22 14:34:37.931005
3	7	CREATE	CUSTOMER	3	{"name": "Shubham dhole"}	2026-02-22 14:35:05.231424
4	7	CREATE	CUSTOMER	4	{"name": "Hariyana jalebi "}	2026-02-22 14:35:36.061666
5	7	CREATE	CUSTOMER	5	{"name": "Andhalkar "}	2026-02-22 14:36:07.695914
6	7	CREATE	CUSTOMER	6	{"name": "Omkar"}	2026-02-22 14:36:34.801675
7	7	CREATE	CUSTOMER	7	{"name": "Nabi "}	2026-02-22 14:36:59.296537
8	7	CREATE	CUSTOMER	8	{"name": "Amrapali"}	2026-02-22 14:37:20.874944
9	7	CREATE	CUSTOMER	9	{"name": "Dandnayak"}	2026-02-22 14:38:13.133594
10	7	CREATE	CUSTOMER	10	{"name": "Jayshri jhanda "}	2026-02-22 14:38:42.975925
11	7	CREATE	CUSTOMER	11	{"name": "Vikram Kale "}	2026-02-22 14:39:08.504544
12	7	CREATE	CUSTOMER	12	{"name": "Raju Dhole"}	2026-02-22 14:39:23.580351
13	7	CREATE	CUSTOMER	13	{"name": "Bhavana kirana"}	2026-02-22 14:39:38.020455
14	7	CREATE	CUSTOMER	14	{"name": "Pandu Kothimbire"}	2026-02-22 14:40:42.745165
15	7	CREATE	CUSTOMER	15	{"name": "Bhagwan Kirana"}	2026-02-22 14:40:58.970473
16	7	CREATE	CUSTOMER	16	{"name": "Sujata Bakers"}	2026-02-22 14:41:19.488011
17	7	CREATE	CUSTOMER	17	{"name": "Mahadev Sweet"}	2026-02-22 14:41:42.04829
18	7	CREATE	CUSTOMER	18	{"name": "Jaishankar "}	2026-02-22 14:41:57.353156
19	7	CREATE	CUSTOMER	19	{"name": "Sidhankar "}	2026-02-22 14:42:32.404628
20	7	CREATE	CUSTOMER	20	{"name": "Swastik "}	2026-02-22 14:42:49.372058
21	7	CREATE	CUSTOMER	21	{"name": "S Munot"}	2026-02-22 14:43:10.612917
22	7	CREATE	CUSTOMER	22	{"name": "Jayshree kale"}	2026-02-22 14:43:30.363494
23	7	CREATE	CUSTOMER	23	{"name": "Jayesh "}	2026-02-22 14:43:44.991087
24	7	CREATE	CUSTOMER	24	{"name": "Honrao"}	2026-02-22 14:43:59.182059
25	7	CREATE	CUSTOMER	25	{"name": "Gandhi "}	2026-02-22 14:44:20.092044
26	7	CREATE	CUSTOMER	26	{"name": "Alankar "}	2026-02-22 14:44:39.59218
27	7	CREATE	CUSTOMER	27	{"name": "Kothimbire"}	2026-02-22 14:45:06.178233
28	7	CREATE	CUSTOMER	28	{"name": "Ramesh Bhagwan"}	2026-02-22 14:45:21.826887
29	7	CREATE	CUSTOMER	29	{"name": "Ramesh Bhagwan"}	2026-02-22 14:46:55.232881
30	7	CREATE	CUSTOMER	30	{"name": "Bikaner"}	2026-02-22 14:47:27.882136
31	7	CREATE	CUSTOMER	31	{"name": "Dr Anand "}	2026-02-22 14:47:45.602714
32	7	CREATE	CUSTOMER	32	{"name": "Jay Malhar"}	2026-02-22 14:48:07.458141
33	7	CREATE	CUSTOMER	33	{"name": "Dr nayne "}	2026-02-22 14:48:33.249855
34	7	CREATE	CUSTOMER	34	{"name": "Shri malaji"}	2026-02-22 14:48:48.933334
35	7	CREATE	CUSTOMER	35	{"name": "Mauli "}	2026-02-22 14:49:08.912544
36	7	CREATE	CUSTOMER	36	{"name": "More"}	2026-02-22 14:49:23.456049
37	7	CREATE	CUSTOMER	37	{"name": "Gadilekar "}	2026-02-22 14:50:51.310727
38	7	CREATE	CUSTOMER	38	{"name": "Kidare"}	2026-02-22 14:52:33.316875
39	8	GENERATE_INVOICES	DELIVERY_SHEET	1	{"count": 37}	2026-02-22 16:10:39.571773
\.


--
-- Data for Name: billing_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_rates (id, delivery_sheet_id, medium_rate, super_small_rate, created_by, created_at) FROM stdin;
1	1	2030.00	1980.00	1	2026-02-22 16:10:39.304249
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, default_weight, is_active, created_at) FROM stdin;
1	medium	50.00	t	2026-02-22 15:14:20.571383
2	super_small	50.00	t	2026-02-22 15:14:20.571383
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, mobile, address, created_at, is_deleted) FROM stdin;
1	Pragat 	0000000001		2026-02-22 14:33:29.16106	f
2	Jayshankar Larasi	0000000002		2026-02-22 14:34:37.927974	f
3	Shubham dhole	0000000003		2026-02-22 14:35:05.227523	f
4	Hariyana jalebi 	0000000004		2026-02-22 14:35:36.057673	f
5	Andhalkar 	0000000005		2026-02-22 14:36:07.691282	f
6	Omkar	0000000006		2026-02-22 14:36:34.798773	f
7	Nabi 	0000000007		2026-02-22 14:36:59.293146	f
8	Amrapali	0000000008		2026-02-22 14:37:20.871923	f
9	Dandnayak	0000000009		2026-02-22 14:38:13.13079	f
10	Jayshri jhanda 	0000000010		2026-02-22 14:38:42.97225	f
11	Vikram Kale 	0000000011		2026-02-22 14:39:08.500127	f
12	Raju Dhole	0000000012		2026-02-22 14:39:23.576977	f
13	Bhavana kirana	0000000013		2026-02-22 14:39:38.016202	f
14	Pandu Kothimbire	0000000014		2026-02-22 14:40:42.739043	f
15	Bhagwan Kirana	0000000015		2026-02-22 14:40:58.967219	f
16	Sujata Bakers	0000000016		2026-02-22 14:41:19.483793	f
17	Mahadev Sweet	0000000017		2026-02-22 14:41:42.04373	f
18	Jaishankar 	0000000018		2026-02-22 14:41:57.350012	f
19	Sidhankar 	0000000019		2026-02-22 14:42:32.398938	f
20	Swastik 	0000000020		2026-02-22 14:42:49.368962	f
21	S Munot	0000000021		2026-02-22 14:43:10.609178	f
22	Jayshree kale	0000000022		2026-02-22 14:43:30.360934	f
23	Jayesh 	0000000023		2026-02-22 14:43:44.987972	f
24	Honrao	0000000024		2026-02-22 14:43:59.179295	f
25	Gandhi 	0000000025		2026-02-22 14:44:20.087777	f
26	Alankar 	0000000026		2026-02-22 14:44:39.589158	f
27	Kothimbire	0000000027		2026-02-22 14:45:06.175566	f
28	Ramesh Bhagwan	0000000028		2026-02-22 14:45:21.822756	f
29	Ramesh Bhagwan	0000000029		2026-02-22 14:46:55.226576	f
30	Bikaner	0000000030		2026-02-22 14:47:27.878952	f
31	Dr Anand 	0000000031		2026-02-22 14:47:45.599722	f
32	Jay Malhar	0000000032		2026-02-22 14:48:07.454106	f
33	Dr nayne 	0000000033		2026-02-22 14:48:33.247167	f
34	Shri malaji	0000000034		2026-02-22 14:48:48.92876	f
35	Mauli 	0000000035		2026-02-22 14:49:08.909565	f
36	More	0000000036		2026-02-22 14:49:23.453677	f
37	Gadilekar 	0000000038		2026-02-22 14:50:51.306513	f
38	Kidare	0000000037		2026-02-22 14:52:33.310874	f
\.


--
-- Data for Name: delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_items (id, delivery_sheet_id, customer_id, medium_bags, super_small_bags, created_at) FROM stdin;
1	1	1	0	0	2026-02-22 15:59:03.653658
2	1	2	0	0	2026-02-22 15:59:04.270749
3	1	3	0	0	2026-02-22 15:59:05.045682
4	1	4	0	0	2026-02-22 15:59:05.78844
5	1	5	0	0	2026-02-22 15:59:07.158934
6	1	6	0	0	2026-02-22 15:59:07.925045
7	1	7	0	0	2026-02-22 15:59:08.98691
8	1	8	0	0	2026-02-22 15:59:09.797914
9	1	9	0	0	2026-02-22 15:59:10.421739
10	1	10	0	0	2026-02-22 15:59:11.674785
11	1	11	0	0	2026-02-22 15:59:12.540231
12	1	12	0	0	2026-02-22 15:59:13.203724
13	1	13	0	0	2026-02-22 15:59:14.238309
14	1	14	0	0	2026-02-22 15:59:15.210457
15	1	15	0	0	2026-02-22 15:59:15.806763
16	1	16	0	0	2026-02-22 15:59:17.885311
17	1	17	0	0	2026-02-22 15:59:18.365457
18	1	18	0	0	2026-02-22 15:59:18.9353
19	1	19	0	0	2026-02-22 15:59:20.642199
20	1	20	0	0	2026-02-22 15:59:21.416629
21	1	21	0	0	2026-02-22 15:59:22.961341
22	1	22	0	0	2026-02-22 15:59:26.74521
23	1	23	0	0	2026-02-22 15:59:27.717769
24	1	24	0	0	2026-02-22 15:59:33.029178
25	1	25	0	0	2026-02-22 15:59:34.032144
26	1	26	0	0	2026-02-22 15:59:36.991935
27	1	27	0	0	2026-02-22 15:59:37.701074
28	1	28	0	0	2026-02-22 15:59:38.598436
29	1	30	0	0	2026-02-22 15:59:39.670593
30	1	31	0	0	2026-02-22 15:59:41.760736
31	1	32	0	0	2026-02-22 15:59:43.821009
32	1	33	0	0	2026-02-22 15:59:45.160318
33	1	34	0	0	2026-02-22 15:59:45.832996
34	1	35	0	0	2026-02-22 15:59:46.565924
35	1	36	0	0	2026-02-22 15:59:48.126037
36	1	38	0	0	2026-02-22 15:59:50.293571
37	1	37	0	0	2026-02-22 15:59:51.920501
\.


--
-- Data for Name: delivery_quantities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_quantities (id, delivery_item_id, category_id, bags) FROM stdin;
1	1	1	50
2	1	2	24
3	2	2	5
4	3	2	5
5	4	2	5
6	5	1	15
7	5	2	15
8	6	1	6
9	6	2	10
10	7	1	30
11	7	2	5
12	8	1	4
13	9	1	3
14	10	2	4
15	11	2	4
16	12	2	6
17	13	1	4
18	14	1	1
19	15	1	5
20	16	1	1
21	16	2	2
22	17	2	1
23	18	2	2
24	19	1	8
25	20	1	4
26	21	1	5
27	22	2	2
28	23	1	2
29	24	2	2
30	25	1	2
31	26	1	2
32	27	1	38
33	27	2	2
34	28	1	2
35	29	2	1
36	30	1	4
37	31	1	12
38	31	2	4
39	32	1	1
40	33	1	4
41	34	1	6
42	34	2	2
43	35	1	3
44	36	1	25
45	37	1	22
\.


--
-- Data for Name: delivery_sheet_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_sheet_rates (id, delivery_sheet_id, category_id, rate) FROM stdin;
\.


--
-- Data for Name: delivery_sheets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_sheets (id, truck_number, date, status, created_by, created_at, driver_name, is_deleted, temp_id) FROM stdin;
2	MH 42 B 8828	2026-02-22	draft	1	2026-02-22 23:14:38.067696	Akhtar	f	\N
1	MH 42 B 8828-S1	2026-02-22	billed	1	2026-02-22 15:15:43.13617	Akhtar	f	\N
\.


--
-- Data for Name: financial_year_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_year_summary (id, financial_year_id, total_sales, total_discount, total_gst_collected, total_payments, total_pending, generated_at) FROM stdin;
\.


--
-- Data for Name: financial_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_years (id, year_label, start_date, end_date, is_closed, is_soft_locked, closed_at, closed_by, created_at) FROM stdin;
1	FY 2025-26	2025-04-01	2026-03-31	f	f	\N	\N	2026-02-22 15:14:20.571383
\.


--
-- Data for Name: godown_invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.godown_invoice_items (id, godown_invoice_id, category, bags, rate) FROM stdin;
1	1	Medium	5	2030.00
\.


--
-- Data for Name: godown_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.godown_invoices (id, invoice_number, customer_id, invoice_date, base_amount, sgst_amount, cgst_amount, discount_amount, total_amount, status, created_by, created_at) FROM stdin;
1	GDN-2026-0001	23	2026-02-22	9666.67	241.67	241.67	0.00	10150.00	paid	2	2026-02-22 23:10:10.565154
\.


--
-- Data for Name: godown_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.godown_payments (id, godown_invoice_id, amount, payment_method, payment_date, created_by, created_at) FROM stdin;
1	1	10150.00	cash	2026-02-22	2	2026-02-22 23:10:29.696602
\.


--
-- Data for Name: godown_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.godown_stock (id, category, quantity, updated_at) FROM stdin;
2	Super Small	55	2026-02-22 23:09:22.809331
1	Medium	45	2026-02-22 23:10:10.565154
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, delivery_sheet_id, customer_id, subtotal, sgst_amount, cgst_amount, expense_amount, total_amount, status, created_at, is_deleted, discount_type, discount_value, discount_amount) FROM stdin;
1	1	1	141923.81	3548.09	3548.09	0.00	149020.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
2	1	2	9428.57	235.72	235.72	0.00	9900.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
3	1	3	9428.57	235.72	235.72	0.00	9900.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
4	1	4	9428.57	235.72	235.72	0.00	9900.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
5	1	5	57285.71	1432.14	1432.14	0.00	60150.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
6	1	6	30457.14	761.43	761.43	0.00	31980.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
7	1	7	67428.57	1685.71	1685.71	0.00	70800.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
8	1	8	7733.33	193.34	193.34	0.00	8120.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
9	1	9	5800.00	145.00	145.00	0.00	6090.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
10	1	10	7542.86	188.57	188.57	0.00	7920.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
11	1	11	7542.86	188.57	188.57	0.00	7920.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
12	1	12	11314.29	282.86	282.86	0.00	11880.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
13	1	13	7733.33	193.34	193.34	0.00	8120.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
14	1	14	1933.33	48.34	48.34	0.00	2030.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
15	1	15	9666.67	241.66	241.66	0.00	10150.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
16	1	16	5704.76	142.62	142.62	0.00	5990.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
17	1	17	1885.71	47.15	47.15	0.00	1980.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
18	1	18	3771.43	94.28	94.28	0.00	3960.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
19	1	19	15466.67	386.67	386.67	0.00	16240.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
20	1	20	7733.33	193.34	193.34	0.00	8120.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
21	1	21	9666.67	241.66	241.66	0.00	10150.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
22	1	22	3771.43	94.28	94.28	0.00	3960.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
23	1	23	3866.67	96.67	96.67	0.00	4060.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
24	1	24	3771.43	94.28	94.28	0.00	3960.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
25	1	25	3866.67	96.67	96.67	0.00	4060.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
26	1	26	3866.67	96.67	96.67	0.00	4060.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
27	1	27	77238.10	1930.95	1930.95	0.00	81100.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
28	1	28	3866.67	96.67	96.67	0.00	4060.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
29	1	30	1885.71	47.15	47.15	0.00	1980.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
30	1	31	7733.33	193.34	193.34	0.00	8120.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
31	1	32	30742.86	768.57	768.57	0.00	32280.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
33	1	34	7733.33	193.34	193.34	0.00	8120.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
34	1	35	15371.43	384.29	384.29	0.00	16140.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
35	1	36	5800.00	145.00	145.00	0.00	6090.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
36	1	37	42533.33	1063.34	1063.34	0.00	44660.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
37	1	38	48333.33	1208.34	1208.34	0.00	50750.00	unpaid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
32	1	33	1933.33	48.34	48.34	0.00	2030.00	paid	2026-02-22 16:10:39.304249	f	\N	\N	0.00
\.


--
-- Data for Name: payment_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_adjustments (id, invoice_id, adjustment_type, amount, reason, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, customer_id, amount, payment_method, payment_date, created_by, created_at) FROM stdin;
1	32	33	2030.00	cash	2026-02-22	\N	2026-02-22 23:02:15.522042
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, category, movement_type, bags, reference_type, reference_id, created_at) FROM stdin;
1	medium	delivery_out	50	delivery_sheet	1	2026-02-22 16:01:55.513
2	super_small	delivery_out	24	delivery_sheet	1	2026-02-22 16:01:55.513
3	super_small	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
4	super_small	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
5	super_small	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
6	medium	delivery_out	15	delivery_sheet	1	2026-02-22 16:01:55.513
7	super_small	delivery_out	15	delivery_sheet	1	2026-02-22 16:01:55.513
8	medium	delivery_out	6	delivery_sheet	1	2026-02-22 16:01:55.513
9	super_small	delivery_out	10	delivery_sheet	1	2026-02-22 16:01:55.513
10	medium	delivery_out	30	delivery_sheet	1	2026-02-22 16:01:55.513
11	super_small	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
12	medium	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
13	medium	delivery_out	3	delivery_sheet	1	2026-02-22 16:01:55.513
14	super_small	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
15	super_small	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
16	super_small	delivery_out	6	delivery_sheet	1	2026-02-22 16:01:55.513
17	medium	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
18	medium	delivery_out	1	delivery_sheet	1	2026-02-22 16:01:55.513
19	medium	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
20	medium	delivery_out	1	delivery_sheet	1	2026-02-22 16:01:55.513
21	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
22	super_small	delivery_out	1	delivery_sheet	1	2026-02-22 16:01:55.513
23	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
24	medium	delivery_out	8	delivery_sheet	1	2026-02-22 16:01:55.513
25	medium	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
26	medium	delivery_out	5	delivery_sheet	1	2026-02-22 16:01:55.513
27	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
28	medium	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
29	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
30	medium	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
31	medium	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
32	medium	delivery_out	38	delivery_sheet	1	2026-02-22 16:01:55.513
33	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
34	medium	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
35	super_small	delivery_out	1	delivery_sheet	1	2026-02-22 16:01:55.513
36	medium	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
37	medium	delivery_out	12	delivery_sheet	1	2026-02-22 16:01:55.513
38	super_small	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
39	medium	delivery_out	1	delivery_sheet	1	2026-02-22 16:01:55.513
40	medium	delivery_out	4	delivery_sheet	1	2026-02-22 16:01:55.513
41	medium	delivery_out	6	delivery_sheet	1	2026-02-22 16:01:55.513
42	super_small	delivery_out	2	delivery_sheet	1	2026-02-22 16:01:55.513
43	medium	delivery_out	3	delivery_sheet	1	2026-02-22 16:01:55.513
44	medium	delivery_out	22	delivery_sheet	1	2026-02-22 16:01:55.513
45	medium	delivery_out	25	delivery_sheet	1	2026-02-22 16:01:55.513
46	medium	delivery_out	259	Delivery Sheet Billing	1	2026-02-22 16:10:39.304249
47	super_small	delivery_out	101	Delivery Sheet Billing	1	2026-02-22 16:10:39.304249
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, mobile, password, role, created_at) FROM stdin;
9	Bhandari Owner	9876543212	$2b$10$weIWb4.E.MilrLCO6tG5GeQuDuRboRe84uz73gc4PFCirZLXmG7Bi	owner	2026-02-17 22:58:48.168243
3	Bhandari Owner	9422228205	$2b$10$z9s6itzEaWYNKQdgQt7dBOqKJD1KJVzotpVZTgDd7C5k02lJxqVFi	owner	2026-02-17 16:27:23.914697
1	Driver Name	9999999999	$2b$10$m/xxleRnaJ1CPLj0oRorrOESbPoPLszWoDlvQdPOCx62cgwtjZQD6	driver	2026-02-17 16:27:23.779138
7	Somnath Manager	9876543210	$2b$10$LV1Iy0i766cP5EZ4bN78V.qWzudckz7Io812xc2E3cBi7w5weplDe	manager	2026-02-17 21:45:36.802815
2	Somnath Manager	9527042265	$2b$10$hlcZEBjmz4eOUgCp2c5/n.5fMSX4I9d4xHjcjmMWeIF1Fhp.LOqOO	manager	2026-02-17 16:27:23.841906
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 39, true);


--
-- Name: billing_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_rates_id_seq', 1, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 38, true);


--
-- Name: delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_items_id_seq', 37, true);


--
-- Name: delivery_quantities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_quantities_id_seq', 45, true);


--
-- Name: delivery_sheet_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheet_rates_id_seq', 1, false);


--
-- Name: delivery_sheets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheets_id_seq', 2, true);


--
-- Name: financial_year_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_year_summary_id_seq', 1, false);


--
-- Name: financial_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_years_id_seq', 1, true);


--
-- Name: godown_invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.godown_invoice_items_id_seq', 1, true);


--
-- Name: godown_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.godown_invoices_id_seq', 1, true);


--
-- Name: godown_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.godown_payments_id_seq', 1, true);


--
-- Name: godown_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.godown_stock_id_seq', 2, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 37, true);


--
-- Name: payment_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_adjustments_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 47, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_rates billing_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_rates
    ADD CONSTRAINT billing_rates_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_mobile_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_mobile_key UNIQUE (mobile);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_items delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_pkey PRIMARY KEY (id);


--
-- Name: delivery_quantities delivery_quantities_delivery_item_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_quantities
    ADD CONSTRAINT delivery_quantities_delivery_item_id_category_id_key UNIQUE (delivery_item_id, category_id);


--
-- Name: delivery_quantities delivery_quantities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_quantities
    ADD CONSTRAINT delivery_quantities_pkey PRIMARY KEY (id);


--
-- Name: delivery_sheet_rates delivery_sheet_rates_delivery_sheet_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheet_rates
    ADD CONSTRAINT delivery_sheet_rates_delivery_sheet_id_category_id_key UNIQUE (delivery_sheet_id, category_id);


--
-- Name: delivery_sheet_rates delivery_sheet_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheet_rates
    ADD CONSTRAINT delivery_sheet_rates_pkey PRIMARY KEY (id);


--
-- Name: delivery_sheets delivery_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheets
    ADD CONSTRAINT delivery_sheets_pkey PRIMARY KEY (id);


--
-- Name: delivery_sheets delivery_sheets_temp_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheets
    ADD CONSTRAINT delivery_sheets_temp_id_key UNIQUE (temp_id);


--
-- Name: financial_year_summary financial_year_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_year_summary
    ADD CONSTRAINT financial_year_summary_pkey PRIMARY KEY (id);


--
-- Name: financial_years financial_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_years
    ADD CONSTRAINT financial_years_pkey PRIMARY KEY (id);


--
-- Name: financial_years financial_years_year_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_years
    ADD CONSTRAINT financial_years_year_label_key UNIQUE (year_label);


--
-- Name: godown_invoice_items godown_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoice_items
    ADD CONSTRAINT godown_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: godown_invoices godown_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoices
    ADD CONSTRAINT godown_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: godown_invoices godown_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoices
    ADD CONSTRAINT godown_invoices_pkey PRIMARY KEY (id);


--
-- Name: godown_payments godown_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_payments
    ADD CONSTRAINT godown_payments_pkey PRIMARY KEY (id);


--
-- Name: godown_stock godown_stock_category_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_stock
    ADD CONSTRAINT godown_stock_category_key UNIQUE (category);


--
-- Name: godown_stock godown_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_stock
    ADD CONSTRAINT godown_stock_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: payment_adjustments payment_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: delivery_items unique_customer_per_sheet; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT unique_customer_per_sheet UNIQUE (delivery_sheet_id, customer_id);


--
-- Name: users users_mobile_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_key UNIQUE (mobile);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_customers_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_mobile ON public.customers USING btree (mobile);


--
-- Name: idx_delivery_sheets_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_delivery_sheets_date ON public.delivery_sheets USING btree (date);


--
-- Name: idx_invoices_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_created_at ON public.invoices USING btree (created_at);


--
-- Name: idx_invoices_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_customer ON public.invoices USING btree (customer_id);


--
-- Name: idx_invoices_customer_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_customer_created_at ON public.invoices USING btree (customer_id, created_at);


--
-- Name: idx_payment_adjustments_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_adjustments_invoice ON public.payment_adjustments USING btree (invoice_id);


--
-- Name: idx_payments_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_customer_id ON public.payments USING btree (customer_id);


--
-- Name: idx_payments_customer_payment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_customer_payment_date ON public.payments USING btree (customer_id, payment_date);


--
-- Name: idx_payments_payment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_payment_date ON public.payments USING btree (payment_date);


--
-- Name: idx_users_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_mobile ON public.users USING btree (mobile);


--
-- Name: billing_rates billing_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_rates
    ADD CONSTRAINT billing_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: billing_rates billing_rates_delivery_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_rates
    ADD CONSTRAINT billing_rates_delivery_sheet_id_fkey FOREIGN KEY (delivery_sheet_id) REFERENCES public.delivery_sheets(id) ON DELETE CASCADE;


--
-- Name: delivery_items delivery_items_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: delivery_items delivery_items_delivery_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_delivery_sheet_id_fkey FOREIGN KEY (delivery_sheet_id) REFERENCES public.delivery_sheets(id) ON DELETE CASCADE;


--
-- Name: delivery_quantities delivery_quantities_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_quantities
    ADD CONSTRAINT delivery_quantities_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: delivery_quantities delivery_quantities_delivery_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_quantities
    ADD CONSTRAINT delivery_quantities_delivery_item_id_fkey FOREIGN KEY (delivery_item_id) REFERENCES public.delivery_items(id) ON DELETE CASCADE;


--
-- Name: delivery_sheet_rates delivery_sheet_rates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheet_rates
    ADD CONSTRAINT delivery_sheet_rates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: delivery_sheet_rates delivery_sheet_rates_delivery_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheet_rates
    ADD CONSTRAINT delivery_sheet_rates_delivery_sheet_id_fkey FOREIGN KEY (delivery_sheet_id) REFERENCES public.delivery_sheets(id) ON DELETE CASCADE;


--
-- Name: delivery_sheets delivery_sheets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sheets
    ADD CONSTRAINT delivery_sheets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: financial_year_summary financial_year_summary_financial_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_year_summary
    ADD CONSTRAINT financial_year_summary_financial_year_id_fkey FOREIGN KEY (financial_year_id) REFERENCES public.financial_years(id) ON DELETE CASCADE;


--
-- Name: financial_years financial_years_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_years
    ADD CONSTRAINT financial_years_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id);


--
-- Name: godown_invoice_items godown_invoice_items_godown_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoice_items
    ADD CONSTRAINT godown_invoice_items_godown_invoice_id_fkey FOREIGN KEY (godown_invoice_id) REFERENCES public.godown_invoices(id) ON DELETE CASCADE;


--
-- Name: godown_invoices godown_invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoices
    ADD CONSTRAINT godown_invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: godown_invoices godown_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_invoices
    ADD CONSTRAINT godown_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: godown_payments godown_payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_payments
    ADD CONSTRAINT godown_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: godown_payments godown_payments_godown_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.godown_payments
    ADD CONSTRAINT godown_payments_godown_invoice_id_fkey FOREIGN KEY (godown_invoice_id) REFERENCES public.godown_invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: invoices invoices_delivery_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_delivery_sheet_id_fkey FOREIGN KEY (delivery_sheet_id) REFERENCES public.delivery_sheets(id);


--
-- Name: payment_adjustments payment_adjustments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payment_adjustments payment_adjustments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: payments payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- PostgreSQL database dump complete
--

\unrestrict qoHs6KTqoQEtkRwkfYMA1Dj9Yj4Nc1W4QOrF1qwOaWld1PP8UTGm7jIpSrb0PbO

