# ISCMS — Test Login Credentials

All seeded accounts share one password: **`password123`**

App URL: `http://localhost:3000` (start with `npm run dev`)

---

## Directorate (view + approve only)

| Role | Name | Email |
|---|---|---|
| General Manager | Sarah Akello | sarah.akello@iscms.ug |
| Director | Daniel Mugisha | daniel.mugisha@iscms.ug |

## Human Resources

| Role | Name | Email |
|---|---|---|
| HR Manager | Grace Nakato | grace.nakato@iscms.ug |
| HR Assistant | Rebecca Nansubuga | rebecca.nansubuga@iscms.ug |
| Records Officer | Agnes Nantege | agnes.nantege@iscms.ug |

## Marketing

| Role | Name | Email |
|---|---|---|
| Business Development Manager | Ivan Ssebana | ivan.ssebana@iscms.ug |
| Sales and Marketing Supervisor (Kampala) | Patricia Akello | patricia.akello@iscms.ug |
| Sales and Marketing Supervisor (Mbarara) | Kenneth Tumusiime | kenneth.tumusiime@iscms.ug |

## Operations

| Role | Name | Email |
|---|---|---|
| Operations Manager | Emma Muwonge | emma.muwonge@iscms.ug |
| Regional Manager (Mbarara) | Peter Okello | peter.okello@iscms.ug |
| Regional Manager (Gulu) | Betty Auma | betty.auma@iscms.ug |
| Fleet Manager | Francis Ogwang | francis.ogwang@iscms.ug |
| Training Officer | James Wamala | james.wamala@iscms.ug |
| Investigations Officer | Henry Kiyingi | henry.kiyingi@iscms.ug |
| Guard Officer | Tom Ssemakula | tom.ssemakula@iscms.ug |
| Armorer | Joseph Ochieng | joseph.ochieng@iscms.ug |
| K9 Supervisor | Diana Alowo | diana.alowo@iscms.ug |
| K9 Handler | Peter Okot | peter.okot@iscms.ug |

## Finance

| Role | Name | Email |
|---|---|---|
| Finance Manager | David Ssenyonga | david.ssenyonga@iscms.ug |
| Accountant | Martha Kemigisha | martha.kemigisha@iscms.ug |
| Assistant Accountant  | Sandra Namutebi | sandra.namutebi@iscms.ug |
| Assistant Accountant  | Brian Mugerwa | brian.mugerwa@iscms.ug |
| Internal Auditor | Agnes Tumusiime | agnes.tumusiime@iscms.ug |
| Cashier | Winnie Nabukenya | winnie.nabukenya@iscms.ug |

## Administration

| Role | Name | Email |
|---|---|---|
| Administrative Officer | Alice Nabatanzi | alice.nabatanzi@iscms.ug |

## Information Technology

| Role | Name | Email |
|---|---|---|
| IT Officer | Joseph Kizza | joseph.kizza@iscms.ug |

---

## Quick Test Scenarios

**Client contract approval chain (Marketing → Finance → GM for ≥100M):**
1. Login as **Patricia Akello** (Sales and Marketing Supervisor) → create a new Client Contract → it becomes `Draft` at step BD.
2. Login as **Ivan Ssebana** (Business Development Manager) → approve BD step → moves to Finance.
3. Supporting step (not an approval): login as **Emma Muwonge** (Ops Manager) → record a site survey on the contract. Ops Manager/RM approves nothing and voids nothing — site-survey contribution only.
4. Login as **David Ssenyonga** (Finance Manager) → approve → `Active` (values < 100M finish here; ≥ 100M UGX go to GM next).
5. For high-value contracts (≥ 100M): login as **Sarah Akello** (GM) → final approve → `Active`.
6. Login as **Agnes Nantege** (Records Officer) → archive any contract.

**Staff contract chain (HR):**
1. Login as **Rebecca Nansubuga** (HR Assistant) → create a Staff Contract → `Draft`.
2. Login as **Grace Nakato** (HR Manager) → Issue → `Active`.
3. HR Manager can also void (terminate) with a reason; Records Officer archives.

**Things to check:**
- Statuses `Expiring Soon` / `Expired` update automatically from `endDate`.
- Records Officer can archive but **cannot** approve, void, edit, or delete contracts.
- BDM cannot approve beyond its own step; HR Assistant cannot issue staff contracts.
- Contracts and guards are **void/archive-only** (no hard delete). Hard delete exists on supporting records only: trips, patrol inspections, roster entries, requisitions, training cohorts, trainees, IT servers/tickets/assets, K9s, K9 health inspections, armoury items, regions, documents, and custom roles.
