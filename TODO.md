# TODO

- [x] Implement session-based chat memory for `/api/analyze/company-data` in `app.py`:

  - [ ] Add `chat_id` generation and persistence in Flask `session`
  - [ ] Store `company_chat_history` as message list and keep initial system prompt
  - [ ] Initialize/append history depending on whether `analyze-files` is present
  - [ ] Add `reset` support to clear history
  - [ ] Trim history to a safe max length (cap turns)
  - [ ] Return `chat_id` in API response
- [ ] Quick test via local request flow (2 calls) and ensure JSON schema still matches frontend expectations

