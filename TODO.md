# Survey Changes TODO List

## Database Changes
- [ ] Add `question_ids` JSON column to `surveys` table

## Code Changes in models/surveys.py
- [ ] Update `create_survey_transactional` to accept array of question IDs
- [ ] Update `submit_responses` to accept array of scores
- [ ] Add `get_questions_by_ids` method to fetch questions from motivara_questions table
- [ ] Update API endpoints

## Testing
- [ ] Test create-surveys endpoint
- [ ] Test submit responses endpoint
- [ ] Test get survey results endpoint
