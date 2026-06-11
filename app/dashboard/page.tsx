import { DashboardClient } from "@/components/dashboard-client";
export default async function Dashboard({searchParams}:{searchParams:Promise<{run?:string}>}){return <main className="appmain"><div className="container"><DashboardClient autoRun={(await searchParams).run==="safe"}/></div></main>}
