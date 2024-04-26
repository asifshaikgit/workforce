select id from timesheets 
join timesheet_weeks on timesheet_weeks.timesheet_id = timesheets.id 
join timesheet_hours on timesheet_hours.timesheet_week_id = timesheet_weeks.id
where timesheets.id = '91a2f8f0-29b7-4754-b1e8-1e05ce04ca7f'


select access_token from employee where email_id = 'hemanth@codetru.com'


select SUM(CASE WHEN invoice_raised is false THEN EXTRACT(epoch FROM billable_hours) ELSE 0 END) AS total_seconds
from timesheet_hours where id in (738,739,745,746,747,748,751,752,753,754,755,756,757)

select "tsh"."id" from "timesheet_hours" as "tsh" inner join "timesheet_weeks" as "tsw" on "tsh"."timesheet_week_id" = "tsw"."id" inner join "timesheets" as "ts" on "tsw"."timesheet_id" = "ts"."id" inner join "placements" as "pla" on "ts"."placement_id" = "pla"."id" inner join "employee" as "e" on "pla"."employee_id" = "e"."id" where "tsh"."deleted_at" is null and "ts"."id" = 'd834f85e-29a2-4a2e-92b9-eee2e3e17606' and "tsh"."invoice_raised" = false


select "au"."approver_id", "cl"."timesheet_approval_id" from clients as "cl"
join approval_settings as "as" on cl.timesheet_approval_id  = "as"."id"
join approval_levels as "al" on "al"."approval_setting_id" = "as"."id"
join approval_users as "au" on "au"."approval_level_id" = "al"."id"
where "cl"."id" = 'eee5cb01-1091-4a64-a06f-6ce96922fb41' and "as"."deleted_at" is null
 

 select * from employee where display_name = 'Venkata Rama Subrahmanyam Jakka'
select * from placements where employee_id = '8f539d0b-3d10-4442-898d-f476f79abcd9'
select * from timesheets where placement_id = '8881aaa7-57b9-4e9d-a16f-7f3a31211a73'
select * from timesheet_hours where timesheet_id = '123a816f-6631-4939-87e8-1531f242d27b'
delete from timesheet_hours where timesheet_id = '123a816f-6631-4939-87e8-1531f242d27b'
select * from payroll_configuration

select * from payroll_payment_details where payroll_configuration_id = 4 and employee_id = '8f539d0b-3d10-4442-898d-f476f79abcd9'
select * from payroll where payroll_configuration_id = 4 and employee_id = '8f539d0b-3d10-4442-898d-f476f79abcd9'

select "a"."id", "a"."approval_module", "a"."is_global",
"a"."approval_count", "create"."display_name" as "create_emp", 
"update"."display_name" as "updated_emp" 
from "approval_settings" as "a" 
left join "employee" as "create" on "a"."created_by" = "create"."id" 
left join "employee" as "update" on "a"."updated_by" = "update"."id" 
where "a"."deleted_at" is null and "a"."id" = 22

update tenant set is_active = 'false', is_verified='false' where database_name = 'monday'

show max_connections;
SELECT COUNT(*) from pg_stat_activity;

select min_val, max_val from pg_settings where name='max_connections';

SELECT datname, numbackends FROM pg_stat_database;

SELECT * FROM pg_stat_activity WHERE datname='backend';

sudo systemctl restart redis



