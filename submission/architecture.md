# Architecture

```text
Bitget Skill Hub-style adapters
           |
           v
Autonomous agent proposal
           |
           v
Regime classifier -> Risk firewall (15 explainable checks)
                           |
          +----------------+----------------+
          |                |                |
       ALLOW         REDUCE_SIZE       REVIEW / BLOCK
          |                |                |
          +-------> Simulation             |
                       |                    |
                       +--------+-----------+
                                v
                 Decision recorder + SQLite ledger
                                |
              +-----------------+------------------+
              v                 v                  v
          Dashboard          Audit logs          Reports / SDK
```

The Bitget adapter is intentionally isolated behind a live-trading guard. Simulation is the default and the current order adapter refuses live execution.
