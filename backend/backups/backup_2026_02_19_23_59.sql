--
-- PostgreSQL database dump
--

\restrict nBJSeVCfAj2Mz1Z5X9kgbeZdkyiFaUcJPadbFTH26c02VkaBcmUrAJym5TTy4mC

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
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


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
1	1	GENERATE_INVOICES	DELIVERY_SHEET	48	{"count": 1}	2026-02-18 21:43:50.36659
2	1	GENERATE_INVOICES	DELIVERY_SHEET	49	{"count": 1}	2026-02-18 21:46:45.083033
3	1	GENERATE_INVOICES	DELIVERY_SHEET	50	{"count": 1}	2026-02-18 21:47:31.010458
4	1	GENERATE_INVOICES	DELIVERY_SHEET	51	{"count": 1}	2026-02-18 21:47:51.466312
5	1	GENERATE_INVOICES	DELIVERY_SHEET	52	{"count": 1}	2026-02-18 22:40:03.176767
6	1	GENERATE_INVOICES	DELIVERY_SHEET	54	{"count": 1}	2026-02-18 22:40:49.050002
7	1	GENERATE_INVOICES	DELIVERY_SHEET	55	{"count": 1}	2026-02-18 22:41:27.234603
8	1	GENERATE_INVOICES	DELIVERY_SHEET	56	{"count": 1}	2026-02-18 22:43:00.147656
9	1	GENERATE_INVOICES	DELIVERY_SHEET	57	{"count": 1}	2026-02-18 22:44:23.186626
10	1	GENERATE_INVOICES	DELIVERY_SHEET	58	{"count": 1}	2026-02-18 22:44:49.098943
11	1	DELETE	CUSTOMER	80	{"name": "Backup Test Customer"}	2026-02-18 22:45:56.238638
12	1	GENERATE_INVOICES	DELIVERY_SHEET	60	{"count": 1}	2026-02-18 22:46:25.933097
13	1	DELETE	CUSTOMER	82	{"name": "Backup Test Customer"}	2026-02-18 22:47:07.583973
14	1	GENERATE_INVOICES	DELIVERY_SHEET	61	{"count": 1}	2026-02-18 22:47:07.681279
15	1	DELETE	CUSTOMER	83	{"name": "Backup Test Customer"}	2026-02-18 22:47:41.163033
16	1	GENERATE_INVOICES	DELIVERY_SHEET	62	{"count": 1}	2026-02-18 22:47:41.213142
17	1	DELETE	CUSTOMER	84	{"name": "Backup Test Customer"}	2026-02-18 22:49:13.94141
18	1	GENERATE_INVOICES	DELIVERY_SHEET	63	{"count": 1}	2026-02-18 22:49:13.992832
19	1	DELETE	CUSTOMER	85	{"name": "Backup Test Customer"}	2026-02-18 22:51:24.428826
20	1	GENERATE_INVOICES	DELIVERY_SHEET	64	{"count": 1}	2026-02-18 22:51:24.485129
21	1	DELETE	CUSTOMER	86	{"name": "Backup Test Customer"}	2026-02-18 22:51:48.276665
22	1	GENERATE_INVOICES	DELIVERY_SHEET	65	{"count": 1}	2026-02-18 22:51:48.364844
23	1	DELETE	CUSTOMER	87	{"name": "Backup Test Customer"}	2026-02-18 22:52:48.257575
24	1	GENERATE_INVOICES	DELIVERY_SHEET	66	{"count": 1}	2026-02-18 22:52:48.303921
25	1	DELETE	DELIVERY_SHEET	66	{}	2026-02-18 22:52:48.307995
26	1	GENERATE_INVOICES	DELIVERY_SHEET	68	{"count": 1}	2026-02-18 23:07:40.946454
27	7	GENERATE_INVOICES	DELIVERY_SHEET	73	{"count": 7}	2026-02-19 12:04:49.212509
28	7	GENERATE_INVOICES	DELIVERY_SHEET	72	{"count": 2}	2026-02-19 12:09:38.082995
29	7	GENERATE_INVOICES	DELIVERY_SHEET	75	{"count": 3}	2026-02-19 14:26:32.796839
30	7	CREATE	CUSTOMER	101	{"name": "Sanket"}	2026-02-19 17:32:05.253556
31	7	CREATE	CUSTOMER	102	{"name": "Somanth"}	2026-02-19 17:32:54.633278
32	7	GENERATE_INVOICES	DELIVERY_SHEET	103	{"count": 1}	2026-02-19 17:36:55.092826
\.


