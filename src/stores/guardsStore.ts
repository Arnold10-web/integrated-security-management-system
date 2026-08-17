import { create } from "zustand";
import type { Guard } from "../types";
import { domainApi } from "../services/domainApi";

interface GuardsState {
  guards: Guard[];
  loading: boolean;
  error: string | null;
  pagination: { page:number; limit:number; total:number };
  fetchGuards: (params?: { region?:string; status?:string; page?:number; limit?:number; search?:string}) => Promise<void>;
  addGuard: (g: Omit<Guard,"id">) => Promise<void>;
}

export const useGuardsStore = create<GuardsState>((set, get)=>({
  guards: [],
  loading:false,
  error:null,
  pagination:{ page:1, limit:50, total:0 },
  fetchGuards: async (params)=>{
    set({loading:true, error:null});
    try{
      const q=new URLSearchParams();
      if(params?.region) q.set("region", params.region);
      if(params?.status) q.set("status", params.status);
      if(params?.page) q.set("page", String(params.page));
      if(params?.limit) q.set("limit", String(params.limit));
      if(params?.search) q.set("search", params.search);
      const res=await domainApi.guards.list().catch(async()=>{
        // Fallback to raw fetch with pagination (domainApi currently loads full table)
        const r=await fetch(`/api/guards?${q.toString()}`, { headers: { Authorization:`Bearer ${localStorage.getItem("iscms_access_token")||""}` }});
        const j=await r.json(); return j.data ?? j;
      });
      // domainApi returns array; paginated endpoint returns {data,total}
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const total = Array.isArray(res) ? res.length : (res.total ?? res.length);
      set({guards:data, pagination:{ page:params?.page??1, limit:params?.limit??50, total }, loading:false});
    }catch(e:any){ set({error:e.message, loading:false}); throw e; }
  },
  addGuard: async (g)=>{
    set({loading:true, error:null});
    try{
      await fetch("/api/guards", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("iscms_access_token")||""}` }, body:JSON.stringify(g)}).then(r=>{ if(!r.ok) throw new Error("Create failed"); return r.json(); });
      await get().fetchGuards();
    }catch(e:any){ set({error:e.message, loading:false}); throw e; }
    set({loading:false});
  }
}));
