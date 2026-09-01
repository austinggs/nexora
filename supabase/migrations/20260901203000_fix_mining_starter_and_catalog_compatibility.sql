create or replace function public.create_my_rig()
returns public.rigs
language plpgsql
set search_path to 'public'
as $function$
declare r public.rigs; gpu_id uuid; cpu_id uuid; board_id uuid; ram_id uuid; cool_id uuid; psu_id uuid;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 select * into r from public.rigs where user_id=auth.uid() order by created_at asc limit 1;
 if r.id is not null then return r; end if;
 select id into gpu_id from public.hardware_catalog where category='gpu' and lower(model)='gtx 1080' limit 1;
 select id into cpu_id from public.hardware_catalog where category='cpu' and lower(model)='core i9-14900k' limit 1;
 select id into board_id from public.hardware_catalog where category='motherboard' and lower(model)='gigabyte z790 ud' limit 1;
 select id into ram_id from public.hardware_catalog where category='ram' and lower(model)='ddr5-6000 32gb udimm' limit 1;
 select id into cool_id from public.hardware_catalog where category='cooling' and lower(model)='240mm aio' limit 1;
 select id into psu_id from public.hardware_catalog where category='psu' and lower(model)='hx1200i' limit 1;
 if gpu_id is null or cpu_id is null or board_id is null or ram_id is null or cool_id is null or psu_id is null then raise exception 'starter hardware catalog is incomplete'; end if;
 insert into public.rigs(user_id,name,gpu_brand,gpu_model,cpu_brand,cpu_model,ram_type,ram_capacity,psu_capacity,cooling_unit,current_hash_rate,config,motherboard_model)
 select auth.uid(),'NEX-01',g.brand,g.model,c.brand,c.model,'DDR5',32,coalesce((p.specification->>'capacity_w')::int,1200),'aio',0,
 jsonb_build_object('overclocked',false,'overclock_bias',0.5,'biome','crystal_caverns','heat',42,'pending_dust',0,'block_count',0,'configured_power_w',coalesce((g.specification->>'power_w')::int,180)+coalesce((c.specification->>'power_w')::int,120)+coalesce((k.specification->>'power_w')::int,12)+60,'gpu_temp_limit_c',94),b.model
 from public.hardware_catalog g, public.hardware_catalog c, public.hardware_catalog b, public.hardware_catalog k, public.hardware_catalog p
 where g.id=gpu_id and c.id=cpu_id and b.id=board_id and k.id=cool_id and p.id=psu_id
 returning * into r;
 r.current_hash_rate:=public.get_rig_stats(r);
 update public.rigs set current_hash_rate=r.current_hash_rate where id=r.id returning * into r;
 insert into public.user_hardware(user_id,hardware_id,quantity,equipped)
 values (auth.uid(),gpu_id,1,true),(auth.uid(),cpu_id,1,true),(auth.uid(),board_id,1,true),(auth.uid(),ram_id,1,true),(auth.uid(),cool_id,1,true),(auth.uid(),psu_id,1,true)
 on conflict(user_id,hardware_id) do update set quantity=greatest(user_hardware.quantity,1), equipped=true;
 return r;
end;
$function$;

create or replace function public.purchase_hardware(p_hardware_id uuid)
returns public.user_hardware
language plpgsql
set search_path to 'public'
as $function$
declare v_user uuid:=auth.uid(); h public.hardware_catalog; inv public.user_hardware; dust numeric; price bigint;
begin
 if v_user is null then raise exception 'not authenticated'; end if;
 select * into h from public.hardware_catalog where id=p_hardware_id for update;
 if h.id is null then raise exception 'hardware not found'; end if;
 if h.virtual_price is null or h.virtual_price<=0 then raise exception 'hardware pricing is not available yet'; end if;
 price:=h.virtual_price;
 select coalesce((config->>'pending_dust')::numeric,0) into dust from public.rigs where user_id=v_user limit 1 for update;
 if dust < price then raise exception 'insufficient Dust'; end if;
 update public.rigs set config=jsonb_set(config,'{pending_dust}',to_jsonb(dust-price)),updated_at=now() where user_id=v_user;
 insert into public.user_hardware(user_id,hardware_id,quantity) values(v_user,h.id,1) on conflict(user_id,hardware_id) do update set quantity=user_hardware.quantity+1 returning * into inv;
 return inv;
end;
$function$;