--
-- Data for Name: billing_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_rates (id, delivery_sheet_id, medium_rate, super_small_rate, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, default_weight, is_active, created_at) FROM stdin;
3	Test Category	50.00	f	2026-02-18 14:40:20.634504
6	M	50.00	f	2026-02-18 14:50:09.562488
8	Super S	50.00	f	2026-02-18 15:07:39.027781
1	Medium	50.00	t	2026-02-18 14:37:14.268341
17	Mediu	50.00	f	2026-02-18 23:54:27.059604
2	Super Small	50.00	t	2026-02-18 14:37:14.268341
32	Small	50.00	f	2026-02-19 23:21:36.485771
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, mobile, address, created_at, is_deleted) FROM stdin;
55	test	9999999999		2026-02-17 21:18:47.107296	f
61	Yash Bhandari	9822968205	Kalkai chowk	2026-02-18 18:57:49.296832	f
62	Test Customer 1771426937828	9426937828	\N	2026-02-18 20:32:18.203263	f
63	Test Customer 1771426970300	9426970300	\N	2026-02-18 20:32:50.582132	f
64	Test Customer 1771427017479	9427017479	\N	2026-02-18 20:33:37.653162	f
65	Test Customer 1771427038354	9427038354	\N	2026-02-18 20:33:58.532508	f
66	Test Customer 1771427866986	9427866986	\N	2026-02-18 20:47:47.112087	f
67	Test Customer 1771427915634	9427915634	\N	2026-02-18 20:48:35.807796	f
68	Test Customer 1771427947706	9427947706	\N	2026-02-18 20:49:07.847963	f
69	Audit Test Customer	8888888888	Audit Address	2026-02-18 21:43:50.232471	f
70	Audit Test Customer	9350874771	Audit Address	2026-02-18 21:46:44.961525	f
71	Audit Test Customer	9861228526	Audit Address	2026-02-18 21:47:30.745184	f
72	Audit Test Customer	9766742298	Audit Address	2026-02-18 21:47:51.217213	f
73	Audit Test Customer	9798088747	Audit Address	2026-02-18 22:40:02.962925	f
74	Audit Test Customer	9108953212	Audit Address	2026-02-18 22:40:27.028752	f
75	Audit Test Customer	9968790198	Audit Address	2026-02-18 22:40:48.942	f
76	Audit Test Customer	9448682889	Audit Address	2026-02-18 22:41:27.037851	f
77	Audit Test Customer	9294189287	Audit Address	2026-02-18 22:42:59.919581	f
78	Audit Test Customer	9476086765	Audit Address	2026-02-18 22:44:22.947868	f
79	Audit Test Customer	9904049384	Audit Address	2026-02-18 22:44:48.812525	f
80	Backup Test Customer	9188946220	Test Address	2026-02-18 22:45:56.116687	t
81	Audit Test Customer	9782005533	Audit Address	2026-02-18 22:46:25.79526	f
82	Backup Test Customer	9313033010	Test Address	2026-02-18 22:47:07.459443	t
83	Backup Test Customer	9977921801	Test Address	2026-02-18 22:47:40.983247	t
84	Backup Test Customer	9748360496	Test Address	2026-02-18 22:49:13.857157	t
85	Backup Test Customer	9438766073	Test Address	2026-02-18 22:51:24.311292	t
86	Backup Test Customer	9354373415	Test Address	2026-02-18 22:51:48.160695	t
87	Backup Test Customer	9467896238	Test Address	2026-02-18 22:52:48.195506	t
88	Billing Refactor Tester	9965301255	Billing Test Address	2026-02-18 23:07:40.717405	f
89	Preview Tester	9474646268	Test Address	2026-02-18 23:19:43.66559	f
50	Sharma Sweets	9876543210	Shop No. 12, Main Market, Delhi	2026-02-17 18:19:57.222006	f
51	Gupta Traders	9876543211	45 Gandhi Road, Mumbai	2026-02-17 18:19:57.222006	f
52	Verma Stores	9876543212	Plot 8, Industrial Area, Pune	2026-02-17 18:19:57.222006	f
53	Patel Brothers	9876543213	23 Station Road, Ahmedabad	2026-02-17 18:19:57.222006	f
54	Singh Enterprises	9876543214	67 Mall Road, Jaipur	2026-02-17 18:19:57.222006	f
101	Sanket	9999999299	sasane nagar 	2026-02-19 17:32:05.249273	f
102	Somanth	8888888788	Wadli	2026-02-19 17:32:54.627998	f
103	Debug Customer 2332098886	2332098886	\N	2026-02-19 23:24:38.196637	f
104	Debug Frontend 7256326805	7256326805	\N	2026-02-19 23:40:21.477819	f
\.


