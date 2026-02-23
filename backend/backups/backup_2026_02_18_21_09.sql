--
-- PostgreSQL database dump
--

\restrict SQTZCapn6yHvtGv7LEJbhd9xEf9ThyoQ6HrGHO76YHftCMww0oEBVhA2RaSJWgT

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    medium_rate numeric(10,2) DEFAULT 0.00 NOT NULL,
    super_small_rate numeric(10,2) DEFAULT 0.00 NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    driver_name character varying(255) DEFAULT 'Akhtar'::character varying,
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
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, default_weight, is_active, created_at) FROM stdin;
3	Test Category	50.00	f	2026-02-18 14:40:20.634504
1	Medium	30.00	f	2026-02-18 14:37:14.268341
2	Super Small	30.00	f	2026-02-18 14:37:14.268341
6	M	50.00	t	2026-02-18 14:50:09.562488
8	Super S	50.00	t	2026-02-18 15:07:39.027781
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, mobile, address, created_at) FROM stdin;
55	test	9999999999		2026-02-17 21:18:47.107296
61	Yash Bhandari	9822968205	Kalkai chowk	2026-02-18 18:57:49.296832
62	Test Customer 1771426937828	9426937828	\N	2026-02-18 20:32:18.203263
63	Test Customer 1771426970300	9426970300	\N	2026-02-18 20:32:50.582132
64	Test Customer 1771427017479	9427017479	\N	2026-02-18 20:33:37.653162
65	Test Customer 1771427038354	9427038354	\N	2026-02-18 20:33:58.532508
66	Test Customer 1771427866986	9427866986	\N	2026-02-18 20:47:47.112087
67	Test Customer 1771427915634	9427915634	\N	2026-02-18 20:48:35.807796
68	Test Customer 1771427947706	9427947706	\N	2026-02-18 20:49:07.847963
50	Sharma Sweets	9876543210	Shop No. 12, Main Market, Delhi	2026-02-17 18:19:57.222006
51	Gupta Traders	9876543211	45 Gandhi Road, Mumbai	2026-02-17 18:19:57.222006
52	Verma Stores	9876543212	Plot 8, Industrial Area, Pune	2026-02-17 18:19:57.222006
53	Patel Brothers	9876543213	23 Station Road, Ahmedabad	2026-02-17 18:19:57.222006
54	Singh Enterprises	9876543214	67 Mall Road, Jaipur	2026-02-17 18:19:57.222006
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
49	20	51	50	20	2026-02-17 18:22:44.415869
50	20	53	25	35	2026-02-17 18:22:49.701179
60	21	55	10	5	2026-02-17 21:18:47.405601
70	22	55	10	5	2026-02-17 21:21:38.780644
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
43	70	1	10
44	70	2	5
63	80	1	10
64	80	2	5
83	90	1	10
84	90	2	5
103	100	1	10
104	100	2	5
105	101	1	50
106	101	2	850
107	102	1	110
108	102	2	500
109	103	1	200
110	103	2	20
113	105	1	20
114	105	2	10
115	106	1	10
117	108	1	20
118	108	2	50
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

COPY public.delivery_sheets (id, truck_number, date, medium_rate, super_small_rate, status, created_by, created_at, driver_name) FROM stdin;
20	7081	2026-02-17	0.00	0.00	submitted	1	2026-02-17 18:22:10.260607	Akhtar
21	TEST-TRUCK-99	2026-02-17	3500.00	3400.00	billed	1	2026-02-17 21:18:47.29918	Akhtar
22	TEST-TRUCK-99	2026-02-17	3500.00	3400.00	billed	1	2026-02-17 21:21:38.737599	Akhtar
23	TEST-TRUCK-99	2026-02-17	3500.00	3400.00	billed	1	2026-02-17 21:25:05.26519	Akhtar
24	TEST-TRUCK-99	2026-02-17	3500.00	3400.00	billed	1	2026-02-17 21:26:32.942189	Akhtar
25	TEST-TRUCK-VERIFY	2026-02-17	3500.00	3400.00	billed	1	2026-02-17 21:35:28.277978	Akhtar
26	7081	2026-02-17	0.00	0.00	submitted	8	2026-02-17 21:51:57.148929	Akhtar
27	7081	2026-02-17	0.00	0.00	submitted	8	2026-02-17 22:31:00.326489	Akhtar
28	mh 12 ab 1234	2026-02-17	0.00	0.00	submitted	8	2026-02-17 22:52:17.357166	Akhtar
29	MH 12 AB 8888	2026-02-17	0.00	0.00	draft	8	2026-02-17 23:12:58.283447	Akhtar
30	7081	2026-02-18	0.00	0.00	draft	8	2026-02-18 12:55:35.393842	Akhtar
31	MH 42 B 8828	2026-02-18	0.00	0.00	draft	8	2026-02-18 14:48:07.134086	Akhtar
38	MH 42 B 8828	2026-02-18	0.00	0.00	submitted	8	2026-02-18 15:06:55.560289	Akhtar
39	MH 42 B 8828	2026-02-18	0.00	0.00	draft	8	2026-02-18 17:10:58.350847	Akhtar
40	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:32:18.277528	Akhtar
41	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:32:50.610678	Akhtar
42	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:33:37.683454	Akhtar
43	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:33:58.567207	Akhtar
44	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:47:47.133643	Akhtar
45	TEST-TRUCK	2026-02-18	3500.00	3400.00	draft	\N	2026-02-18 20:48:35.827806	Akhtar
46	TEST-TRUCK	2026-02-18	3500.00	3400.00	billed	\N	2026-02-18 20:49:07.87423	Akhtar
47	MH 42 B 8828	2026-02-18	0.00	0.00	submitted	8	2026-02-18 20:57:49.266126	Akhtar
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, delivery_sheet_id, customer_id, subtotal, sgst_amount, cgst_amount, expense_amount, total_amount, status, created_at) FROM stdin;
25	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
26	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
27	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
28	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
29	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
30	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
31	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
32	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
33	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
34	21	55	52000.00	1300.00	1300.00	0.00	54600.00	unpaid	2026-02-17 21:18:47.4408
35	22	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:21:38.814213
36	23	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:25:05.337503
37	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:25:05.352606
38	24	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:26:32.993498
39	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:26:33.004313
40	25	55	520000.00	13000.00	13000.00	0.00	546000.00	unpaid	2026-02-17 21:35:28.324002
41	\N	55	1000.00	25.00	25.00	0.00	1050.00	partial	2026-02-17 21:35:28.332904
43	46	68	0.00	0.00	0.00	0.00	0.00	paid	2026-02-18 20:49:07.969719
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
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 68, true);


--
-- Name: delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_items_id_seq', 125, true);


--
-- Name: delivery_quantities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_quantities_id_seq', 144, true);


--
-- Name: delivery_sheet_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheet_rates_id_seq', 10, true);


--
-- Name: delivery_sheets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sheets_id_seq', 47, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 43, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 8, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 182, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


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

\unrestrict SQTZCapn6yHvtGv7LEJbhd9xEf9ThyoQ6HrGHO76YHftCMww0oEBVhA2RaSJWgT

