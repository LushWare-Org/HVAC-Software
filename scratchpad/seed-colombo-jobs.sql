-- Demo seed: 10 normal (non-agreement, unassigned) jobs around Colombo,
-- 5 tomorrow + 5 the day after — for the scheduling/dispatch demo.
-- Idempotent: rerunning replaces the same rows.
BEGIN;
DELETE FROM scheduling.dispatch_assignments WHERE job_id LIKE 'demo-job-colombo-%';
DELETE FROM jobs.jobs WHERE id LIKE 'demo-job-colombo-%';

INSERT INTO jobs.jobs
  (id, "companyId", "jobNumber", "customerId", "customerName", "customerEmail", "customerPhone",
   "serviceAddress", "serviceLatitude", "serviceLongitude", title, description, status, priority,
   "scheduledStart", "scheduledEnd", "createdByUserId", "isAgreementJob", "hasPartShortage",
   "createdAt", "updatedAt")
VALUES
-- ── Tomorrow ───────────────────────────────────────────────────────────────
('demo-job-colombo-01','co-demo-001','JOB-DEMO-C01','demo-customer-003','Robert Davis','robert.davis@gmail.com','(555) 200-0003',
 '45 Galle Face Terrace, Kollupitiya, Colombo 03',6.9107,79.8497,
 'AC not cooling — split unit service','Living room split AC blowing warm air; suspected gas leak.','PENDING','HIGH',
 CURRENT_DATE + INTERVAL '1 day 9 hour', CURRENT_DATE + INTERVAL '1 day 11 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-02','co-demo-001','JOB-DEMO-C02','demo-customer-012','Olivia Garcia','olivia.garcia@example.com','(555) 210-0012',
 '12 Station Road, Bambalapitiya, Colombo 04',6.8964,79.8560,
 'Kitchen sink leak repair','Persistent leak under kitchen sink, cabinet water damage starting.','PENDING','NORMAL',
 CURRENT_DATE + INTERVAL '1 day 10 hour', CURRENT_DATE + INTERVAL '1 day 12 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-03','co-demo-001','JOB-DEMO-C03','demo-customer-014','Ethan Brooks','ethan.brooks@example.com','(555) 210-0014',
 '78 High Level Road, Nugegoda',6.8649,79.8997,
 'Ceiling fan installation x3','Install three ceiling fans in new extension rooms.','PENDING','LOW',
 CURRENT_DATE + INTERVAL '1 day 13 hour', CURRENT_DATE + INTERVAL '1 day 15 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-04','co-demo-001','JOB-DEMO-C04','demo-customer-016','Noah Kim','noah.kim@example.com','(555) 210-0016',
 '230 Galle Road, Mount Lavinia',6.8380,79.8639,
 'Water heater replacement','Old heater tripping breaker; replace with 15L unit (customer purchased).','PENDING','HIGH',
 CURRENT_DATE + INTERVAL '1 day 14 hour', CURRENT_DATE + INTERVAL '1 day 16 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-05','co-demo-001','JOB-DEMO-C05','demo-customer-017','Grace Morgan','grace.morgan@oakridgeoffice.com','(555) 210-0017',
 'Oakridge Office, 55 Ward Place, Colombo 07',6.9146,79.8690,
 'Office AC quarterly maintenance','Six cassette units — filters, coils, drain lines.','PENDING','NORMAL',
 CURRENT_DATE + INTERVAL '1 day 15 hour', CURRENT_DATE + INTERVAL '1 day 17 hour','user-admin-001',false,false,NOW(),NOW()),
-- ── Day after tomorrow ─────────────────────────────────────────────────────
('demo-job-colombo-06','co-demo-001','JOB-DEMO-C06','demo-customer-011','Marcus Lee','pasinduravishan88@gmail.com','(555) 210-0011',
 '19 Kotte Road, Rajagiriya',6.9107,79.8918,
 'Emergency — burst pipe in bathroom','Main bathroom feed burst; water shut off at mains, family without water.','PENDING','EMERGENCY',
 CURRENT_DATE + INTERVAL '2 day 8 hour', CURRENT_DATE + INTERVAL '2 day 10 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-07','co-demo-001','JOB-DEMO-C07','demo-customer-018','Liam Anderson','liam.anderson@example.com','(555) 210-0018',
 '88 W A Silva Mawatha, Wellawatte, Colombo 06',6.8747,79.8607,
 'Wiring inspection — pre-purchase','Electrical safety inspection for apartment purchase; report needed.','PENDING','NORMAL',
 CURRENT_DATE + INTERVAL '2 day 9 hour', CURRENT_DATE + INTERVAL '2 day 11 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-08','co-demo-001','JOB-DEMO-C08','demo-customer-003','Robert Davis','robert.davis@gmail.com','(555) 200-0003',
 '45 Galle Face Terrace, Kollupitiya, Colombo 03',6.9110,79.8501,
 'Bathroom exhaust fan replacement','Follow-up: replace corroded exhaust fan found during AC visit.','PENDING','LOW',
 CURRENT_DATE + INTERVAL '2 day 11 hour', CURRENT_DATE + INTERVAL '2 day 12 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-09','co-demo-001','JOB-DEMO-C09','demo-customer-012','Olivia Garcia','olivia.garcia@example.com','(555) 210-0012',
 'Liberty Plaza area, 250 R A De Mel Mawatha, Colombo 03',6.9138,79.8528,
 'Shop cold room service','Retail cold room not holding temperature during afternoon peak.','PENDING','HIGH',
 CURRENT_DATE + INTERVAL '2 day 13 hour', CURRENT_DATE + INTERVAL '2 day 15 hour','user-admin-001',false,false,NOW(),NOW()),
('demo-job-colombo-10','co-demo-001','JOB-DEMO-C10','demo-customer-016','Noah Kim','noah.kim@example.com','(555) 210-0016',
 '120 Pannipitiya Road, Battaramulla',6.8964,79.9181,
 'Garden pump + sprinkler check','Irrigation pump losing pressure; check foot valve and lines.','PENDING','NORMAL',
 CURRENT_DATE + INTERVAL '2 day 15 hour', CURRENT_DATE + INTERVAL '2 day 17 hour','user-admin-001',false,false,NOW(),NOW());
COMMIT;
SELECT "jobNumber", title, status, priority, "scheduledStart" FROM jobs.jobs WHERE id LIKE 'demo-job-colombo-%' ORDER BY "scheduledStart";
