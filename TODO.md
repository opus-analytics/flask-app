# TODO

- [ ] Implement deterministic prompt formatting fixes in `analyze_company_data_new` (app.py) to enforce stable output for the frontend.
- [ ] Ensure generated narrative includes:
  - [ ] More than one title under the summary.
  - [ ] Long, detailed paragraphs explaining issues.
  - [ ] Tables that always contain explicit numeric content and are visible.
- [ ] Ensure the model excludes any data that came from `user_input` (treat as history).
- [ ] Update prompt to avoid accidental inclusion of user_input content; instead, use only computed stats/columns.
- [ ] Keep output JSON structure fixed as expected by the frontend.
- [ ] Add lightweight validation/fallback when model output misses required fields.
- [ ] Run a quick local syntax check (no runtime execution required).

