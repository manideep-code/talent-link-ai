

from rest_framework.permissions import BasePermission

class CanSendMessage(BasePermission):
    def has_object_permission(self, request, view, conversation):
        user = request.user
        
        # 1. Allow if the user is a participant in the conversation
        if user in conversation.participants.all():
            return True
        
        # 2. (Optional) Your legacy proposal checks
        try:
            proposal = conversation.proposal
            if user == proposal.client:
                return proposal.status in ['sent', 'accepted']
            if user == proposal.freelancer:
                return proposal.status == 'accepted'
        except AttributeError:
            # If conversation has no proposal linked, ignore this check
            pass
        
        return False