create or replace function public.configure_multi_gpu_rig(p_gpu_ids uuid[], p_cpu_id uuid, p_motherboard_id uuid, p_ram_id uuid, p_cooling_id uuid, p_psu_ids uuid[], p_riser_ids uuid[] default '{}')
returns public.rigs
language plpgsql
set search_path to 'public'
as $function$
declare r public.rigs; cpu public.hardware_catalog; board public.hardware_catalog; ram public.hardware_catalog; cool public.hardware_catalog; g public.hardware_catalog; p public.hardware_catalog; riser public.hardware_catalog; req numeric:=0; i int; max_gpu int; total_psu int:=0; connector_needed int:=0; connector_available int:=0; board_socket text; cpu_socket text; board_ram_type text; ram_type text; field text;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if coalesce(array_length(p_gpu_ids,1),0)<1 or coalesce(array_length(p_gpu_ids,1),0)>19 then raise exception 'GPU count must be between 1 and 19'; end if;
 if coalesce(array_length(p_psu_ids,1),0)<1 or coalesce(array_length(p_psu_ids,1),0)>4 then raise exception 'PSU count must be between 1 and 4'; end if;
 select * into r from public.rigs where user_id=auth.uid() order by created_at asc limit 1 for update;
 select * into cpu from public.hardware_catalog where id=p_cpu_id and category='cpu';
 select * into board from public.hardware_catalog where id=p_motherboard_id and category='motherboard';
 select * into ram from public.hardware_catalog where id=p_ram_id and category='ram';
 select * into cool from public.hardware_catalog where id=p_cooling_id and category in ('cooler','cooling');
 if r.id is null or cpu.id is null or board.id is null or ram.id is null or cool.id is null then raise exception 'invalid platform selection'; end if;
 cpu_socket:=coalesce(cpu.specification->>'socket', (select f from jsonb_array_elements_text(coalesce(cpu.specification->'fields','[]'::jsonb)) f where f ~* '^(LGA|AM[0-9]+)' limit 1));
 board_socket:=coalesce(board.specification->>'socket', (select f from jsonb_array_elements_text(coalesce(board.specification->'fields','[]'::jsonb)) f where f ~* '^(LGA|AM[0-9]+)' limit 1));
 ram_type:=coalesce(ram.specification->>'ram_type', (select substring(f from '(DDR[45])') from jsonb_array_elements_text(coalesce(ram.specification->'fields','[]'::jsonb)) f where f ~* 'DDR[45]' limit 1));
 board_ram_type:=coalesce(board.specification->>'ram_type', (select substring(f from '(DDR[45].*)') from jsonb_array_elements_text(coalesce(board.specification->'fields','[]'::jsonb)) f where f ~* 'DDR[45]' limit 1));
 if lower(coalesce(board_socket,''))<>lower(coalesce(cpu_socket,'')) then raise exception 'CPU socket does not match motherboard'; end if;
 if board_ram_type is not null and ram_type is not null and position(lower(ram_type) in lower(board_ram_type))=0 then raise exception 'RAM generation does not match motherboard'; end if;
 field:=(select f from jsonb_array_elements_text(coalesce(board.specification->'fields','[]'::jsonb)) f where f ~* '[0-9]+\+ GPU' limit 1);
 max_gpu:=coalesce(nullif(regexp_replace(coalesce(board.specification->>'gpu_count',field,''),'[^0-9]','','g'),'')::int,1);
 if array_length(p_gpu_ids,1)>max_gpu then raise exception 'motherboard GPU capacity exceeded'; end if;
 for g in select * from public.hardware_catalog where id=any(p_gpu_ids) and category='gpu' loop
   if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=g.id and quantity>0) then raise exception 'GPU not owned: %',g.model; end if;
   req:=req+coalesce((g.specification->>'power_w')::numeric,0);
   connector_needed:=connector_needed+coalesce((g.specification->>'connector_count')::int,1);
 end loop;
 if (select count(*) from unnest(p_gpu_ids))<>(select count(*) from public.hardware_catalog where id=any(p_gpu_ids) and category='gpu') then raise exception 'one or more GPU selections are invalid'; end if;
 if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=cpu.id and quantity>0) then raise exception 'CPU not owned'; end if;
 if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=board.id and quantity>0) then raise exception 'motherboard not owned'; end if;
 if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=ram.id and quantity>0) then raise exception 'RAM not owned'; end if;
 if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=cool.id and quantity>0) then raise exception 'cooler not owned'; end if;
 if array_length(p_gpu_ids,1)>1 then
   if coalesce(array_length(p_riser_ids,1),0)<array_length(p_gpu_ids,1)-1 then raise exception 'one powered riser is required for each GPU beyond the first'; end if;
   for i in 1..array_length(p_gpu_ids,1)-1 loop
     select * into riser from public.hardware_catalog where id=p_riser_ids[i] and category='riser';
     if riser.id is null or not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=riser.id and quantity>0) then raise exception 'riser not owned or invalid'; end if;
   end loop;
 end if;
 for p in select * from public.hardware_catalog where id=any(p_psu_ids) and category='psu' loop
   total_psu:=total_psu+coalesce((p.specification->>'capacity_w')::int,0);
   connector_available:=connector_available+coalesce((p.specification->>'connector_count')::int,4);
   if not exists(select 1 from public.user_hardware where user_id=auth.uid() and hardware_id=p.id and quantity>0) then raise exception 'PSU not owned: %',p.model; end if;
 end loop;
 if (select count(*) from unnest(p_psu_ids))<>(select count(*) from public.hardware_catalog where id=any(p_psu_ids) and category='psu') then raise exception 'one or more PSU selections are invalid'; end if;
 req:=req+coalesce((cpu.specification->>'power_w')::numeric,65)+60;
 if total_psu<ceil(req*1.20) then raise exception 'combined PSU capacity lacks 20 percent headroom'; end if;
 if connector_available<connector_needed then raise exception 'PSU connector capacity is insufficient'; end if;
 if array_length(p_psu_ids,1)>1 and not exists(select 1 from public.user_hardware uh join public.hardware_catalog h on h.id=uh.hardware_id where uh.user_id=auth.uid() and h.category='connector' and h.model ilike '%sync%' and uh.quantity>0) then raise exception 'dual-PSU rigs require PSU sync adapter'; end if;
 delete from public.rig_gpu_slots where rig_id=r.id;
 delete from public.rig_psu_allocations where rig_id=r.id;
 for i in 1..array_length(p_gpu_ids,1) loop
   select * into g from public.hardware_catalog where id=p_gpu_ids[i] and category='gpu';
   insert into public.rig_gpu_slots(rig_id,slot_no,gpu_id,riser_id,psu_id,connector_type,link_width,connector_count)
   values(r.id,i,g.id,nullif(case when i=array_length(p_gpu_ids,1) and coalesce(array_length(p_riser_ids,1),0)>=i then p_riser_ids[i] else p_riser_ids[least(i-1,greatest(array_length(p_riser_ids,1),1))] end,'00000000-0000-0000-0000-000000000000')::uuid,p_psu_ids[least(i,array_length(p_psu_ids,1))],g.specification->>'connector_type',coalesce(g.specification->>'link_width','x16'),coalesce((g.specification->>'connector_count')::int,1));
 end loop;
 for p in select * from public.hardware_catalog where id=any(p_psu_ids) and category='psu' loop
   insert into public.rig_psu_allocations(rig_id,psu_hardware_id,watt_capacity,allocated_watts,sync_required) values(r.id,p.id,coalesce((p.specification->>'capacity_w')::int,0),0,array_length(p_psu_ids,1)>1);
 end loop;
 update public.rigs set gpu_brand=(select brand from public.hardware_catalog where id=p_gpu_ids[1]),gpu_model=(select model from public.hardware_catalog where id=p_gpu_ids[1]),cpu_brand=cpu.brand,cpu_model=cpu.model,psu_capacity=total_psu,ram_type=coalesce(ram_type,'DDR5'),ram_capacity=coalesce((ram.specification->>'capacity_gb')::int,coalesce(nullif(regexp_replace((select f from jsonb_array_elements_text(coalesce(ram.specification->'fields','[]'::jsonb)) f where f ~* '\d+GB' limit 1),'[^0-9]','','g'),'')::int,32)),motherboard_model=board.model,config=jsonb_set(jsonb_set(jsonb_set(config,'{gpu_count}',to_jsonb(array_length(p_gpu_ids,1))),'{gpu_ids}',to_jsonb(p_gpu_ids)),'{psu_ids}',to_jsonb(p_psu_ids)),updated_at=now() where id=r.id returning * into r;
 return r;
end;
$function$;