update timesheet_hours 
JOIN timesheets as timesheets ON timesheets.id = timesheet_hours.timesheet_id
JOIN placements as placements ON placements.id = timesheets.placement_id
JOIN employee as emp  ON emp.id = placements.employee_id
JOIN payroll_config_settings as pcs  ON pcs.id = emp.payroll_config_settings_id
JOIN payroll_configuration as pc  ON pc.id = pcs.pay_config_setting_id
set payroll_raised = true 
WHERE timesheet_hours.date >= '' and timesheet_hours.date <= '' and pc.


        { table: 'payroll_config_settings as pcs', alias: 'pcs', condition: ['payroll_configuration.pay_config_setting_id', 'pcs.id'] },
        { table: 'employee as emp', alias: 'emp', condition: ['emp.payroll_config_settings_id', 'pcs.id'] },
        { table: 'placements as placements', alias: 'placements', condition: ['placements.employee_id', 'emp.id'] },
        { table: 'timesheets as timesheets', alias: 'timesheets', condition: ['timesheets.placement_id', 'placements.id'] },
        { table: 'timesheet_hours as timesheet_hours', alias: 'timesheet_hours', condition: ['timesheet_hours.timesheet_id', 'timesheets.id'] },
    ]


// "eslint": "^8.45.0",
// "eslint-config-standard": "^17.1.0",
// "eslint-plugin-import": "^2.28.0",
// "eslint-plugin-n": "^16.0.1",
// "eslint-plugin-node": "^11.1.0",
// "eslint-plugin-promise": "^6.1.1",
// "eslint-plugin-security": "^1.7.1",

  "eslintConfig": {
    "root": true,
    "env": {
      "node": true,
      "es6": true
    },
    "extends": [
      "eslint:recommended",
      "plugin:node/recommended"
    ],
    "parserOptions": {
      "ecmaVersion": 12,
      "sourceType": "module"
    },
    "rules": {
      "no-console": "off",
      "no-unused-vars": "warn",
      "no-alert": "error",
      "indent": [
        "error",
        2
      ],
      "quotes": [
        "error",
        "single"
      ],
      "semi": [
        "error",
        "always"
      ],
      "comma-dangle": [
        "error",
        "always-multiline"
      ],
      "object-curly-spacing": [
        "error",
        "always"
      ],
      "array-bracket-spacing": [
        "error",
        "never"
      ],
      "arrow-parens": [
        "error",
        "always"
      ],
      "no-throw-literal": "error",
      "no-var": "error",
      "node/no-unpublished-require": "off",
      "security/detect-object-injection": "warn"
    }
  }


// Delete timesheets
SELECT reference_id FROM public.placements where reference_id='PLS-26';


select id from timesheets where placement_id ='dc6cfa01-604d-44b7-b073-33e0860725c7'

select id from timesheet_weeks where timesheet_id in 
(select id from timesheets where placement_id ='dc6cfa01-604d-44b7-b073-33e0860725c7')

select id from timesheet_hours where timesheet_week_id in (select id from timesheet_weeks where timesheet_id in 
(select id from timesheets where reference_id ='TS-308'))



select timesheet_week_id from timesheet_hours where timesheet_week_id in (select id from timesheet_weeks where timesheet_id in 
(select id from timesheets where placement_id ='6190e46b-7d95-4385-a660-a44bb9f39361')) 
and "timesheet_hours"."date" > '2023-06-30'


delete from timesheet_weeks where id in 
(368,
369,
370,
371,
372,
600,
601,
602,
603,
604)



delete from timesheet_hours where timesheet_week_id in (select id from timesheet_weeks where timesheet_id in 
(select id from timesheets where placement_id ='6190e46b-7d95-4385-a660-a44bb9f39361')) 
and "timesheet_hours"."date" > '2023-06-30'








DELETE from timesheets where placement_id ='dc6cfa01-604d-44b7-b073-33e0860725c7'


SELECT id, reference_id,end_date  FROM public.placements where end_date is not null;


SELECT
    proname AS procedure_name,
    proargtypes AS argument_types,
    prorettype AS return_type,
    proargnames AS argument_names,
    proargmodes AS argument_modes
FROM pg_proc

DROP FUNCTION IF EXISTS getTimesheetsListing();
drop function if exists getExpenseManagementIndex(
                expense_id_filter UUID,
                employment_type_filter SMALLINT,
                employee_id_filter UUID,
                transaction_type_filter SMALLINT,
                search_filter VARCHAR(255),
                page_size INT,
                page_number INT,
                date_format TEXT
            );