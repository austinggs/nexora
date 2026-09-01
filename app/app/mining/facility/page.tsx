import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { saveFacility } from './actions'

export default async function FacilityPage() {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Facility simulator</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data:facility }, { data:rig }] = await Promise.all([
    supabase.from('mining_facilities').select('*').eq('user_id',user.id).maybeSingle(),
    supabase.from('rigs').select('id,name').eq('user_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),
  ])
  const evaluation = rig ? await supabase.rpc('evaluate_rig_facility',{p_rig_id:rig.id}) : { data:null }
  const saveFacilityAction = async (formData: FormData) => { 'use server'; await saveFacility(formData) }

  return <>
    <div className="topbar"><div><div className="eyebrow">Crystal Caverns / Facility</div><h1>Power & thermal environment.</h1><div className="muted">Model the room before you push the rig.</div></div><Link className="btn secondary" href="/app/mining">Back to mining</Link></div>
    <div className="grid">
      <section className="glass section"><div className="section-head"><h3>Facility configuration</h3><span className="muted">server validated</span></div>
        <form action={saveFacilityAction} style={{display:'grid',gap:12}}>
          <label>Voltage<select name="voltage" defaultValue={String(facility?.voltage_v ?? 230)}><option value="120">120 V</option><option value="230">230 V</option><option value="240">240 V</option><option value="380">380 V</option><option value="400">400 V</option><option value="415">415 V</option></select></label>
          <label>Phase<select name="phase" defaultValue={facility?.phase ?? 'single'}><option value="single">Single phase</option><option value="three">Three phase</option></select></label>
          <label>Service / breaker amps<input type="number" min="1" name="amps" defaultValue={facility?.service_amps ?? 16}/></label>
          <label>Ambient temperature °C<input type="number" step="0.1" min="-20" max="60" name="ambient" defaultValue={facility?.ambient_temp_c ?? 24}/></label>
          <label>Room volume m³<input type="number" step="0.1" min="1" name="volume" defaultValue={facility?.room_volume_m3 ?? 30}/></label>
          <label>Airflow CFM<input type="number" min="0" name="airflow" defaultValue={facility?.airflow_cfm ?? 250}/></label>
          <label>Exhaust CFM<input type="number" min="0" name="exhaust" defaultValue={facility?.exhaust_cfm ?? 0}/></label>
          <label>Active cooling capacity W<input type="number" min="0" name="cooling" defaultValue={facility?.cooling_capacity_w ?? 1000}/></label>
          <button className="btn" type="submit">Save facility</button>
        </form>
      </section>
      <section className="glass section"><div className="section-head"><h3>Live safety evaluation</h3><span className="muted">{rig?.name ?? 'No rig'}</span></div>
        {evaluation.data ? <><div className="notice"><strong>{evaluation.data.status === 'ok' ? 'Facility operating within limits' : 'Facility unsafe for this rig'}</strong><div className="muted" style={{marginTop:6,fontSize:12}}>{evaluation.data.reason}</div></div><div className="stats" style={{marginTop:14}}><div className="mining-stat"><div className="muted">Load</div><div className="value">{evaluation.data.load_amps} A</div></div><div className="mining-stat"><div className="muted">Limit</div><div className="value">{evaluation.data.circuit_limit_amps} A</div></div><div className="mining-stat"><div className="muted">Room</div><div className="value">{evaluation.data.estimated_room_temp_c}°C</div></div></div></> : <p className="muted">Create a rig and save a facility profile to evaluate power and thermal safety.</p>}
      </section>
    </div>
  </>
}
