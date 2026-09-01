insert into public.hardware_catalog(category,brand,model,specification,base_hash_rate,heat_generation,virtual_price,compatibility_rank) values
('gpu','nvidia','RTX 5090','{"base_hash":1200000,"heat_gen":8}',1200000,8,50000,'legendary'),
('gpu','nvidia','RTX 5080','{"base_hash":1000000,"heat_gen":7}',1000000,7,40000,'epic'),
('gpu','nvidia','RTX 4080','{"base_hash":800000,"heat_gen":6}',800000,6,30000,'rare'),
('gpu','amd','RX 7900 XTX','{"base_hash":1100000,"heat_gen":9}',1100000,9,45000,'epic'),
('gpu','intel','Arc A770','{"base_hash":400000,"heat_gen":6}',400000,6,15000,'uncommon'),
('gpu','apple','M3 Ultra','{"base_hash":900000,"heat_gen":3}',900000,3,60000,'legendary')
on conflict (category,brand,model) do nothing;
