insert into public.hardware_catalog(category,brand,model,specification,base_hash_rate,heat_generation,virtual_price,compatibility_rank) values
('gpu','nvidia','RTX 5090','{"base_hash":1200000,"heat_gen":8}',1200000,8,50000,'legendary'),
('gpu','nvidia','RTX 5080','{"base_hash":1000000,"heat_gen":7}',1000000,7,40000,'epic'),
('gpu','nvidia','RTX 4080','{"base_hash":800000,"heat_gen":6}',800000,6,30000,'rare'),
('gpu','amd','RX 7900 XTX','{"base_hash":1100000,"heat_gen":9}',1100000,9,45000,'epic'),
('gpu','intel','Arc A770','{"base_hash":400000,"heat_gen":6}',400000,6,15000,'uncommon'),
('gpu','apple','M3 Ultra','{"base_hash":900000,"heat_gen":3}',900000,3,60000,'legendary')
on conflict (category,brand,model) do nothing;

insert into public.categories(name,slug) values
('Creator economy','creator-economy'),('PC builders','pc-builders'),('Community','community'),('Technology','technology')
on conflict (slug) do nothing;

insert into public.topics(category_id,name,slug)
select id,'Verified earning','verified-earning' from public.categories where slug='creator-economy'
on conflict (slug) do nothing;
insert into public.topics(category_id,name,slug)
select id,'Rig builds','rig-builds' from public.categories where slug='pc-builders'
on conflict (slug) do nothing;

insert into public.opportunities(sponsor_name,title,description,reward_amount,duration_minutes,budget_remaining,status)
values
('NEXORA Labs','Product feedback sprint','Share structured feedback on a new community workflow.',80,12,8000,'active'),
('NEXORA Labs','Creator discovery survey','Tell us what makes sponsored opportunities feel trustworthy.',45,7,5000,'active'),
('Community Partners','Community onboarding','Help improve the first-run onboarding experience.',25,5,2500,'active')
on conflict do nothing;
