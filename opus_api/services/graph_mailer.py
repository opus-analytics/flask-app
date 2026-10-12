import requests
import msal
import os

class AzureGraphMailer:
    """
    Modern replacement for SMTP using Microsoft Graph API.
    Prevents account blocking and handles expired passwords 
    by using OAuth2 Client Secrets.
    """
    def __init__(self):
        # These should be in your .env file
        self.client_id = os.environ.get('AZURE_CLIENT_ID')
        self.client_secret = os.environ.get('AZURE_CLIENT_SECRET')
        self.tenant_id = os.environ.get('AZURE_TENANT_ID')
        self.user_email = os.environ.get('AZURE_SENDER_EMAIL') # e.g. info@yourdomain.com
        
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.scope = ["https://graph.microsoft.com/.default"]
        
        self.app = msal.ConfidentialClientApplication(
            self.client_id, 
            authority=self.authority,
            client_credential=self.client_secret
        )

    def _get_token(self):
        """Acquire access token from Azure AD."""
        result = self.app.acquire_token_silent(self.scope, account=None)
        if not result:
            result = self.app.acquire_token_for_client(scopes=self.scope)
        
        if "access_token" in result:
            return result["access_token"]
        else:
            print(f"Error acquiring token: {result.get('error_description')}")
            return None

    def send_email(self, subject, to_email, body_content, is_html=False):
        """Sends an email via the Microsoft Graph API."""
        token = self._get_token()
        if not token:
            return False

        endpoint = f"https://graph.microsoft.com/v1.0/users/{self.user_email}/sendMail"
        
        email_msg = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML" if is_html else "Text",
                    "content": body_content
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ]
            }
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        response = requests.post(endpoint, json=email_msg, headers=headers)
        
        if response.status_code == 202:
            return True
        else:
            print(f"Error sending email: {response.text}")
            return False

