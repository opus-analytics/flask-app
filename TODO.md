# TODO

- [ ] Update `analyze_company_data_new()` prompts in `app.py`:
  - [ ] Introduce a shared `generic_any_mode_instructions` block used in Analysis/Index/Chat modes
  - [ ] Add an explicit rule: never return formula text/blocks; only describe results and high-level calculation approach
  - [ ] Improve user-facing tone in `analysis_narrative` instructions
  - [ ] Reduce repeated information in chat mode by adding a “no repetition” instruction + tighter response scope
  - [ ] Add an instruction that the assistant should confirm understanding briefly before presenting the report (without asking the user to verify)
- [ ] Implement prompt edits
- [ ] Run quick syntax check (`python -m py_compile app.py`)
