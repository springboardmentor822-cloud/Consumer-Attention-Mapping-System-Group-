--
-- PostgreSQL database dump
--

\restrict yKFJi4qbdfrVF6W9SmblKiZ6mi6P0f0xqtiwdKxm0LpErmZiAyJeKdJCOQaigUd

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: zonetype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.zonetype AS ENUM (
    'ENTRANCE',
    'AISLE',
    'CHECKOUT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: camera; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.camera (
    id uuid NOT NULL,
    store_id uuid NOT NULL,
    zone_id uuid NOT NULL,
    name character varying NOT NULL,
    source_path character varying NOT NULL,
    is_active boolean NOT NULL
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: shelf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shelf (
    id uuid NOT NULL,
    store_id uuid NOT NULL,
    shelf_name character varying NOT NULL,
    zone_id uuid
);


--
-- Name: shelfcameraview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shelfcameraview (
    id uuid NOT NULL,
    shelf_id uuid NOT NULL,
    camera_id uuid NOT NULL,
    zone_coordinates json
);


--
-- Name: store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store (
    id uuid NOT NULL,
    name character varying NOT NULL,
    location character varying,
    store_metadata json
);


--
-- Name: tracking_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracking_events (
    id uuid NOT NULL,
    event_time timestamp without time zone NOT NULL,
    camera_id character varying NOT NULL,
    frame_index integer NOT NULL,
    track_id double precision NOT NULL,
    x1 double precision NOT NULL,
    y1 double precision NOT NULL,
    x2 double precision NOT NULL,
    y2 double precision NOT NULL,
    class_name character varying
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    is_active boolean NOT NULL,
    role_id integer
);


--
-- Name: zone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zone (
    id uuid NOT NULL,
    store_id uuid NOT NULL,
    name character varying NOT NULL,
    zone_type public.zonetype NOT NULL
);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- Name: camera camera_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: shelf shelf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelf
    ADD CONSTRAINT shelf_pkey PRIMARY KEY (id);


--
-- Name: shelfcameraview shelfcameraview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelfcameraview
    ADD CONSTRAINT shelfcameraview_pkey PRIMARY KEY (id);


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (id);


--
-- Name: tracking_events tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT tracking_events_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: zone zone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_pkey PRIMARY KEY (id);


--
-- Name: ix_role_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_role_name ON public.role USING btree (name);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: camera camera_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id);


--
-- Name: camera camera_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(id);


--
-- Name: shelf shelf_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelf
    ADD CONSTRAINT shelf_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id);


--
-- Name: shelf shelf_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelf
    ADD CONSTRAINT shelf_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(id);


--
-- Name: shelfcameraview shelfcameraview_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelfcameraview
    ADD CONSTRAINT shelfcameraview_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(id);


--
-- Name: shelfcameraview shelfcameraview_shelf_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shelfcameraview
    ADD CONSTRAINT shelfcameraview_shelf_id_fkey FOREIGN KEY (shelf_id) REFERENCES public.shelf(id);


--
-- Name: user user_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- Name: zone zone_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yKFJi4qbdfrVF6W9SmblKiZ6mi6P0f0xqtiwdKxm0LpErmZiAyJeKdJCOQaigUd

