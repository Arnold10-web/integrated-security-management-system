import { create } from "zustand";
import type { SecurityOfficer } from "../types";
import { domainApi } from "../services/domainApi";

interface SecurityOfficersState {
  securityOfficers: SecurityOfficer[];
  loading: boolean;
  error: string | null;
  pagination: { page:number; limit:number; total:number };
  fetchSecurityOfficers: (params?: { region?:string; status?:string; page?:number; limit?:number; search?:string}) => Promise<void>;
  addSecurityOfficer: (g: Omit<SecurityOfficer,"id">) => Promise<void>;
}

export const useSecurityOfficersStore = create<SecurityOfficersState>((set, get)=>({
  securityOfficers: [],
  loading:false,
  error:null,
  pagination:{ page:1, limit:50, total:0 },
  fetchSecurityOfficers: async (params)=>{
    set({loading:true, error:null});
    try{
      const q=new URLSearchParams();
      if(params?.region) q.set("region", params.region);
      if(params?.status) q.set("status", params.status);
      if(params?.page) q.set("page", String(params.page));
      if(params?.limit) q.set("limit", String(params.limit));
      if(params?.search) q.set("search", params.search);
      const res=await domainApi.securityOfficers.list().catch(async()=>{
        // Fallback to raw fetch with pagination (domainApi currently loads full table)
        const r=await fetch(`/api/security-officers?${q.toString()}`, { headers: { Authorization:`Bearer ${localStorage.getItem("iscms_access_token")||""}` }});
        const j=await r.json(); return j.data ?? j;
      });
      // domainApi returns array; paginated endpoint returns {data,total}
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const total = Array.isArray(res) ? res.length : (res.total ?? res.length);
      set({securityOfficers:data, pagination:{ page:params?.page??1, limit:params?.limit??50, total }, loading:false});
    }catch(e:any){ set({error:e.message, loading:false}); throw e; }
  },
  addSecurityOfficer: async (g)=>{
    set({loading:true, error:null});
    try{
      await fetch("/api/security-officers", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("iscms_access_token")||""}` }, body:JSON.stringify(g)}).then(r=>{ if(!r.ok) throw new Error("Create failed"); return r.json(); });
      await get().fetchSecurityOfficers();
    }catch(e:any){ set({error:e.message, loading:false}); throw e; }
    set({loading:false});
  }
}));