--
-- Data for Name: delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_items (id, delivery_sheet_id, customer_id, medium_bags, super_small_bags, created_at) FROM stdin;
114	38	51	0	0	2026-02-18 15:08:56.386256
115	38	53	0	0	2026-02-18 15:08:58.604845
116	38	50	0	0	2026-02-18 15:09:00.171057
117	38	54	0	0	2026-02-18 15:09:01.669271
118	38	52	0	0	2026-02-18 15:09:03.617578
119	40	62	0	0	2026-02-18 20:32:18.296093
120	41	63	0	0	2026-02-18 20:32:50.622523
121	42	64	0	0	2026-02-18 20:33:37.694304
122	43	65	0	0	2026-02-18 20:33:58.576222
123	44	66	0	0	2026-02-18 20:47:47.140671
124	45	67	0	0	2026-02-18 20:48:35.838817
125	46	68	0	0	2026-02-18 20:49:07.882781
126	48	69	0	0	2026-02-18 21:43:50.248667
127	49	70	0	0	2026-02-18 21:46:44.975301
128	50	71	0	0	2026-02-18 21:47:30.776996
129	51	72	0	0	2026-02-18 21:47:51.235778
130	52	73	0	0	2026-02-18 22:40:03.025186
131	53	74	0	0	2026-02-18 22:40:27.058735
132	54	75	0	0	2026-02-18 22:40:48.954365
133	55	76	0	0	2026-02-18 22:41:27.057871
134	56	77	0	0	2026-02-18 22:42:59.940373
135	57	78	0	0	2026-02-18 22:44:23.056767
136	58	79	0	0	2026-02-18 22:44:48.837722
137	60	81	0	0	2026-02-18 22:46:25.814392
138	61	82	0	0	2026-02-18 22:47:07.614912
139	62	83	0	0	2026-02-18 22:47:41.183403
140	63	84	0	0	2026-02-18 22:49:13.9586
141	64	85	0	0	2026-02-18 22:51:24.447909
142	65	86	0	0	2026-02-18 22:51:48.306483
143	66	87	0	0	2026-02-18 22:52:48.272339
144	68	88	0	0	2026-02-18 23:07:40.760879
145	69	89	0	0	2026-02-18 23:19:43.687919
146	72	54	0	0	2026-02-19 00:02:07.866708
147	72	50	0	0	2026-02-19 00:02:11.695337
148	73	51	0	0	2026-02-19 00:14:02.144467
149	73	88	0	0	2026-02-19 00:14:02.863759
150	73	89	0	0	2026-02-19 00:14:03.918942
151	73	53	0	0	2026-02-19 00:14:05.136815
152	73	50	0	0	2026-02-19 00:14:06.24604
153	73	55	0	0	2026-02-19 00:14:06.79638
154	73	61	0	0	2026-02-19 00:14:07.471198
156	75	53	0	0	2026-02-19 14:22:32.174213
157	75	89	0	0	2026-02-19 14:22:34.271189
158	75	62	0	0	2026-02-19 14:22:36.005645
49	20	51	50	20	2026-02-17 18:22:44.415869
50	20	53	25	35	2026-02-17 18:22:49.701179
169	103	102	0	0	2026-02-19 17:34:34.024241
60	21	55	10	5	2026-02-17 21:18:47.405601
172	106	51	0	0	2026-02-19 23:02:08.639874
173	106	89	0	0	2026-02-19 23:02:11.980887
174	70	88	0	0	2026-02-19 23:11:06.80776
175	39	51	0	0	2026-02-19 23:13:11.34769
176	69	55	0	0	2026-02-19 23:24:18.059044
177	69	103	0	0	2026-02-19 23:24:38.239464
178	39	53	0	0	2026-02-19 23:30:19.622955
179	39	54	0	0	2026-02-19 23:35:26.44774
70	22	55	10	5	2026-02-17 21:21:38.780644
180	69	104	0	0	2026-02-19 23:40:21.519245
80	23	55	10	5	2026-02-17 21:25:05.313557
90	24	55	10	5	2026-02-17 21:26:32.976988
100	25	55	10	5	2026-02-17 21:35:28.312451
101	26	54	50	850	2026-02-17 21:52:18.146904
102	27	51	110	500	2026-02-17 22:31:18.418155
103	28	53	200	20	2026-02-17 22:53:00.204805
105	28	50	20	10	2026-02-17 22:54:55.089775
106	30	53	10	0	2026-02-18 13:40:18.12926
108	31	51	0	0	2026-02-18 14:48:46.077908
\.


--
-- Data for Name: delivery_quantities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_quantities (id, delivery_item_id, category_id, bags) FROM stdin;
1	49	1	50
2	49	2	20
3	50	1	25
4	50	2	35
121	114	6	5
122	114	8	4
123	115	6	12
124	115	8	5
125	116	6	2
126	116	8	13
127	117	6	11
128	117	8	5
129	118	6	22
130	118	8	16
131	119	1	10
132	119	2	5
133	120	1	10
134	120	2	5
135	121	1	10
136	121	2	5
137	122	1	10
138	122	2	5
23	60	1	10
24	60	2	5
139	123	1	10
140	123	2	5
141	124	1	10
142	124	2	5
143	125	1	10
144	125	2	5
145	126	1	10
146	126	2	5
147	127	1	10
148	127	2	5
149	128	1	10
150	128	2	5
151	129	1	10
152	129	2	5
153	130	1	10
154	130	2	5
155	131	1	10
156	131	2	5
43	70	1	10
44	70	2	5
157	132	1	10
158	132	2	5
159	133	1	10
160	133	2	5
161	134	1	10
162	134	2	5
163	135	1	10
164	135	2	5
165	136	1	10
166	136	2	5
167	137	1	10
168	137	2	5
169	138	1	10
170	138	2	5
171	139	1	10
172	139	2	5
173	140	1	10
174	140	2	5
63	80	1	10
64	80	2	5
175	141	1	10
176	141	2	5
177	142	1	10
178	142	2	5
179	143	1	10
180	143	2	5
181	144	1	10
182	144	2	5
183	145	1	10
184	146	1	2
185	146	2	200
186	147	1	5
187	147	2	300
188	148	1	50
189	148	2	50
190	149	1	5
191	149	2	5
192	150	1	1
83	90	1	10
84	90	2	5
193	150	2	51
194	151	1	5
195	151	2	2
196	152	1	9
197	152	2	4
198	153	1	22
199	153	2	4
200	154	1	1
201	154	2	2
202	156	1	2
203	156	2	2
204	157	1	5
205	157	2	25
206	158	1	44
207	158	2	35
208	169	1	10
209	169	2	15
103	100	1	10
104	100	2	5
105	101	1	50
106	101	2	850
107	102	1	110
108	102	2	500
109	103	1	200
110	103	2	20
212	172	1	5
113	105	1	20
114	105	2	10
115	106	1	10
213	172	2	5
117	108	1	20
118	108	2	50
214	173	1	55
215	173	2	5
216	174	2	44
217	175	1	50
218	177	3	10
219	178	1	30
220	178	2	5
221	178	32	20
222	179	1	1
223	179	2	2
224	179	32	22
225	180	3	10
\.


