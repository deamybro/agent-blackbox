"use client";
import { useEffect, useMemo, useState } from "react";
import { DecisionTable } from "@/components/dashboard-client";
import type { Decision, Verdict } from "@/lib/types";

export function AuditClient(){
  const [rows,setRows]=useState<Decision[]>([]),[symbol,setSymbol]=useState("ALL"),[verdict,setVerdict]=useState<"ALL"|Verdict>("ALL"),[agent,setAgent]=useState("");
  useEffect(()=>{fetch("/api/decisions",{cache:"no-store"}).then(r=>r.json()).then(setRows)},[]);
  const filtered=useMemo(()=>rows.filter(d=>(symbol==="ALL"||d.symbol===symbol)&&(verdict==="ALL"||d.riskVerdict===verdict)&&d.agentName.toLowerCase().includes(agent.toLowerCase())),[rows,symbol,verdict,agent]);
  return <><div className="topline"><div><span className="eyebrow">Flight recorder</span><h1>Audit trail</h1><p className="muted">Every perception, decision, risk check, action, and outcome.</p></div></div><div className="card"><div className="filters"><select className="input" value={symbol} onChange={e=>setSymbol(e.target.value)}><option>ALL</option>{[...new Set(rows.map(d=>d.symbol))].map(x=><option key={x}>{x}</option>)}</select><select className="input" value={verdict} onChange={e=>setVerdict(e.target.value as typeof verdict)}>{["ALL","ALLOW","REDUCE_SIZE","HUMAN_REVIEW","BLOCK"].map(x=><option key={x}>{x}</option>)}</select><input className="input" placeholder="Filter agent name" value={agent} onChange={e=>setAgent(e.target.value)}/><span className="muted" style={{padding:10}}>{filtered.length} events</span></div><DecisionTable decisions={filtered}/></div></>;
}
