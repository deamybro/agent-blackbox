import { getDecisions } from "@/lib/db/store";
import { checkRisk } from "@/lib/risk/engine";
import { processProposal } from "@/lib/service";
import type { Proposal } from "@/lib/types";

export const blackbox = {
  check: (proposal: Proposal) => checkRisk(proposal),
  record: (proposal: Proposal) => processProposal(proposal),
  runSimulation: (proposal: Proposal) => processProposal(proposal),
  getAuditTrail: () => getDecisions()
};
