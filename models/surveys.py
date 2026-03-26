from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
from database import get_cursor, get_db

survey_bp = Blueprint("survey", __name__)

class Survey:
    @staticmethod
    def create_survey_transactional(data):
        """
        Creates a survey and maps existing question IDs to it.
        Expects: { 
            'type': str, 
            'creator_email': str,
            'question_ids': [1, 2, 3], 
            'participants': ['email@example.com'] 
        }
        """
        conn = None
        try:
            conn = get_db()
            cursor = get_cursor()
            
            # 1. Create the Survey Record with the creator's email
            cursor.execute(
                "INSERT INTO surveys (survey_type, total_questions, question_ids, created_by_email) VALUES (%s, %s, %s, %s)",
                (data['type'], len(data['question_ids']), str(data['question_ids']), data['creator_email'])
            )
            survey_id = cursor.lastrowid

            # 2. Insert Participants and Generate Unique Links
            participant_links = []
            for email in data['participants']:
                ref = str(uuid.uuid4())[:8]
                cursor.execute(
                    "INSERT INTO survey_participants (survey_id, email, reference_number) VALUES (%s, %s, %s)",
                    (survey_id, email, ref)
                )
                participant_links.append({"email": email, "link": f"/take-survey/{ref}"})

            conn.commit()
            return {"survey_id": survey_id, "links": participant_links}
        except Exception as e:
            if conn: conn.rollback()
            print(f"Database Error: {e}")
            return None

    @staticmethod
    def submit_responses(reference_number, responses):
        """
        Expects:
        {
            "reference_number": "abc123",
            "responses": [
                4, 5, 3, 2
                ...
            ]
        }
        """
        conn = None
        try:
            conn = get_db()
            cursor = get_cursor()

            cursor.execute(
                "SELECT id, survey_id, is_completed FROM survey_participants WHERE reference_number = %s", 
                (reference_number,)
            )
            participant = cursor.fetchone()
            
            if not participant or participant[2]: 
                return False

            reference_id = participant[0]
            
            # Score is determined by the response value (assuming 1-5 scale)
            total_score = sum(responses) if responses else 0
            average_score = total_score / len(responses) if responses else 0    

            cursor.execute(
                "INSERT INTO survey_responses (reference_id, response, score) VALUES (%s, %s, %s)",
                (reference_number, str(responses), average_score)  # Store response as string for simplicity
            )

            cursor.execute(
                "UPDATE survey_participants SET is_completed = 1, completed_at = %s WHERE id = %s",
                (datetime.now(), reference_id)
            )

            conn.commit()
            return True
        except Exception as e:
            if conn: conn.rollback()
            print(f"Submission Error: {e}")
            return False

# --- API ROUTES ---

@survey_bp.route("/create-surveys", methods=["POST"])
def api_create_survey():
    data = request.get_json()
    # Validation updated to ensure creator_email is present
    required = ['type', 'creator_email', 'question_ids', 'participants']
    if not data or not all(k in data for k in required):
        return jsonify({"message": f"Missing details. Required: {required}"}), 400
    
    result = Survey.create_survey_transactional(data)
    if result:
        return jsonify({
            "message": "Survey created successfully",
            "survey_id": result['survey_id'],
            "participant_links": result['links']
        }), 201
    return jsonify({"message": "Error creating survey"}), 500

@survey_bp.route("/user/<string:email>/surveys", methods=["GET"])
def api_get_surveys_per_user(email):
    """
    Returns all surveys created by a specific email address
    """
    try:
        cursor = get_cursor()
        query = "SELECT id, survey_type, total_questions, created_at FROM surveys WHERE created_by_email = %s ORDER BY created_at DESC"
        cursor.execute(query, (email,))
        surveys = cursor.fetchall()
        
        # Format results as a list of dictionaries
        survey_list = [
            {
                "survey_id": s[0], 
                "type": s[1], 
                "total_questions": s[2], 
                "created_at": s[3]
            } for s in surveys
        ]
        return jsonify({"email": email, "surveys": survey_list}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@survey_bp.route("/take-survey/<string:ref>", methods=["GET"])
def api_take_survey(ref):
    try:
        cursor = get_cursor()
        query = """
            SELECT s.id, s.survey_type, s.question_ids, s.created_by_email
            FROM survey_participants p
            JOIN surveys s ON p.survey_id = s.id
            WHERE p.reference_number = %s AND p.is_completed = 0
        """
        cursor.execute(query, (ref,))
        survey = cursor.fetchone()
        
        if not survey:
            return jsonify({"message": "Invalid link or survey already completed"}), 400
        
        return jsonify({
            "survey_id": survey[0],
            "type": survey[1],
            "question_ids": eval(survey[2]),
            "created_by_email": survey[3]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@survey_bp.route("/submit", methods=["POST"])
def api_submit_survey():
    data = request.get_json()
    ref = data.get("reference_number")
    responses = data.get("responses")

    if not ref or not responses:
        return jsonify({"message": "Reference number and responses required"}), 400

    success = Survey.submit_responses(ref, responses)
    if success:
        return jsonify({"message": "Responses recorded successfully"}), 200
    return jsonify({"message": "Invalid link or survey already completed"}), 400

@survey_bp.route("/<int:survey_id>", methods=["GET"])
def api_get_survey_details(survey_id):
    try:
        cursor = get_cursor()
        query = "SELECT id, survey_type, total_questions, created_at, (SELECT COUNT(*) FROM survey_participants WHERE survey_id = %s) as participant_count FROM surveys WHERE id = %s"
        cursor.execute(query, (survey_id,))
        survey = cursor.fetchone()
        
        if not survey:
            return jsonify({"message": "Survey not found"}), 404
        
        return jsonify({
            "survey_id": survey[0],
            "type": survey[1],
            "total_questions": survey[2],
            "created_at": survey[3]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@survey_bp.route("/<int:survey_id>/results", methods=["GET"])
def api_get_survey_results(survey_id):
    try:
        cursor = get_cursor() 
        # Get the participants list and their responses for the survey
        query= """
        SELECT s.survey_type, s.total_questions, s.status, s.question_ids, s.created_at ,p.email, p.is_completed, p.completed_at, r.response 
        FROM survey_participants AS p
        JOIN survey_responses AS r ON p.reference_number = r.reference_id
        JOIN surveys AS s ON s.id = p.survey_id
        WHERE s.id = %s;
        """
        cursor.execute(query, (survey_id,))  # Ensure survey_id is passed correctly
        participants = cursor.fetchall()

        return jsonify({
            "survey_id": survey_id, 
            "participants": participants
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500