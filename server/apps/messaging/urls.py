from django.urls import path
from .views import ConversationEnsureView, ConversationListView, MessageListCreateView

urlpatterns = [
    path('conversations/', ConversationListView.as_view()),
    path('conversations/ensure/', ConversationEnsureView.as_view()),
    path('conversations/<int:conversation_id>/messages/', MessageListCreateView.as_view()),
]