--
-- Data for Name: delivery_sheet_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_sheet_rates (id, delivery_sheet_id, category_id, rate) FROM stdin;
1	21	1	3500.00
2	21	2	3400.00
3	22	1	3500.00
4	22	2	3400.00
5	23	1	3500.00
6	23	2	3400.00
7	24	1	3500.00
8	24	2	3400.00
9	25	1	3500.00
10	25	2	3400.00
\.


--
-- Data for Name: delivery_sheets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_sheets (id, truck_number, date, status, created_by, created_at, driver_name, is_deleted) FROM stdin;
52	AUDIT-001-1771434602966	2026-02-18	billed	1	2026-02-18 22:40:02.969416	Akhtar	f
53	AUDIT-001-1771434627041	2026-02-18	submitted	1	2026-02-18 22:40:27.04282	Akhtar	f
68	BILL-TEST-8711	2026-02-18	billed	1	2026-02-18 23:07:40.731757	Akhtar	f
54	AUDIT-001-1771434648945	2026-02-18	billed	1	2026-02-18 22:40:48.947038	Akhtar	f
69	PREVIEW-TEST-1694	2026-02-18	draft	1	2026-02-18 23:19:43.674147	Akhtar	f
55	AUD-7426	2026-02-18	billed	1	2026-02-18 22:41:27.046999	Akhtar	f
70	MH 42 B 8828	2026-02-18	draft	8	2026-02-18 23:53:39.410408	Akhtar	f
56	AUD-4950	2026-02-18	billed	1	2026-02-18 22:42:59.92707	Akhtar	f
71	MH 42 B 8828	2026-02-18	submitted	8	2026-02-18 23:55:35.404508	Akhtar	f
57	AUD-6378	2026-02-18	billed	1	2026-02-18 22:44:23.035511	Akhtar	f
20	7081	2026-02-17	submitted	1	2026-02-17 18:22:10.260607	Akhtar	f
21	TEST-TRUCK-99	2026-02-17	billed	1	2026-02-17 21:18:47.29918	Akhtar	f
22	TEST-TRUCK-99	2026-02-17	billed	1	2026-02-17 21:21:38.737599	Akhtar	f
58	TEST-8280	2026-02-18	billed	1	2026-02-18 22:44:48.823428	Akhtar	f
23	TEST-TRUCK-99	2026-02-17	billed	1	2026-02-17 21:25:05.26519	Akhtar	f
59	TEST-314	2026-02-18	draft	1	2026-02-18 22:45:56.132285	Akhtar	f
24	TEST-TRUCK-99	2026-02-17	billed	1	2026-02-17 21:26:32.942189	Akhtar	f
25	TEST-TRUCK-VERIFY	2026-02-17	billed	1	2026-02-17 21:35:28.277978	Akhtar	f
26	7081	2026-02-17	submitted	8	2026-02-17 21:51:57.148929	Akhtar	f
27	7081	2026-02-17	submitted	8	2026-02-17 22:31:00.326489	Akhtar	f
28	mh 12 ab 1234	2026-02-17	submitted	8	2026-02-17 22:52:17.357166	Akhtar	f
29	MH 12 AB 8888	2026-02-17	draft	8	2026-02-17 23:12:58.283447	Akhtar	f
30	7081	2026-02-18	draft	8	2026-02-18 12:55:35.393842	Akhtar	f
31	MH 42 B 8828	2026-02-18	draft	8	2026-02-18 14:48:07.134086	Akhtar	f
60	TEST-4792	2026-02-18	billed	1	2026-02-18 22:46:25.801164	Akhtar	f
73	MH 42 B 8828	2026-02-19	billed	8	2026-02-19 00:12:26.513181	Akhtar	f
61	TEST-6877	2026-02-18	billed	1	2026-02-18 22:47:07.473293	Akhtar	f
72	MH 42 B 8828	2026-02-19	billed	8	2026-02-19 00:01:35.316627	Akhtar	f
38	MH 42 B 8828	2026-02-18	submitted	8	2026-02-18 15:06:55.560289	Akhtar	f
40	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:32:18.277528	Akhtar	f
41	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:32:50.610678	Akhtar	f
42	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:33:37.683454	Akhtar	f
43	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:33:58.567207	Akhtar	f
44	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:47:47.133643	Akhtar	f
45	TEST-TRUCK	2026-02-18	draft	\N	2026-02-18 20:48:35.827806	Akhtar	f
46	TEST-TRUCK	2026-02-18	billed	\N	2026-02-18 20:49:07.87423	Akhtar	f
47	MH 42 B 8828	2026-02-18	submitted	8	2026-02-18 20:57:49.266126	Akhtar	f
62	TEST-6858	2026-02-18	billed	1	2026-02-18 22:47:41.057595	Akhtar	f
48	AUDIT-001	2026-02-18	billed	1	2026-02-18 21:43:50.240636	Akhtar	f
49	AUDIT-001-1771431404965	2026-02-18	billed	1	2026-02-18 21:46:44.968404	Akhtar	f
50	AUDIT-001-1771431450760	2026-02-18	billed	1	2026-02-18 21:47:30.762255	Akhtar	f
51	AUDIT-001-1771431471221	2026-02-18	billed	1	2026-02-18 21:47:51.226125	Akhtar	f
63	TEST-1485	2026-02-18	billed	1	2026-02-18 22:49:13.865493	Akhtar	f
64	TEST-4712	2026-02-18	billed	1	2026-02-18 22:51:24.325068	Akhtar	f
75	MH 42 B 8828	2026-02-19	billed	8	2026-02-19 14:21:40.10818	Akhtar	f
65	TEST-5645	2026-02-18	billed	1	2026-02-18 22:51:48.169604	Akhtar	f
66	TEST-7873	2026-02-18	billed	1	2026-02-18 22:52:48.201302	Akhtar	t
67	MH 42 B 8828	2026-02-18	submitted	8	2026-02-18 22:55:27.854964	Akhtar	f
103	MH 42 B 8828	2026-02-19	billed	8	2026-02-19 17:34:06.98502	Akhtar	f
106	MH 42 B 8828	2026-02-19	submitted	8	2026-02-19 23:01:37.540196	Akhtar	f
39	MH 42 B 8828	2026-02-18	submitted	8	2026-02-18 17:10:58.350847	Akhtar	f
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, delivery_sheet_id, customer_id, subtotal, sgst_amount, cgst_amount, expense_amount, total_amount, status, created_at, is_deleted) FROM stdin;
25	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
26	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
27	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
28	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
29	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
30	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
31	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
32	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
33	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
34	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408	f
35	22	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:21:38.814213	f
36	23	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:25:05.337503	f
37	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:25:05.352606	f
38	24	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:26:32.993498	f
39	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:26:33.004313	f
40	25	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:35:28.324002	f
41	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:35:28.332904	f
43	46	68	0.00	0.00	0.00	0.00	0.00	paid	2026-02-18 20:49:07.969719	f
44	48	69	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-18 21:43:50.282812	f
45	49	70	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-18 21:46:45.001436	f
46	50	71	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-18 21:47:30.868824	f
47	51	72	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-18 21:47:51.269153	f
48	52	73	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-18 22:40:03.06651	f
49	54	75	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:40:48.979636	f
50	55	76	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:41:27.109111	f
51	56	77	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:42:59.978363	f
52	57	78	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:44:23.081549	f
53	58	79	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:44:48.884263	f
54	60	81	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:46:25.843822	f
55	61	82	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:47:07.664343	f
56	62	83	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:47:41.206136	f
57	63	84	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:49:13.984276	f
58	64	85	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:51:24.473853	f
59	65	86	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:51:48.349533	f
60	66	87	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-18 22:52:48.293413	f
61	68	88	16000.00	400.00	400.00	0.00	16800.00	unpaid	2026-02-18 23:07:40.830983	f
62	73	51	200000.00	5000.00	5000.00	0.00	210000.00	unpaid	2026-02-19 12:04:49.066999	f
63	73	88	20000.00	500.00	500.00	0.00	21000.00	unpaid	2026-02-19 12:04:49.066999	f
64	73	89	101500.00	2537.50	2537.50	0.00	106575.00	unpaid	2026-02-19 12:04:49.066999	f
65	73	53	14150.00	353.75	353.75	0.00	14857.50	unpaid	2026-02-19 12:04:49.066999	f
66	73	50	26250.00	656.25	656.25	0.00	27562.50	unpaid	2026-02-19 12:04:49.066999	f
67	73	55	52900.00	1322.50	1322.50	0.00	55545.00	unpaid	2026-02-19 12:04:49.066999	f
68	73	61	5950.00	148.75	148.75	0.00	6247.50	unpaid	2026-02-19 12:04:49.066999	f
69	72	54	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-19 12:09:38.067708	f
70	72	50	0.00	0.00	0.00	0.00	0.00	unpaid	2026-02-19 12:09:38.067708	f
72	75	53	7638.10	190.95	190.95	0.00	8020.00	unpaid	2026-02-19 14:26:32.698965	f
73	75	89	56809.52	1420.24	1420.24	0.00	59650.00	unpaid	2026-02-19 14:26:32.698965	f
74	75	62	151066.67	3776.66	3776.66	0.00	158620.00	unpaid	2026-02-19 14:26:32.698965	f
84	103	102	47619.05	1190.47	1190.47	0.00	50000.00	unpaid	2026-02-19 17:36:55.001391	f
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, customer_id, amount, payment_method, payment_date, created_by, created_at) FROM stdin;
1	37	55	500.00	cash	2026-02-17	\N	2026-02-17 21:25:05.363711
2	39	55	500.00	cash	2026-02-17	\N	2026-02-17 21:26:33.009666
3	41	55	500.00	cash	2026-02-17	1	2026-02-17 21:35:28.339063
4	\N	55	27355.00	cash	2026-02-17	\N	2026-02-17 23:20:41.161538
5	\N	55	2704295.00	upi	2026-02-17	\N	2026-02-17 23:21:10.736147
7	43	68	20000.00	cash	2026-02-18	\N	2026-02-18 20:49:07.997797
8	43	68	34600.00	cash	2026-02-18	\N	2026-02-18 20:49:08.026229
20	\N	61	60000.00	cash	2026-02-19	\N	2026-02-19 14:46:15.168997
31	\N	75	100.00	upi	2026-02-19	\N	2026-02-19 15:17:24.425906
32	\N	76	11000.00	cash	2026-02-19	\N	2026-02-19 15:17:46.909492
33	\N	76	10000.00	cash	2026-02-19	\N	2026-02-19 15:17:56.827222
34	\N	79	5000.00	cash	2026-02-19	\N	2026-02-19 15:20:39.957973
35	\N	102	10000.00	cash	2026-02-19	\N	2026-02-19 17:38:40.552984
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, category, movement_type, bags, reference_type, reference_id, created_at) FROM stdin;
49	medium	factory_in	500	purchase	1	2026-02-17 18:19:57.22306
50	super_small	factory_in	800	purchase	1	2026-02-17 18:19:57.22306
51	medium	delivery_out	50	delivery_sheet	20	2026-02-17 18:22:57.938449
52	super_small	delivery_out	20	delivery_sheet	20	2026-02-17 18:22:57.938449
53	medium	delivery_out	25	delivery_sheet	20	2026-02-17 18:22:57.938449
54	super_small	delivery_out	35	delivery_sheet	20	2026-02-17 18:22:57.938449
55	medium	godown_in	1000	audit	1	2026-02-17 21:18:47.190765
56	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
57	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
58	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
59	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
60	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
61	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
62	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
63	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
64	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
65	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
66	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
67	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
68	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
69	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
70	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
71	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
72	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
73	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
74	medium	delivery_out	10	delivery_sheet	21	2026-02-17 21:18:47.410431
75	super_small	delivery_out	5	delivery_sheet	21	2026-02-17 21:18:47.410431
76	medium	godown_in	1000	audit	1	2026-02-17 21:21:38.655257
77	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
78	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
79	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
80	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
81	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
82	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
83	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
84	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
85	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
86	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
87	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
88	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
89	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
90	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
91	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
92	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
93	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
94	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
95	medium	delivery_out	10	delivery_sheet	22	2026-02-17 21:21:38.790896
96	super_small	delivery_out	5	delivery_sheet	22	2026-02-17 21:21:38.790896
97	medium	godown_in	1000	audit	1	2026-02-17 21:25:05.129088
98	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
99	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
100	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
101	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
102	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
103	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
104	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
105	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
106	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
107	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
108	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
109	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
110	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
111	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
112	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
113	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
114	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
115	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
116	medium	delivery_out	10	delivery_sheet	23	2026-02-17 21:25:05.316043
117	super_small	delivery_out	5	delivery_sheet	23	2026-02-17 21:25:05.316043
118	medium	godown_in	1000	audit	1	2026-02-17 21:26:32.87865
119	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
120	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
121	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
122	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
123	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
124	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
125	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
126	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
127	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
128	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
129	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
130	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
131	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
132	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
133	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
134	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
135	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
136	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
137	medium	delivery_out	10	delivery_sheet	24	2026-02-17 21:26:32.979604
138	super_small	delivery_out	5	delivery_sheet	24	2026-02-17 21:26:32.979604
139	medium	godown_in	1000	audit	1	2026-02-17 21:35:28.217819
140	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
141	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
142	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
143	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
144	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
145	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
146	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
147	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
148	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
149	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
150	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
151	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
152	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
153	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
154	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
155	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
156	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
157	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
158	medium	delivery_out	10	delivery_sheet	25	2026-02-17 21:35:28.314661
159	super_small	delivery_out	5	delivery_sheet	25	2026-02-17 21:35:28.314661
160	medium	delivery_out	50	delivery_sheet	26	2026-02-17 21:52:21.061099
161	super_small	delivery_out	850	delivery_sheet	26	2026-02-17 21:52:21.061099
162	medium	delivery_out	110	delivery_sheet	27	2026-02-17 22:31:23.594645
163	super_small	delivery_out	500	delivery_sheet	27	2026-02-17 22:31:23.594645
164	medium	delivery_out	200	delivery_sheet	28	2026-02-17 22:54:59.243393
165	super_small	delivery_out	20	delivery_sheet	28	2026-02-17 22:54:59.243393
166	medium	delivery_out	30	delivery_sheet	28	2026-02-17 22:54:59.243393
167	super_small	delivery_out	20	delivery_sheet	28	2026-02-17 22:54:59.243393
168	medium	delivery_out	20	delivery_sheet	28	2026-02-17 22:54:59.243393
169	super_small	delivery_out	10	delivery_sheet	28	2026-02-17 22:54:59.243393
171	M	delivery_out	5	delivery_sheet	38	2026-02-18 15:12:26.473
172	Super S	delivery_out	4	delivery_sheet	38	2026-02-18 15:12:26.473
173	M	delivery_out	12	delivery_sheet	38	2026-02-18 15:12:26.473
174	Super S	delivery_out	5	delivery_sheet	38	2026-02-18 15:12:26.473
175	M	delivery_out	2	delivery_sheet	38	2026-02-18 15:12:26.473
176	Super S	delivery_out	13	delivery_sheet	38	2026-02-18 15:12:26.473
177	M	delivery_out	11	delivery_sheet	38	2026-02-18 15:12:26.473
178	Super S	delivery_out	5	delivery_sheet	38	2026-02-18 15:12:26.473
179	M	delivery_out	22	delivery_sheet	38	2026-02-18 15:12:26.473
180	Super S	delivery_out	16	delivery_sheet	38	2026-02-18 15:12:26.473
181	Medium	delivery_out	10	delivery_sheet	46	2026-02-18 20:49:07.933
182	Super Small	delivery_out	5	delivery_sheet	46	2026-02-18 20:49:07.933
183	Medium	delivery_out	10	delivery_sheet	48	2026-02-18 21:43:50.271
184	Super Small	delivery_out	5	delivery_sheet	48	2026-02-18 21:43:50.271
185	Medium	delivery_out	10	delivery_sheet	49	2026-02-18 21:46:44.994
186	Super Small	delivery_out	5	delivery_sheet	49	2026-02-18 21:46:44.994
187	Medium	delivery_out	10	delivery_sheet	50	2026-02-18 21:47:30.843
188	Super Small	delivery_out	5	delivery_sheet	50	2026-02-18 21:47:30.844
189	Medium	delivery_out	10	delivery_sheet	51	2026-02-18 21:47:51.259
190	Super Small	delivery_out	5	delivery_sheet	51	2026-02-18 21:47:51.259
191	Medium	delivery_out	10	delivery_sheet	52	2026-02-18 22:40:03.058
192	Super Small	delivery_out	5	delivery_sheet	52	2026-02-18 22:40:03.058
193	Medium	delivery_out	10	delivery_sheet	53	2026-02-18 22:40:27.089
194	Super Small	delivery_out	5	delivery_sheet	53	2026-02-18 22:40:27.089
195	Medium	delivery_out	10	delivery_sheet	54	2026-02-18 22:40:48.974
196	Super Small	delivery_out	5	delivery_sheet	54	2026-02-18 22:40:48.974
197	Medium	delivery_out	10	delivery_sheet	55	2026-02-18 22:41:27.096
198	Super Small	delivery_out	5	delivery_sheet	55	2026-02-18 22:41:27.096
199	Medium	delivery_out	10	delivery_sheet	56	2026-02-18 22:42:59.972
200	Super Small	delivery_out	5	delivery_sheet	56	2026-02-18 22:42:59.972
201	Medium	delivery_out	10	delivery_sheet	57	2026-02-18 22:44:23.076
202	Super Small	delivery_out	5	delivery_sheet	57	2026-02-18 22:44:23.076
203	Medium	delivery_out	10	delivery_sheet	58	2026-02-18 22:44:48.876
204	Super Small	delivery_out	5	delivery_sheet	58	2026-02-18 22:44:48.876
205	Medium	delivery_out	10	delivery_sheet	60	2026-02-18 22:46:25.837
206	Super Small	delivery_out	5	delivery_sheet	60	2026-02-18 22:46:25.837
207	Medium	delivery_out	10	delivery_sheet	61	2026-02-18 22:47:07.655
208	Super Small	delivery_out	5	delivery_sheet	61	2026-02-18 22:47:07.655
209	Medium	delivery_out	10	delivery_sheet	62	2026-02-18 22:47:41.201
210	Super Small	delivery_out	5	delivery_sheet	62	2026-02-18 22:47:41.201
211	Medium	delivery_out	10	delivery_sheet	63	2026-02-18 22:49:13.979
212	Super Small	delivery_out	5	delivery_sheet	63	2026-02-18 22:49:13.979
213	Medium	delivery_out	10	delivery_sheet	64	2026-02-18 22:51:24.467
214	Super Small	delivery_out	5	delivery_sheet	64	2026-02-18 22:51:24.467
215	Medium	delivery_out	10	delivery_sheet	65	2026-02-18 22:51:48.342
216	Super Small	delivery_out	5	delivery_sheet	65	2026-02-18 22:51:48.342
217	Medium	delivery_out	10	delivery_sheet	66	2026-02-18 22:52:48.289
218	Super Small	delivery_out	5	delivery_sheet	66	2026-02-18 22:52:48.289
219	Medium	delivery_out	10	delivery_sheet	68	2026-02-18 23:07:40.823
220	Super Small	delivery_out	5	delivery_sheet	68	2026-02-18 23:07:40.823
221	Medium	delivery_out	2	delivery_sheet	72	2026-02-19 00:02:30.18
222	Super Small	delivery_out	200	delivery_sheet	72	2026-02-19 00:02:30.18
223	Medium	delivery_out	5	delivery_sheet	72	2026-02-19 00:02:30.18
224	Super Small	delivery_out	300	delivery_sheet	72	2026-02-19 00:02:30.18
225	Medium	delivery_out	50	delivery_sheet	73	2026-02-19 00:14:11.296
226	Super Small	delivery_out	50	delivery_sheet	73	2026-02-19 00:14:11.296
227	Medium	delivery_out	5	delivery_sheet	73	2026-02-19 00:14:11.296
228	Super Small	delivery_out	5	delivery_sheet	73	2026-02-19 00:14:11.296
229	Medium	delivery_out	1	delivery_sheet	73	2026-02-19 00:14:11.296
230	Super Small	delivery_out	51	delivery_sheet	73	2026-02-19 00:14:11.296
231	Medium	delivery_out	5	delivery_sheet	73	2026-02-19 00:14:11.296
232	Super Small	delivery_out	2	delivery_sheet	73	2026-02-19 00:14:11.296
233	Medium	delivery_out	9	delivery_sheet	73	2026-02-19 00:14:11.296
234	Super Small	delivery_out	4	delivery_sheet	73	2026-02-19 00:14:11.296
235	Medium	delivery_out	22	delivery_sheet	73	2026-02-19 00:14:11.296
236	Super Small	delivery_out	4	delivery_sheet	73	2026-02-19 00:14:11.296
237	Medium	delivery_out	1	delivery_sheet	73	2026-02-19 00:14:11.296
238	Super Small	delivery_out	2	delivery_sheet	73	2026-02-19 00:14:11.296
239	Medium	delivery_out	2	delivery_sheet	75	2026-02-19 14:22:40.438
240	Super Small	delivery_out	2	delivery_sheet	75	2026-02-19 14:22:40.438
241	Medium	delivery_out	5	delivery_sheet	75	2026-02-19 14:22:40.438
242	Super Small	delivery_out	25	delivery_sheet	75	2026-02-19 14:22:40.438
243	Medium	delivery_out	44	delivery_sheet	75	2026-02-19 14:22:40.438
244	Super Small	delivery_out	35	delivery_sheet	75	2026-02-19 14:22:40.438
245	Medium	delivery_out	10	delivery_sheet	103	2026-02-19 17:35:30.212
246	Super Small	delivery_out	15	delivery_sheet	103	2026-02-19 17:35:30.212
247	Medium	delivery_out	5	delivery_sheet	106	2026-02-19 23:02:39.375
248	Super Small	delivery_out	5	delivery_sheet	106	2026-02-19 23:02:39.375
249	Medium	delivery_out	55	delivery_sheet	106	2026-02-19 23:02:39.375
250	Super Small	delivery_out	5	delivery_sheet	106	2026-02-19 23:02:39.375
251	Medium	delivery_out	50	delivery_sheet	39	2026-02-19 23:41:55.254
252	Medium	delivery_out	30	delivery_sheet	39	2026-02-19 23:41:55.254
253	Super Small	delivery_out	5	delivery_sheet	39	2026-02-19 23:41:55.254
254	Small	delivery_out	20	delivery_sheet	39	2026-02-19 23:41:55.254
255	Medium	delivery_out	1	delivery_sheet	39	2026-02-19 23:41:55.254
256	Super Small	delivery_out	2	delivery_sheet	39	2026-02-19 23:41:55.254
257	Small	delivery_out	22	delivery_sheet	39	2026-02-19 23:41:55.254
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, mobile, password, role, created_at) FROM stdin;
1	Raju Driver	9999999999	$2b$10$rm/L8TXeqXsxrVzkYwEhwOOwsc8V./eBqxtS.NODuGOfSP6pj8Sj6	driver	2026-02-17 16:27:23.779138
2	Amit Manager	8888888888	$2b$10$boC.IhBabObzvDhMebsoK.SzEefhD8Yi95z76FshVTfEq/jkwHYMe	manager	2026-02-17 16:27:23.841906
3	Suresh Owner	7777777777	$2b$10$ST1cBzkwe6sTs/9TzKVR.OOpQRCU7ELjQ09b6OmUuLu8hPhxJTPay	owner	2026-02-17 16:27:23.914697
7	Test Manager	9876543210	$2b$10$ciMCJsEa/L41DIQhS38IsusVZ4diDo7P7Lbpryut17yjPX1GJcwwq	manager	2026-02-17 21:45:36.802815
8	Test Driver	9876543211	$2b$10$g78reMzjxH1QBduP4ILyIuAOq34D0ZrcsHc3d/PYGOVJ72NQ9nBLO	driver	2026-02-17 21:46:48.775554
9	Test Owner	9876543212	$2b$10$weIWb4.E.MilrLCO6tG5GeQuDuRboRe84uz73gc4PFCirZLXmG7Bi	owner	2026-02-17 22:58:48.168243
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 32, true);


--
-- Name: billing_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_rates_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 32, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 104, true);


--
-- Name: delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_items_id_seq', 180, true);


--
-- Name: delivery_quantities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_quantities_id_seq', 225, true);


--
-- Name: delivery_sheet_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheet_rates_id_seq', 10, true);


--
-- Name: delivery_sheets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheets_id_seq', 106, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 84, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 35, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 257, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


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
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


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

\unrestrict nBJSeVCfAj2Mz1Z5X9kgbeZdkyiFaUcJPadbFTH26c02VkaBcmUrAJym5TTy4mC

